import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { logger, redisClient, minioClient, rabbitmqClient } from './utils';
import { errorHandler, setupUnhandledRejectionHandler } from './middleware';
import routes from './routes';
import { prisma } from '@lapor-pakdhe/prisma-client';

const app = express();

// Setup unhandled rejection handler
setupUnhandledRejectionHandler();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
  skip: (req) => req.path === '/health' || req.path === '/ready',
}));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const redisStatus = redisClient.isReady();

    // Check MinIO connection
    const minioStatus = minioClient.isReady();

    // Check RabbitMQ connection
    const rabbitmqStatus = rabbitmqClient.isReady();

    const allHealthy = redisStatus && minioStatus && rabbitmqStatus;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'report-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        redis: redisStatus ? 'connected' : 'disconnected',
        minio: minioStatus ? 'connected' : 'disconnected',
        rabbitmq: rabbitmqStatus ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'report-service',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies unavailable',
    });
  }
});

// Ready check endpoint (for Kubernetes)
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
app.use(errorHandler);

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

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Connect to MinIO
    await minioClient.connect();
    logger.info('Connected to MinIO');

    // Connect to RabbitMQ
    await rabbitmqClient.connect();
    logger.info('Connected to RabbitMQ');

    // Test database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    app.listen(config.port, () => {
      logger.info(`Report service started on port ${config.port}`, {
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
