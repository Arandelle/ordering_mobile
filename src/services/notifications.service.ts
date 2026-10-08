/**
 * Customer notification service.
 * Handles fetching, marking as read, and push token registration.
 *
 * NOTE: expo-notifications was removed from Expo Go in SDK 53.
 * Push notification features require a development build (EAS Build).
 * In-app notifications (fetch, mark as read) work without expo-notifications.
 */

import { apiClient, isApiError } from '@/lib/apiClient';
import type { NotificationsListResponse, UnreadCountResponse } from '@/types/notification';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// API calls — customer notification endpoints
// ---------------------------------------------------------------------------

export const notificationService = {
  /** Fetch paginated customer notifications */
  getNotifications: (page = 1, limit = 20) =>
    apiClient.get<NotificationsListResponse>(
      `/customer/notifications?page=${page}&limit=${limit}`,
    ),

  /** Get unread notification count */
  getUnreadCount: () =>
    apiClient.get<UnreadCountResponse>('/customer/notifications/unread-count'),

  /** Mark a single notification as read */
  markAsRead: (id: string) =>
    apiClient.patch<void>(`/customer/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllAsRead: () =>
    apiClient.patch<void>('/customer/notifications/read-all'),

  /** Delete a single notification */
  deleteNotification: (id: string) =>
    apiClient.delete<void>(`/customer/notifications/${id}`),
};

// ---------------------------------------------------------------------------
// Push token registration
// ---------------------------------------------------------------------------

/**
 * Register the Expo push token with the backend.
 * Called after login and when the token refreshes.
 * Requires a development build — silently skips in Expo Go.
 */
export async function registerPushToken(token: string): Promise<void> {
  if (!Notifications) return;
  try {
    await apiClient.post<void>('/customer/notifications/push-token', {
      token,
      platform: Platform.OS,
    });
  } catch (err) {
    console.error('[Push] Failed to register push token:', err);
  }
}

// Safely import expo-notifications — it may not be available in Expo Go SDK 53+
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Not available in Expo Go SDK 53+
}

/**
 * Configure expo-notifications handlers and request permissions.
 * Returns the Expo push token (or null if denied/unsupported).
 * Returns null silently when expo-notifications is unavailable (Expo Go).
 */
export async function setupNotifications(): Promise<string | null> {
  if (!Notifications) {
    if (__DEV__) {
      console.log(
        '[Notifications] expo-notifications unavailable — skipping push setup. ' +
          'Use a development build for push notifications.',
      );
    }
    return null;
  }

  // Handle incoming foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '7d12b52b-83f9-4fcc-86f4-606c5b416ae8',
    });
    return tokenData.data;
  } catch (err) {
    console.error('[Push] Failed to get Expo push token:', err);
    return null;
  }
}
