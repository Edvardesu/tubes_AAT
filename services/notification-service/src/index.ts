import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger, redisClient, rabbitmqClient } from './utils';
import { startConsumers } from './consumers';
import routes from './routes';
import { prisma } from '@lapor-pakdhe/prisma-client';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Request parsing
app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const redisStatus = redisClient.isReady();

    // Check RabbitMQ connection
    const rabbitmqStatus = rabbitmqClient.isReady();

    const allHealthy = redisStatus && rabbitmqStatus;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        redis: redisStatus ? 'connected' : 'disconnected',
        rabbitmq: rabbitmqStatus ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies unavailable',
    });
  }
});

// Ready check endpoint
app.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// API routes
app.use('/api/v1', routes);

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
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await rabbitmqClient.disconnect();
    await redisClient.disconnect();
    await prisma.$disconnect();
    logger.info('All connections closed. Exiting...');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Connect to RabbitMQ
    await rabbitmqClient.connect();
    logger.info('Connected to RabbitMQ');

    // Start consumers
    await startConsumers();

    app.listen(config.port, () => {
      logger.info(`Notification service started on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
        note: 'WebSocket handled by separate websocket-server on port 8081',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
