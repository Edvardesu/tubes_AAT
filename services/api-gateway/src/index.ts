import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { logger, redisClient } from './utils';
import {
  errorHandler,
  setupUnhandledRejectionHandler,
  initRateLimiters,
  getRateLimiter,
} from './middleware';
import { createServiceRouter, getCircuitBreakerStats } from './proxy';

const app = express();

// Setup unhandled rejection handler
setupUnhandledRejectionHandler();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Request parsing - skip for multipart/form-data (handled by downstream services)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
  skip: (req) => req.path === '/health' || req.path === '/ready',
}));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const redisStatus = redisClient.isReady();
  const circuitBreakerStats = getCircuitBreakerStats();

  res.json({
    status: redisStatus ? 'healthy' : 'degraded',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    checks: {
      redis: redisStatus ? 'connected' : 'disconnected',
    },
    circuitBreakers: circuitBreakerStats,
  });
});

// Ready check endpoint (for Kubernetes)
app.get('/ready', (req: Request, res: Response) => {
  const ready = redisClient.isReady();
  res.status(ready ? 200 : 503).json({ ready });
});

// Apply general rate limiter after health checks
app.use((req: Request, res: Response, next) => {
  const rateLimiter = getRateLimiter();
  if (rateLimiter) {
    return rateLimiter(req, res, next);
  }
  next();
});

// Service routes
app.use('/api/v1', createServiceRouter());

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await redisClient.disconnect();
    logger.info('All connections closed. Exiting...');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Initialize rate limiters after Redis connection
    initRateLimiters();
    logger.info('Rate limiters initialized');

    app.listen(config.port, () => {
      logger.info(`API Gateway started on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
