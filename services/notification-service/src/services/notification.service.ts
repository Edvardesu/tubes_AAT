import { prisma, NotificationType, Prisma } from '@lapor-pakdhe/prisma-client';
import { logger, redisClient, ReportEvent, RoutingCompletedEvent } from '../utils';
import { emailService } from './email.service';
import { preferenceService } from './preference.service';

// Notification templates
const NOTIFICATION_TEMPLATES = {
  REPORT_CREATED: {
    title: 'Laporan Baru Dibuat',
    message: (data: ReportEvent['data']) =>
      `Laporan "${data.title}" dengan nomor ${data.referenceNumber} telah dibuat.`,
  },
  REPORT_STATUS_CHANGED: {
    title: 'Status Laporan Berubah',
    message: (data: ReportEvent['data']) =>
      `Status laporan "${data.title}" berubah dari ${data.oldStatus} menjadi ${data.newStatus}.`,
  },
  REPORT_ASSIGNED: {
    title: 'Laporan Ditugaskan',
    message: (data: ReportEvent['data']) =>
      `Anda ditugaskan untuk menangani laporan "${data.title}" (${data.referenceNumber}).`,
  },
  REPORT_ESCALATED: {
    title: 'Laporan Dieskalasi',
    message: (data: ReportEvent['data']) =>
      `Laporan "${data.title}" (${data.referenceNumber}) telah dieskalasi karena melewati batas waktu SLA.`,
  },
  REPORT_ROUTED: {
    title: 'Laporan Diteruskan',
    message: (data: RoutingCompletedEvent['data']) =>
      `Laporan Anda telah diteruskan ke ${data.departmentName}.`,
  },
};

