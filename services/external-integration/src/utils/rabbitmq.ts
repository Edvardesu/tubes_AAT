import amqp, { Channel, Connection } from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const EXCHANGES = {
  REPORTS: 'reports.exchange',
  EXTERNAL: 'external.exchange',
};

export const QUEUES = {
  EXTERNAL_FORWARD: 'external.forward.queue',
  EXTERNAL_WEBHOOK: 'external.webhook.queue',
};

export async function connectRabbitMQ(): Promise<Channel> {
  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange(EXCHANGES.REPORTS, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGES.EXTERNAL, 'topic', { durable: true });

    // Declare queues
    await channel.assertQueue(QUEUES.EXTERNAL_FORWARD, { durable: true });
    await channel.assertQueue(QUEUES.EXTERNAL_WEBHOOK, { durable: true });

    // Bind queues
    await channel.bindQueue(QUEUES.EXTERNAL_FORWARD, EXCHANGES.REPORTS, 'report.forward.*');
    await channel.bindQueue(QUEUES.EXTERNAL_WEBHOOK, EXCHANGES.EXTERNAL, 'webhook.*');

    logger.info('Connected to RabbitMQ');

    connection.on('error', (error) => {
      logger.error('RabbitMQ connection error:', error);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });

    return channel;
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
}

export async function publishMessage(exchange: string, routingKey: string, message: unknown): Promise<void> {
  const ch = getChannel();
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    contentType: 'application/json',
  });
}
