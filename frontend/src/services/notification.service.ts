import { apiRequest } from '@/lib/api';
import type { Notification, ApiResponse, PaginationMeta } from '@/types';

export interface NotificationsResponse {
  notifications: Notification[];
  meta: PaginationMeta & { unreadCount: number };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
}

export const notificationService = {
  async getNotifications(filters: NotificationFilters = {}): Promise<ApiResponse<NotificationsResponse>> {
    const { page = 1, limit = 20 } = filters;
    return apiRequest<NotificationsResponse>(
      'GET',
      `/notifications?page=${page}&limit=${limit}`
    );
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>('PATCH', `/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiRequest<void>('PATCH', '/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>('DELETE', `/notifications/${id}`);
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiRequest<{ count: number }>('GET', '/notifications/unread-count');
  },

  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiRequest<NotificationPreferences>('GET', '/notifications/preferences');
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
    return apiRequest<NotificationPreferences>('PUT', '/notifications/preferences', prefs);
  },
};

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  reportCreated: boolean;
  reportAssigned: boolean;
  statusUpdated: boolean;
  reportEscalated: boolean;
  reportResolved: boolean;
  reportCommented: boolean;
  upvoteReceived: boolean;
  systemAnnouncement: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}
