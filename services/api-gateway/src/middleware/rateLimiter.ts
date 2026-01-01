import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { config } from '../config';
import { redisClient, logger } from '../utils';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';

// Standard rate limiter for general API requests
export const createRateLimiter = () => {
  const client = redisClient.getClient();
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.userId || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ready';
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.userId,
        path: req.path,
      });
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    },
    store: new RedisStore({
      // @ts-expect-error - ioredis call method is compatible
      sendCommand: (...args: string[]) => client.call(...args),
      prefix: 'rl:general:',
    }),
  });
};

// Stricter rate limiter for auth endpoints
export const createAuthRateLimiter = () => {
  const client = redisClient.getClient();
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxAuthRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later',
      },
    },
    keyGenerator: (req: Request) => {
      // Use email from body for login/register, or IP
      return req.body?.email || req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        email: req.body?.email,
        path: req.path,
      });
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts, please try again later',
        },
      });
    },
    store: new RedisStore({
      // @ts-expect-error - ioredis call method is compatible
      sendCommand: (...args: string[]) => client.call(...args),
      prefix: 'rl:auth:',
    }),
  });
};

// Create rate limiters after Redis is connected
let generalRateLimiter: ReturnType<typeof rateLimit>;
let authRateLimiter: ReturnType<typeof rateLimit>;

export const initRateLimiters = () => {
  generalRateLimiter = createRateLimiter();
  authRateLimiter = createAuthRateLimiter();
};

export const getRateLimiter = () => generalRateLimiter;
export const getAuthRateLimiter = () => authRateLimiter;
