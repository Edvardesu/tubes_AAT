import amqplib from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

// Event types
export enum RoutingEventType {
  ROUTING_COMPLETED = 'routing.completed',
}

export interface ReportCreatedEvent {
  type: string;
  timestamp: string;
  data: {
    reportId: string;
    referenceNumber: string;
    title: string;
    description?: string;
    category: string;
    type: string;
    status: string;
    priority: number;
    reporterId?: string;
    locationAddress?: string;
  };
}

export interface RoutingCompletedEvent {
  type: RoutingEventType;
  timestamp: string;
  data: {
    reportId: string;
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    priority: number;
    routingReason: string;
  };
}

type MessageHandler = (event: ReportCreatedEvent) => Promise<void>;

class RabbitMQClient {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private isConnected = false;

  // Exchange and queue names
  private readonly REPORT_EXCHANGE = 'report.events';
  private readonly ROUTING_EXCHANGE = 'routing.events';
  private readonly ROUTING_QUEUE = 'routing.report.created';

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Setup exchanges
      await this.channel.assertExchange(this.REPORT_EXCHANGE, 'topic', {
        durable: true,
      });
      await this.channel.assertExchange(this.ROUTING_EXCHANGE, 'topic', {
        durable: true,
      });

      // Setup queue for consuming report.created events
      await this.channel.assertQueue(this.ROUTING_QUEUE, {
        durable: true,
      });

      // Bind queue to report.created events
      await this.channel.bindQueue(
        this.ROUTING_QUEUE,
        this.REPORT_EXCHANGE,
        'report.created'
      );

      // Set prefetch to 1 for fair dispatch
      await this.channel.prefetch(1);

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

  // Consume report.created events
  async consumeReportCreated(handler: MessageHandler): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.consume(
      this.ROUTING_QUEUE,
      async (msg) => {
        if (!msg) return;

        try {
          const event: ReportCreatedEvent = JSON.parse(msg.content.toString());
          logger.info('Received report.created event', {
            reportId: event.data.reportId,
            referenceNumber: event.data.referenceNumber,
          });

          await handler(event);

          // Acknowledge the message
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Error processing report.created event', { error });
          // Reject and don't requeue on parse errors
          this.channel?.nack(msg, false, false);
        }
      },
      { noAck: false }
    );

    logger.info('Started consuming report.created events');
  }

  // Publish routing.completed event
  async publishRoutingCompleted(data: RoutingCompletedEvent['data']): Promise<void> {
    if (!this.channel) {
      logger.error('RabbitMQ channel not available');
      return;
    }

    const event: RoutingCompletedEvent = {
      type: RoutingEventType.ROUTING_COMPLETED,
      timestamp: new Date().toISOString(),
      data,
    };

    const routingKey = RoutingEventType.ROUTING_COMPLETED;
    const message = JSON.stringify(event);

    try {
      this.channel.publish(
        this.ROUTING_EXCHANGE,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        }
      );

      logger.info('Routing completed event published', {
        reportId: data.reportId,
        departmentId: data.departmentId,
        priority: data.priority,
      });
    } catch (error) {
      logger.error('Failed to publish routing completed event', { error, data });
      throw error;
    }
  }
}

export const rabbitmqClient = new RabbitMQClient();
export default rabbitmqClient;
