import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private client: Redis | null = null;

  async connect(): Promise<void> {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      this.client!.once('ready', () => resolve());
      this.client!.once('error', (err) => reject(err));
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.client?.status === 'ready';
  }
}

export const redisClient = new RedisClient();
