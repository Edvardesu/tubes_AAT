import express, { Request, Response } from 'express';
import { config } from './config';
import { logger, rabbitmqClient } from './utils';
import { escalationService } from './services';
import { startEscalationJob } from './jobs';
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
      service: 'escalation-service',
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
      service: 'escalation-service',
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

// Get escalation statistics
app.get('/api/v1/escalation/stats', async (req: Request, res: Response) => {
  try {
    const stats = await escalationService.getEscalationStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get escalation stats', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get escalation statistics' },
    });
  }
});

// Trigger manual escalation check (for testing/admin)
app.post('/api/v1/escalation/check', async (req: Request, res: Response) => {
  try {
    const results = await escalationService.checkAndEscalate();
    res.json({
      success: true,
      data: {
        processed: results.length,
        success: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (error) {
    logger.error('Manual escalation check failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Escalation check failed' },
    });
  }
});

// Get hourly escalation report (for admin dashboard)
app.get('/api/v1/escalation/report', async (req: Request, res: Response) => {
  try {
    const report = await escalationService.generateHourlyReport();
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Failed to generate escalation report', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate escalation report' },
    });
  }
});

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

    // Start escalation cron job
    startEscalationJob();

    app.listen(config.port, () => {
      logger.info(`Escalation service started on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
        escalationCron: config.escalationCheckCron,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
