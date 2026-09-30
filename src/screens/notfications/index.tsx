import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import type { NotificationItem } from '@/types/notification';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG = {
  high: { color: '#ef4501', icon: 'notifications' as const },
  normal: { color: '#666', icon: 'notifications-outline' as const },
  low: { color: '#999', icon: 'ellipse-outline' as const },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'order':
      return 'Order';
    case 'promotion':
      return 'Promo';
    case 'system':
      return 'System';
    default:
      return type;
  }
}

// ---------------------------------------------------------------------------
// NotificationCard
// ---------------------------------------------------------------------------

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const config = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.normal;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`mx-3 mb-2 overflow-hidden rounded-2xl border-l-4 ${
        item.isRead ? 'bg-white' : 'bg-brand-50'
      }`}
      style={{ borderLeftColor: config.color }}>
      <View className="p-3">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Ionicons name={config.icon} size={16} color={config.color} />
              <Text className="text-[11px] font-medium text-gray-500">
                {getTypeLabel(item.type)}
              </Text>
              {!item.isRead && (
                <View className="h-2 w-2 rounded-full bg-brand-500" />
              )}
            </View>
            <Text className="mt-1 text-[15px] font-semibold text-gray-900">
              {item.title}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-700" numberOfLines={2}>
              {item.message}
            </Text>
            {item.branchName && (
              <Text className="mt-1 text-xs text-gray-400">
                {item.branchName}
              </Text>
            )}
          </View>
          <Text className="text-xs text-gray-400">{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-24">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-orange-50">
        <Ionicons name="notifications-off-outline" size={44} color="#e13e00" />
      </View>
      <View className="items-center gap-1">
        <Text className="text-xl font-semibold text-gray-900">
          No notifications yet
        </Text>
        <Text className="text-center text-sm leading-relaxed text-gray-400">
          We'll notify you about order updates, promos, and important news.
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isRefetching } = useNotifications(page);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markAsRead(item._id);
      }

      // Navigate to order detail if it's an order notification
      if (item.refType === 'Order' && item.refId) {
        router.push(`/orders/${item.refId}`);
      }
    },
    [markAsRead, router],
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#ef4501" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-gray-50 px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4501" />
        <Text className="text-center text-sm text-gray-500">
          Failed to load notifications. Please try again.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-2 rounded-2xl bg-brand-500 px-6 py-2">
          <Text className="text-sm font-bold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notifications.length === 0) {
    return <EmptyState />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      {hasUnread && (
        <View className="mx-3 mt-2 flex-row items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
          <Text className="text-xs font-medium text-brand-500">
            You have unread notifications
          </Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text className="text-xs font-bold text-brand-500">Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#ef4501"
          />
        }
        ListFooterComponent={
          data?.pagination.hasNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#ef4501" />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (data?.pagination.hasNextPage) {
            setPage((p) => p + 1);
          }
        }}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}
