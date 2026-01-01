import express, { Request, Response } from 'express';
import { config } from './config';
import { logger, rabbitmqClient } from './utils';
import { startReportCreatedConsumer } from './consumers';
import { routingRulesService } from './services';
import { prisma } from '@lapor-pakdhe/prisma-client';

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check RabbitMQ connection
    const rabbitmqStatus = rabbitmqClient.isReady();

    const allHealthy = rabbitmqStatus;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'routing-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        rabbitmq: rabbitmqStatus ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'routing-service',
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

// Get routing rules (for debugging/admin)
app.get('/api/v1/routing/rules', (req: Request, res: Response) => {
  const rules = routingRulesService.getRoutingRules();
  res.json({
    success: true,
    data: rules,
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await rabbitmqClient.disconnect();
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

    // Connect to RabbitMQ
    await rabbitmqClient.connect();
    logger.info('Connected to RabbitMQ');

    // Start consumers
    await startReportCreatedConsumer();

    app.listen(config.port, () => {
      logger.info(`Routing service started on port ${config.port}`, {
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
