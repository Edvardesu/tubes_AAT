import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger, redisClient } from '../utils';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

class ConnectionHandler {
  // Authentication middleware
  async authenticate(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        logger.warn('Connection attempt without token', { socketId: socket.id });
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, config.jwt.secret) as JWTPayload;

      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;

      logger.debug('Socket authenticated', {
        socketId: socket.id,
        userId: decoded.userId,
      });

      next();
    } catch (error: any) {
      logger.error('Socket authentication failed', {
        socketId: socket.id,
        error: error.message,
      });
      next(new Error('Invalid token'));
    }
  }

  // Handle new connection
  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.userId;

    if (!userId) {
      logger.warn('Connection without userId', { socketId: socket.id });
      socket.disconnect();
      return;
    }

    logger.info('User connected', {
      userId,
      socketId: socket.id,
      transport: socket.conn.transport.name,
    });

    // Store socket mapping in Redis
    await redisClient.setUserSocket(userId, socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send current unread count
    const unreadCount = await redisClient.getUnreadCount(userId);
    socket.emit('unread_count', { count: unreadCount });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      logger.info('User disconnected', {
        userId,
        socketId: socket.id,
        reason,
      });

      await redisClient.removeUserSocket(userId);
    });

    // Handle mark as read request
    socket.on('mark_read', async (notificationId: string) => {
      logger.debug('Mark read request', { userId, notificationId });
      // Actual marking is done via API, this is just acknowledgment
      socket.emit('mark_read_ack', { notificationId, success: true });
    });

    // Handle mark all as read
    socket.on('mark_all_read', async () => {
      logger.debug('Mark all read request', { userId });
      await redisClient.resetUnreadCount(userId);
      socket.emit('unread_count', { count: 0 });
    });

    // Handle ping (for keep-alive)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  }
}

export const connectionHandler = new ConnectionHandler();
export default connectionHandler;
