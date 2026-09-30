import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notifications.service';
import type { NotificationsListResponse, UnreadCountResponse, NotificationItem } from '@/types/notification';

const QUERY_KEYS = {
  notifications: (page: number, limit: number) =>
    ['customer', 'notifications', { page, limit }] as const,
  unreadCount: ['customer', 'notifications', 'unreadCount'] as const,
};

// ---------------------------------------------------------------------------
// Fetch customer notifications (paginated)
// ---------------------------------------------------------------------------

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(page, limit),
    queryFn: () => notificationService.getNotifications(page, limit),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Unread count — polled every 30s
// ---------------------------------------------------------------------------

export function useUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

// ---------------------------------------------------------------------------
// Mark as read
// ---------------------------------------------------------------------------

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications(1, 20) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.unreadCount });

      const previousList = queryClient.getQueryData(QUERY_KEYS.notifications(1, 20)) as NotificationsListResponse | undefined;
      const previousCount = queryClient.getQueryData(QUERY_KEYS.unreadCount) as UnreadCountResponse | undefined;

      if (previousCount) {
        queryClient.setQueryData(QUERY_KEYS.unreadCount, {
          unreadCount: Math.max(0, previousCount.unreadCount - 1),
        });
      }

      if (previousList) {
        queryClient.setQueryData(QUERY_KEYS.notifications(1, 20), {
          ...previousList,
          notifications: previousList.notifications.map((n: NotificationItem) =>
            n._id === id ? { ...n, isRead: true } : n,
          ),
        });
      }

      return { previousList, previousCount };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(QUERY_KEYS.notifications(1, 20), context.previousList);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(QUERY_KEYS.unreadCount, context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(1, 20) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

// ---------------------------------------------------------------------------
// Mark all as read
// ---------------------------------------------------------------------------

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.unreadCount, { unreadCount: 0 });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(1, 20) });
    },
  });
}
