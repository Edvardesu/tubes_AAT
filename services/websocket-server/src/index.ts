import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { logger, redisClient } from './utils';
import {
  connectionHandler,
  notificationHandler,
  AuthenticatedSocket,
} from './handlers';

const app = express();
const httpServer = createServer(app);

// CORS middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

app.use(express.json());

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const redisStatus = redisClient.isReady();
    const connectedClients = io.sockets.sockets.size;
    const onlineUsers = await redisClient.getOnlineUsersCount();

    res.status(redisStatus ? 200 : 503).json({
      status: redisStatus ? 'healthy' : 'degraded',
      service: 'websocket-server',
      timestamp: new Date().toISOString(),
      checks: {
        redis: redisStatus ? 'connected' : 'disconnected',
        websocket: {
          connectedClients,
          onlineUsers,
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'websocket-server',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies unavailable',
    });
  }
});

// Ready check endpoint
app.get('/ready', (req: Request, res: Response) => {
  const ready = redisClient.isReady();
  res.status(ready ? 200 : 503).json({ ready });
});

// Stats endpoint
app.get('/stats', async (req: Request, res: Response) => {
  try {
    const connectedClients = io.sockets.sockets.size;
    const onlineUsers = await redisClient.getOnlineUsersCount();

    res.json({
      success: true,
      data: {
        connectedClients,
        onlineUsers,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
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

// Socket.io authentication middleware
io.use((socket, next) => {
  connectionHandler.authenticate(socket as AuthenticatedSocket, next);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  connectionHandler.handleConnection(socket as AuthenticatedSocket);
});

// Initialize notification handler
notificationHandler.initialize(io);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close all socket connections
    io.close();

    // Disconnect from Redis
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

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Subscribe to notification channels
    await redisClient.subscribe('notifications', (message) => {
      notificationHandler.handleNotification(message);
    });

    await redisClient.subscribe('unread_count', (message) => {
      notificationHandler.handleUnreadCount(message);
    });

    await redisClient.subscribe('broadcast', (message) => {
      notificationHandler.handleBroadcast(message);
    });

    // Subscribe to user-specific notifications (pattern)
    await redisClient.psubscribe('user:*:notification', (message, channel) => {
      notificationHandler.handleNotification(message);
    });

    httpServer.listen(config.port, () => {
      logger.info(`WebSocket server started on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
        corsOrigins: config.corsOrigins,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

startServer();

export { io };
export default app;
