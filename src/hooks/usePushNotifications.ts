/**
 * usePushNotifications
 *
 * Handles push token registration on app start / login.
 * Listens for incoming foreground and background notifications.
 * Should be called once near the root of the app tree.
 *
 * NOTE: expo-notifications was removed from Expo Go in SDK 53.
 * This hook safely skips push setup when running in Expo Go.
 * In-app notifications (fetch, mark as read) still work.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { registerPushToken, setupNotifications } from '@/services/notifications.service';
import { authClient } from '@/lib/auth-client';

// Safely import expo-notifications
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Not available in Expo Go SDK 53+
}

export function usePushNotifications() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!session?.user || !Notifications) return;

    let mounted = true;

    async function register() {
      const token = await setupNotifications();
      if (token && mounted) {
        await registerPushToken(token);
      }
    }

    register();

    // Handle notification received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push] Notification received:', notification);
      });

    // Handle user tapping a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Push] Notification tapped:', response);
        const data = response.notification.request.content.data;

        if (data?.refType === 'Order' && data?.refId) {
          router.push(`/orders/${data.refId}`);
        } else if (data?.route && typeof data.route === 'string') {
          router.push(data.route);
        } else {
          router.push('/notifications');
        }
      });

    return () => {
      mounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [session?.user, router]);
}
