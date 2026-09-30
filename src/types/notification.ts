/**
 * Customer notification types for the mobile app.
 * Mirrors the backend NotificationItem shape with customer-facing fields.
 */

export const NOTIFICATION_TYPE = {
  ORDER: 'order',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
} as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  refType: string;
  refId?: string;
  branchId?: string;
  branchName?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
