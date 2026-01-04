import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected = false;
  private channelHandlers: Map<string, (message: string, channel: string) => void> = new Map();
  private patternHandlers: Map<string, (message: string, channel: string) => void> = new Map();
  private eventHandlersSetup = false;

  async connect(): Promise<void> {
    try {
      // Main client for get/set operations
      this.client = new Redis(config.redis.url);

      // Separate client for subscriptions (required by Redis)
      // Disable enableReadyCheck to prevent INFO command after subscribing
      this.subscriber = new Redis(config.redis.url, {
        enableReadyCheck: false,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis client connected');
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error', { error: error.message });
      });

      this.subscriber.on('connect', () => {
        logger.info('Redis subscriber connected');
      });

      this.subscriber.on('error', (error) => {
        // Ignore subscriber mode errors as they're expected
        if (!error.message?.includes('subscriber mode')) {
          logger.error('Redis subscriber error', { error: error.message });
        }
      });

      // Wait for connections
      await Promise.all([
        new Promise<void>((resolve) => this.client!.once('connect', resolve)),
        new Promise<void>((resolve) => this.subscriber!.once('connect', resolve)),
      ]);

      // Setup event handlers once
      this.setupEventHandlers();

      this.isConnected = true;
    } catch (error) {
      logger.error('Redis connection failed', { error });
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (this.eventHandlersSetup || !this.subscriber) return;

    this.subscriber.on('message', (channel, message) => {
      const handler = this.channelHandlers.get(channel);
      if (handler) {
        handler(message, channel);
      }
    });

    this.subscriber.on('pmessage', (pattern, channel, message) => {
      const handler = this.patternHandlers.get(pattern);
      if (handler) {
        handler(message, channel);
      }
    });

    this.eventHandlersSetup = true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
    this.isConnected = false;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Subscribe to a channel
  async subscribe(
    channel: string,
    handler: (message: string, channel: string) => void
  ): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not connected');
    }

    // Store the handler
    this.channelHandlers.set(channel, handler);

    await this.subscriber.subscribe(channel);
    logger.info('Subscribed to Redis channel', { channel });
  }

  // Subscribe to pattern (for user-specific channels)
  async psubscribe(
    pattern: string,
    handler: (message: string, channel: string) => void
  ): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not connected');
    }

    // Store the handler
    this.patternHandlers.set(pattern, handler);

    await this.subscriber.psubscribe(pattern);
    logger.info('Subscribed to Redis pattern', { pattern });
  }

  // Store user socket mapping
  async setUserSocket(userId: string, socketId: string): Promise<void> {
    if (!this.client) return;
    await this.client.hset('user:sockets', userId, socketId);
  }

  // Remove user socket mapping
  async removeUserSocket(userId: string): Promise<void> {
    if (!this.client) return;
    await this.client.hdel('user:sockets', userId);
  }

  // Get user socket ID
  async getUserSocket(userId: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.hget('user:sockets', userId);
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    if (!this.client) return 0;
    const count = await this.client.get(`notifications:unread:${userId}`);
    return count ? parseInt(count, 10) : 0;
  }

  // Increment unread count
  async incrementUnreadCount(userId: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(`notifications:unread:${userId}`);
  }

  // Reset unread count
  async resetUnreadCount(userId: string): Promise<void> {
    if (!this.client) return;
    await this.client.set(`notifications:unread:${userId}`, '0');
  }

  // Get online users count
  async getOnlineUsersCount(): Promise<number> {
    if (!this.client) return 0;
    return this.client.hlen('user:sockets');
  }
}

export const redisClient = new RedisClient();
export default redisClient;
