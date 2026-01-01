import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.error('Redis connection failed after 10 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis error', { error: error.message });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      if (!this.client) {
        return reject(new Error('Redis client not initialized'));
      }

      this.client.once('ready', resolve);
      this.client.once('error', reject);
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  // Cache methods
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(key);
  }

  // Cache report view count
  async incrementViewCount(reportId: string): Promise<number> {
    const key = `report:views:${reportId}`;
    return this.incr(key);
  }

  async getViewCount(reportId: string): Promise<number> {
    const key = `report:views:${reportId}`;
    const count = await this.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  // Cache report data
  async cacheReport(reportId: string, data: unknown, ttlSeconds: number = 300): Promise<void> {
    const key = `report:cache:${reportId}`;
    await this.set(key, JSON.stringify(data), ttlSeconds);
  }

  async getCachedReport(reportId: string): Promise<unknown | null> {
    const key = `report:cache:${reportId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateReportCache(reportId: string): Promise<void> {
    const key = `report:cache:${reportId}`;
    await this.del(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
