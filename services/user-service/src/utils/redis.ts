import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private client: Redis | null = null;
  private connected = false;

  async connect(): Promise<Redis> {
    if (this.client && this.connected) {
      return this.client;
    }

    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    this.client.on('close', () => {
      this.connected = false;
      logger.warn('Redis connection closed');
    });

    return this.client;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.client?.status === 'ready';
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
      logger.info('Redis disconnected');
    }
  }

  // Session management methods
  async setSession(userId: string, sessionData: object, ttlSeconds: number): Promise<void> {
    const key = `session:${userId}`;
    await this.getClient().setex(key, ttlSeconds, JSON.stringify(sessionData));
  }

  async getSession(userId: string): Promise<object | null> {
    const key = `session:${userId}`;
    const data = await this.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.getClient().del(key);
  }

  // Refresh token blacklist
  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.getClient().setex(key, ttlSeconds, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.getClient().get(key);
    return result !== null;
  }

  // Store refresh token
  async storeRefreshToken(userId: string, tokenId: string, ttlSeconds: number): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    await this.getClient().setex(key, ttlSeconds, '1');
  }

  async isRefreshTokenValid(userId: string, tokenId: string): Promise<boolean> {
    const key = `refresh:${userId}:${tokenId}`;
    const result = await this.getClient().get(key);
    return result !== null;
  }

  async invalidateRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    await this.getClient().del(key);
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.getClient().keys(pattern);
    if (keys.length > 0) {
      await this.getClient().del(...keys);
    }
  }
}

export const redisClient = new RedisClient();
export default redisClient;
