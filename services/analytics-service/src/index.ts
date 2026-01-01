import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger, connectRedis } from './utils';
import { analyticsRoutes, internalRoutes } from './routes';
import { errorHandler } from './middleware';

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
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/analytics', analyticsRoutes);
app.use('/internal', internalRoutes);

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    app.listen(config.port, () => {
      logger.info(`Analytics service running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
