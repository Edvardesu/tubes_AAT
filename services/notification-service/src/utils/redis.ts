import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;

  async connect(): Promise<void> {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Create subscriber for pub/sub
      this.subscriber = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
      });

      this.client.on('error', (error) => {
        logger.error('Redis error', { error: error.message });
      });

      // Wait for connection
      await this.client.ping();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
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
    logger.info('Redis disconnected');
  }

  isReady(): boolean {
    return this.client?.status === 'ready';
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  getSubscriber(): Redis {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized');
    }
    return this.subscriber;
  }

  // Store user socket connection
  async setUserSocket(userId: string, socketId: string): Promise<void> {
    await this.client?.set(`socket:user:${userId}`, socketId, 'EX', 86400);
  }

  // Get user socket connection
  async getUserSocket(userId: string): Promise<string | null> {
    return this.client?.get(`socket:user:${userId}`) || null;
  }

  // Remove user socket connection
  async removeUserSocket(userId: string): Promise<void> {
    await this.client?.del(`socket:user:${userId}`);
  }

  // Store unread notification count
  async incrementUnreadCount(userId: string): Promise<number> {
    const count = await this.client?.incr(`notifications:unread:${userId}`);
    return count || 0;
  }

  // Decrement unread notification count
  async decrementUnreadCount(userId: string): Promise<number> {
    const current = await this.getUnreadCount(userId);
    if (current <= 0) return 0;

    const count = await this.client?.decr(`notifications:unread:${userId}`);
    return Math.max(count || 0, 0);
  }

  // Reset unread notification count
  async resetUnreadCount(userId: string): Promise<void> {
    await this.client?.set(`notifications:unread:${userId}`, 0);
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.client?.get(`notifications:unread:${userId}`);
    return parseInt(count || '0', 10);
  }

  // ==================== PUB/SUB for WebSocket Server ====================

  // Publish notification to WebSocket server
  async publishNotification(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      data: Record<string, any>;
      isRead: boolean;
      createdAt: string;
    }
  ): Promise<void> {
    if (!this.client) {
      logger.warn('Redis client not available for publish');
      return;
    }

    const payload = JSON.stringify({
      userId,
      ...notification,
    });

    await this.client.publish('notifications', payload);

    logger.debug('Notification published to Redis', {
      userId,
      notificationId: notification.id,
    });
  }

  // Publish unread count update
  async publishUnreadCount(userId: string, count: number): Promise<void> {
    if (!this.client) return;

    const payload = JSON.stringify({ userId, count });
    await this.client.publish('unread_count', payload);
  }

  // Publish broadcast to all users
  async publishBroadcast(event: string, data: any): Promise<void> {
    if (!this.client) return;

    const payload = JSON.stringify({ event, data });
    await this.client.publish('broadcast', payload);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
