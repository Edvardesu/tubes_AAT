import amqplib from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

// Event types
export enum ReportEventType {
  REPORT_CREATED = 'report.created',
  REPORT_UPDATED = 'report.updated',
  REPORT_STATUS_CHANGED = 'report.status_changed',
  REPORT_ASSIGNED = 'report.assigned',
  REPORT_ESCALATED = 'report.escalated',
  REPORT_DELETED = 'report.deleted',
}

export interface ReportEvent {
  type: ReportEventType;
  timestamp: string;
  data: {
    reportId: string;
    referenceNumber: string;
    title: string;
    category: string;
    type: string;
    status: string;
    priority: number;
    reporterId?: string;
    departmentId?: string;
    assignedToId?: string;
    oldStatus?: string;
    newStatus?: string;
    notes?: string;
    changedById?: string;
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

  // Publish report event
  async publishReportEvent(event: ReportEvent): Promise<void> {
    if (!this.channel) {
      logger.error('RabbitMQ channel not available');
      return;
    }

    const routingKey = event.type;
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

      logger.info('Report event published', {
        type: event.type,
        reportId: event.data.reportId,
        routingKey,
      });
    } catch (error) {
      logger.error('Failed to publish report event', { error, event });
      throw error;
    }
  }

  // Convenience methods for specific events
  async publishReportCreated(data: ReportEvent['data']): Promise<void> {
    await this.publishReportEvent({
      type: ReportEventType.REPORT_CREATED,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  async publishReportUpdated(data: ReportEvent['data']): Promise<void> {
    await this.publishReportEvent({
      type: ReportEventType.REPORT_UPDATED,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  async publishReportStatusChanged(data: ReportEvent['data']): Promise<void> {
    await this.publishReportEvent({
      type: ReportEventType.REPORT_STATUS_CHANGED,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  async publishReportAssigned(data: ReportEvent['data']): Promise<void> {
    await this.publishReportEvent({
      type: ReportEventType.REPORT_ASSIGNED,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  async publishReportEscalated(data: ReportEvent['data']): Promise<void> {
    await this.publishReportEvent({
      type: ReportEventType.REPORT_ESCALATED,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  async publishReportDeleted(data: ReportEvent['data']): Promise<void> {
    await this.publishReportEvent({
      type: ReportEventType.REPORT_DELETED,
      timestamp: new Date().toISOString(),
      data,
    });
  }
}

export const rabbitmqClient = new RabbitMQClient();
export default rabbitmqClient;
