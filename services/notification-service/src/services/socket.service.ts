import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger, redisClient } from '../utils';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

class SocketService {
  private io: Server | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token as string, config.jwt.accessSecret) as {
          userId: string;
          email: string;
        };

        socket.userId = decoded.userId;
        next();
      } catch (error) {
        logger.error('Socket authentication failed', { error });
        next(new Error('Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      logger.info('User connected to WebSocket', { userId, socketId: socket.id });

      // Store socket connection in Redis
      await redisClient.setUserSocket(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Send unread count on connect
      const unreadCount = await redisClient.getUnreadCount(userId);
      socket.emit('unread_count', { count: unreadCount });

      // Handle disconnect
      socket.on('disconnect', async () => {
        logger.info('User disconnected from WebSocket', { userId, socketId: socket.id });
        await redisClient.removeUserSocket(userId);
      });

      // Handle mark as read
      socket.on('mark_read', async (notificationId: string) => {
        try {
          // This will be handled by the API, but we can acknowledge here
          logger.debug('Mark read request received', { userId, notificationId });
        } catch (error) {
          logger.error('Error handling mark_read', { error, userId, notificationId });
        }
      });
    });

    logger.info('Socket.io server initialized');
  }

  // Send notification to a specific user
  async sendNotification(userId: string, notification: NotificationPayload): Promise<void> {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', notification);

    // Also send updated unread count
    const unreadCount = await redisClient.getUnreadCount(userId);
    this.io.to(`user:${userId}`).emit('unread_count', { count: unreadCount });

    logger.debug('Notification sent via WebSocket', { userId, notificationId: notification.id });
  }

  // Broadcast to all connected users (for system announcements)
  broadcastAll(event: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  // Get connected users count
  getConnectedCount(): number {
    return this.io?.sockets.sockets.size || 0;
  }
}

export const socketService = new SocketService();
export default socketService;
