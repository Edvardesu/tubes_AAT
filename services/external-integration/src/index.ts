import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger, connectRabbitMQ, getChannel, QUEUES } from './utils';
import { externalRoutes } from './routes';
import { errorHandler } from './middleware';
import { externalService } from './services';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'external-integration',
    mockMode: config.mockMode,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/external', externalRoutes);

// Error handler
app.use(errorHandler);

// Message consumer for forward requests
async function setupMessageConsumer() {
  const channel = getChannel();

  channel.consume(QUEUES.EXTERNAL_FORWARD, async (msg) => {
    if (msg) {
      try {
        const data = JSON.parse(msg.content.toString());
        logger.info('Received forward request:', data);

        await externalService.forwardToExternalSystem({
          reportId: data.reportId,
          externalSystem: data.externalSystem,
          data: data.payload || {},
        });

        channel.ack(msg);
      } catch (error) {
        logger.error('Failed to process forward message:', error);
        channel.nack(msg, false, false); // Don't requeue
      }
    }
  });

  logger.info('Message consumer started');
}

// Start server
async function start() {
  try {
    // Connect to RabbitMQ
    await connectRabbitMQ();
    logger.info('Connected to RabbitMQ');

    // Setup message consumer
    await setupMessageConsumer();

    app.listen(config.port, () => {
      logger.info(`External integration service running on port ${config.port}`);
      logger.info(`Mock mode: ${config.mockMode ? 'ENABLED' : 'DISABLED'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
