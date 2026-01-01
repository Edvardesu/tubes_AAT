import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    // Already connected or connecting
    if ((error as Error).message !== 'Redis is already connecting/connected') {
      throw error;
    }
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (data) {
    return JSON.parse(data) as T;
  }
  return null;
}

export async function setCachedData<T>(key: string, data: T, expirySeconds: number): Promise<void> {
  await redis.setex(key, expirySeconds, JSON.stringify(data));
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
