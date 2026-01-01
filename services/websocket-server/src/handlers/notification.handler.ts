import { Server } from 'socket.io';
import { logger, redisClient } from '../utils';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountPayload {
  userId: string;
  count: number;
}

export interface BroadcastPayload {
  event: string;
  data: any;
}

class NotificationHandler {
  private io: Server | null = null;

  initialize(io: Server): void {
    this.io = io;
    logger.info('Notification handler initialized');
  }

  // Handle incoming notification from Redis pub/sub
  async handleNotification(message: string): Promise<void> {
    try {
      const payload: NotificationPayload = JSON.parse(message);
      const { userId, ...notification } = payload;

      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      // Send to user's room
      this.io.to(`user:${userId}`).emit('notification', notification);

      // Also send updated unread count
      const unreadCount = await redisClient.getUnreadCount(userId);
      this.io.to(`user:${userId}`).emit('unread_count', { count: unreadCount });

      logger.debug('Notification sent to user', {
        userId,
        notificationId: notification.id,
        type: notification.type,
      });
    } catch (error) {
      logger.error('Failed to handle notification', { error, message });
    }
  }

  // Handle unread count update
  async handleUnreadCount(message: string): Promise<void> {
    try {
      const payload: UnreadCountPayload = JSON.parse(message);
      const { userId, count } = payload;

      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      this.io.to(`user:${userId}`).emit('unread_count', { count });

      logger.debug('Unread count sent to user', { userId, count });
    } catch (error) {
      logger.error('Failed to handle unread count', { error, message });
    }
  }

  // Handle broadcast to all users
  handleBroadcast(message: string): void {
    try {
      const payload: BroadcastPayload = JSON.parse(message);
      const { event, data } = payload;

      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      this.io.emit(event, data);

      logger.debug('Broadcast sent', { event });
    } catch (error) {
      logger.error('Failed to handle broadcast', { error, message });
    }
  }

  // Send notification to specific user (direct call)
  async sendToUser(userId: string, notification: Omit<NotificationPayload, 'userId'>): Promise<void> {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', notification);

    const unreadCount = await redisClient.getUnreadCount(userId);
    this.io.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }
}

export const notificationHandler = new NotificationHandler();
export default notificationHandler;
