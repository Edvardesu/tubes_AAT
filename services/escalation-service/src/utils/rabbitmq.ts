import amqplib from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

export enum EscalationEventType {
  REPORT_ESCALATED = 'report.escalated',
}

export interface ReportEscalatedEvent {
  type: EscalationEventType;
  timestamp: string;
  data: {
    reportId: string;
    referenceNumber: string;
    title: string;
    category: string;
    type: string;
    status: string;
    priority: number;
    escalationLevel: number;
    previousLevel: number;
    departmentId?: string;
    reporterId?: string;
    reason: string;
  };
}

class RabbitMQClient {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private isConnected = false;

  // Exchange names
  private readonly REPORT_EXCHANGE = 'report.events';

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Setup exchanges
      await this.channel.assertExchange(this.REPORT_EXCHANGE, 'topic', {
        durable: true,
      });

      this.isConnected = true;
      logger.info('RabbitMQ connected');

      // Handle connection close
      this.connection.on('close', () => {
        this.isConnected = false;
        logger.warn('RabbitMQ connection closed');
        this.reconnect();
      });

      this.connection.on('error', (error: Error) => {
        logger.error('RabbitMQ connection error', { error: error.message });
      });
    } catch (error) {
      logger.error('RabbitMQ connection failed', { error });
      throw error;
    }
  }

  private reconnect(): void {
    logger.info('Attempting to reconnect to RabbitMQ...');
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('RabbitMQ reconnection failed', { error });
        this.reconnect();
      }
    }, 5000);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', { error });
    }
    this.isConnected = false;
  }

  isReady(): boolean {
    return this.isConnected && this.channel !== null;
  }

  // Publish report.escalated event
  async publishReportEscalated(data: ReportEscalatedEvent['data']): Promise<void> {
    if (!this.channel) {
      logger.error('RabbitMQ channel not available');
      return;
    }

    const event: ReportEscalatedEvent = {
      type: EscalationEventType.REPORT_ESCALATED,
      timestamp: new Date().toISOString(),
      data,
    };

    const routingKey = EscalationEventType.REPORT_ESCALATED;
    const message = JSON.stringify(event);

    try {
      this.channel.publish(
        this.REPORT_EXCHANGE,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        }
      );

      logger.info('Report escalated event published', {
        reportId: data.reportId,
        escalationLevel: data.escalationLevel,
      });
    } catch (error) {
      logger.error('Failed to publish report escalated event', { error, data });
      throw error;
    }
  }
}

export const rabbitmqClient = new RabbitMQClient();
export default rabbitmqClient;
