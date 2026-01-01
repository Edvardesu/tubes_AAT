import { prisma, NotificationType } from '@lapor-pakdhe/prisma-client';
import { logger } from '../utils';

interface NotificationPreferenceInput {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  reportCreated?: boolean;
  reportAssigned?: boolean;
  statusUpdated?: boolean;
  reportEscalated?: boolean;
  reportResolved?: boolean;
  reportCommented?: boolean;
  upvoteReceived?: boolean;
  systemAnnouncement?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface ChannelCheck {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

class PreferenceService {
  // Get or create user notification preferences
  async getPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Create default preferences
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
      logger.info('Created default notification preferences', { userId });
    }

    return prefs;
  }

  // Update user notification preferences
  async updatePreferences(userId: string, input: NotificationPreferenceInput) {
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });

    logger.info('Updated notification preferences', { userId, changes: Object.keys(input) });
    return prefs;
  }

  // Check if user wants this notification type
  async shouldNotify(userId: string, type: NotificationType): Promise<ChannelCheck> {
    const prefs = await this.getPreferences(userId);

    // Check if notification type is enabled
    const typeEnabled = this.isTypeEnabled(prefs, type);

    if (!typeEnabled) {
      return { email: false, push: false, inApp: false };
    }

    // Check quiet hours
    const inQuietHours = this.isInQuietHours(prefs);

    if (inQuietHours) {
      // During quiet hours, only allow in-app notifications (silent)
      return {
        email: false,
        push: false,
        inApp: prefs.inAppEnabled,
      };
    }

    return {
      email: prefs.emailEnabled,
      push: prefs.pushEnabled,
      inApp: prefs.inAppEnabled,
    };
  }

  // Check if specific notification type is enabled
  private isTypeEnabled(prefs: any, type: NotificationType): boolean {
    const typeMap: Record<NotificationType, keyof typeof prefs> = {
      [NotificationType.REPORT_CREATED]: 'reportCreated',
      [NotificationType.REPORT_ASSIGNED]: 'reportAssigned',
      [NotificationType.STATUS_UPDATED]: 'statusUpdated',
      [NotificationType.REPORT_ESCALATED]: 'reportEscalated',
      [NotificationType.REPORT_RESOLVED]: 'reportResolved',
      [NotificationType.REPORT_COMMENTED]: 'reportCommented',
      [NotificationType.UPVOTE_RECEIVED]: 'upvoteReceived',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 'systemAnnouncement',
    };

    const prefKey = typeMap[type];
    return prefKey ? prefs[prefKey] : true;
  }

  // Check if current time is within quiet hours
  private isInQuietHours(prefs: any): boolean {
    if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  // Get users who have specific notification type enabled
  async getUsersWithTypeEnabled(
    userIds: string[],
    type: NotificationType
  ): Promise<{ userId: string; channels: ChannelCheck }[]> {
    const results: { userId: string; channels: ChannelCheck }[] = [];

    for (const userId of userIds) {
      const channels = await this.shouldNotify(userId, type);
      if (channels.email || channels.push || channels.inApp) {
        results.push({ userId, channels });
      }
    }

    return results;
  }
}

export const preferenceService = new PreferenceService();
export default preferenceService;