class NotificationService {
  // Create notification with preference and email support
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    emailData?: {
      userEmail: string;
      userName?: string;
    }
  ): Promise<void> {
    try {
      // Check user preferences
      const channels = await preferenceService.shouldNotify(userId, type);

      // Skip if user doesn't want any notifications
      if (!channels.email && !channels.push && !channels.inApp) {
        logger.debug('User disabled all channels for this notification type', { userId, type });
        return;
      }

      // Create in-app notification if enabled
      if (channels.inApp) {
        const notification = await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : Prisma.JsonNull,
          },
        });

        // Increment unread count in Redis
        await redisClient.incrementUnreadCount(userId);

        // Push notification via Redis pub/sub to WebSocket server
        if (channels.push) {
          await redisClient.publishNotification(userId, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: data || {},
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
          });
        }

        logger.info('Notification created', {
          notificationId: notification.id,
          userId,
          type,
          channels,
        });
      }

      // Send email if enabled and email data provided
      if (channels.email && emailData?.userEmail) {
        await this.sendEmailForType(type, emailData.userEmail, emailData.userName, data);
      }
    } catch (error) {
      logger.error('Failed to create notification', { error, userId, type });
    }
  }

  // Send email based on notification type
  private async sendEmailForType(
    type: NotificationType,
    email: string,
    userName?: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      switch (type) {
        case NotificationType.REPORT_CREATED:
          await emailService.sendReportCreatedEmail(email, {
            title: data?.title || 'Laporan Baru',
            referenceNumber: data?.referenceNumber || '-',
            userName,
          });
          break;

        case NotificationType.STATUS_UPDATED:
          await emailService.sendStatusUpdatedEmail(email, {
            title: data?.title || 'Laporan',
            referenceNumber: data?.referenceNumber || '-',
            oldStatus: data?.oldStatus || '-',
            newStatus: data?.newStatus || '-',
            userName,
          });
          break;

        case NotificationType.REPORT_ASSIGNED:
          await emailService.sendReportAssignedEmail(email, {
            title: data?.title || 'Laporan',
            referenceNumber: data?.referenceNumber || '-',
            userName,
          });
          break;

        case NotificationType.REPORT_ESCALATED:
          await emailService.sendReportEscalatedEmail(email, {
            title: data?.title || 'Laporan',
            referenceNumber: data?.referenceNumber || '-',
            escalationLevel: data?.escalationLevel || 1,
            userName,
          });
          break;

        default:
          logger.debug('No email template for notification type', { type });
      }
    } catch (error) {
      logger.error('Failed to send email notification', { error, type, email });
    }
  }

  // Handle report.created event - notify admins
  async handleReportCreated(event: ReportEvent): Promise<void> {
    const template = NOTIFICATION_TEMPLATES.REPORT_CREATED;

    // Get all admin users to notify (with email for email notifications)
    const adminUsers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: { in: ['ADMIN', 'CITY_ADMIN'] },
            },
          },
        },
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
    });

    // Create notifications for all admins
    for (const admin of adminUsers) {
      await this.createNotification(
        admin.id,
        NotificationType.REPORT_CREATED,
        template.title,
        template.message(event.data),
        {
          reportId: event.data.reportId,
          referenceNumber: event.data.referenceNumber,
          title: event.data.title,
        },
        { userEmail: admin.email, userName: admin.fullName }
      );
    }

    logger.info('Report created notifications sent', {
      reportId: event.data.reportId,
      adminCount: adminUsers.length,
    });
  }

  // Handle report.status_changed event - notify reporter
  async handleReportStatusChanged(event: ReportEvent): Promise<void> {
    const template = NOTIFICATION_TEMPLATES.REPORT_STATUS_CHANGED;

    if (!event.data.reporterId) {
      logger.debug('No reporter to notify (anonymous report)', {
        reportId: event.data.reportId,
      });
      return;
    }

    // Get reporter email
    const reporter = await prisma.user.findUnique({
      where: { id: event.data.reporterId },
      select: { email: true, fullName: true },
    });

    await this.createNotification(
      event.data.reporterId,
      NotificationType.STATUS_UPDATED,
      template.title,
      template.message(event.data),
      {
        reportId: event.data.reportId,
        referenceNumber: event.data.referenceNumber,
        title: event.data.title,
        oldStatus: event.data.oldStatus,
        newStatus: event.data.newStatus,
      },
      reporter ? { userEmail: reporter.email, userName: reporter.fullName } : undefined
    );

    logger.info('Status change notification sent', {
      reportId: event.data.reportId,
      reporterId: event.data.reporterId,
    });
  }

  // Handle report.assigned event - notify assigned staff
  async handleReportAssigned(event: ReportEvent): Promise<void> {
    const template = NOTIFICATION_TEMPLATES.REPORT_ASSIGNED;

    if (!event.data.assignedToId) {
      logger.warn('No assignee in assigned event', {
        reportId: event.data.reportId,
      });
      return;
    }

    // Get assignee email
    const assignee = await prisma.user.findUnique({
      where: { id: event.data.assignedToId },
      select: { email: true, fullName: true },
    });

    await this.createNotification(
      event.data.assignedToId,
      NotificationType.REPORT_ASSIGNED,
      template.title,
      template.message(event.data),
      {
        reportId: event.data.reportId,
        referenceNumber: event.data.referenceNumber,
        title: event.data.title,
      },
      assignee ? { userEmail: assignee.email, userName: assignee.fullName } : undefined
    );

    logger.info('Assignment notification sent', {
      reportId: event.data.reportId,
      assignedToId: event.data.assignedToId,
    });
  }

  // Handle report.escalated event - notify department heads
  async handleReportEscalated(event: ReportEvent): Promise<void> {
    const template = NOTIFICATION_TEMPLATES.REPORT_ESCALATED;

    // Get department heads and admins (with email for email notifications)
    const usersToNotify = await prisma.user.findMany({
      where: {
        OR: [
          {
            roles: {
              some: {
                role: { name: { in: ['ADMIN', 'CITY_ADMIN', 'DEPARTMENT_HEAD'] } },
              },
            },
          },
          {
            staffProfile: {
              departmentId: event.data.departmentId,
            },
          },
        ],
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
    });

    for (const user of usersToNotify) {
      await this.createNotification(
        user.id,
        NotificationType.REPORT_ESCALATED,
        template.title,
        template.message(event.data),
        {
          reportId: event.data.reportId,
          referenceNumber: event.data.referenceNumber,
          title: event.data.title,
          escalationLevel: event.data.escalationLevel,
        },
        { userEmail: user.email, userName: user.fullName }
      );
    }

    logger.info('Escalation notifications sent', {
      reportId: event.data.reportId,
      userCount: usersToNotify.length,
    });
  }

  // Handle routing.completed event - notify reporter
  async handleRoutingCompleted(event: RoutingCompletedEvent): Promise<void> {
    const template = NOTIFICATION_TEMPLATES.REPORT_ROUTED;

    // Get the report to find the reporter (with email for email notifications)
    const report = await prisma.report.findUnique({
      where: { id: event.data.reportId },
      select: {
        reporterId: true,
        referenceNumber: true,
        title: true,
        reporter: {
          select: { email: true, fullName: true },
        },
      },
    });

    if (!report?.reporterId) {
      logger.debug('No reporter to notify for routing completed', {
        reportId: event.data.reportId,
      });
      return;
    }

    await this.createNotification(
      report.reporterId,
      NotificationType.STATUS_UPDATED,
      template.title,
      template.message(event.data),
      {
        reportId: event.data.reportId,
        referenceNumber: report.referenceNumber,
        title: report.title,
        departmentName: event.data.departmentName,
      },
      report.reporter ? { userEmail: report.reporter.email, userName: report.reporter.fullName } : undefined
    );

    logger.info('Routing completed notification sent', {
      reportId: event.data.reportId,
      reporterId: report.reporterId,
    });
  }

  // Get user notifications with pagination
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: any[];
    meta: { page: number; limit: number; total: number; totalPages: number; unreadCount: number };
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await redisClient.getUnreadCount(userId);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        data: typeof n.data === 'string' ? JSON.parse(n.data) : n.data,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    await redisClient.resetUnreadCount(userId);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
