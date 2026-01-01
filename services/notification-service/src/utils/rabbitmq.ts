import amqplib from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

export interface ReportEvent {
  type: string;
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
    escalationLevel?: number;
    previousLevel?: number;
  };
}

export interface RoutingCompletedEvent {
  type: string;
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

type EventHandler<T> = (event: T) => Promise<void>;

class RabbitMQClient {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private isConnected = false;

  // Exchange and queue names
  private readonly REPORT_EXCHANGE = 'report.events';
  private readonly ROUTING_EXCHANGE = 'routing.events';
  private readonly NOTIFICATION_QUEUE_PREFIX = 'notification';

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

      // Set prefetch to 5 for parallel processing
      await this.channel.prefetch(5);

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

  // Generic consumer setup
  private async setupConsumer(
    queueName: string,
    exchange: string,
    routingKey: string,
    handler: EventHandler<any>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, exchange, routingKey);

    await this.channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString());
          logger.debug('Received event', { type: event.type, queue: queueName });

          await handler(event);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Error processing event', { error, queue: queueName });
          this.channel?.nack(msg, false, false);
        }
      },
      { noAck: false }
    );

    logger.info(`Consumer started for ${queueName}`);
  }

  // Consume report.created events
  async consumeReportCreated(handler: EventHandler<ReportEvent>): Promise<void> {
    await this.setupConsumer(
      `${this.NOTIFICATION_QUEUE_PREFIX}.report.created`,
      this.REPORT_EXCHANGE,
      'report.created',
      handler
    );
  }

  // Consume report.status_changed events
  async consumeReportStatusChanged(handler: EventHandler<ReportEvent>): Promise<void> {
    await this.setupConsumer(
      `${this.NOTIFICATION_QUEUE_PREFIX}.report.status_changed`,
      this.REPORT_EXCHANGE,
      'report.status_changed',
      handler
    );
  }

  // Consume report.assigned events
  async consumeReportAssigned(handler: EventHandler<ReportEvent>): Promise<void> {
    await this.setupConsumer(
      `${this.NOTIFICATION_QUEUE_PREFIX}.report.assigned`,
      this.REPORT_EXCHANGE,
      'report.assigned',
      handler
    );
  }

  // Consume report.escalated events
  async consumeReportEscalated(handler: EventHandler<ReportEvent>): Promise<void> {
    await this.setupConsumer(
      `${this.NOTIFICATION_QUEUE_PREFIX}.report.escalated`,
      this.REPORT_EXCHANGE,
      'report.escalated',
      handler
    );
  }

  // Consume routing.completed events
  async consumeRoutingCompleted(handler: EventHandler<RoutingCompletedEvent>): Promise<void> {
    await this.setupConsumer(
      `${this.NOTIFICATION_QUEUE_PREFIX}.routing.completed`,
      this.ROUTING_EXCHANGE,
      'routing.completed',
      handler
    );
  }
}

export const rabbitmqClient = new RabbitMQClient();
export default rabbitmqClient;
