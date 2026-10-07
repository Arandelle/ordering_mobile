import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import { useUndo } from '@/hooks/useUndo';
import { UndoBanner } from '@/components/UndoBanner';
import type { NotificationItem } from '@/types/notification';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 80;

const TYPE_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }
> = {
  order: {
    icon: 'receipt-outline',
    color: '#ef4501',
    bg: '#fff4ee',
    label: 'Order',
  },
  promotion: {
    icon: 'pricetag-outline',
    color: '#f8b31f',
    bg: '#fff9e6',
    label: 'Promo',
  },
  system: {
    icon: 'information-circle-outline',
    color: '#6b7280',
    bg: '#f3f4f6',
    label: 'System',
  },
};

const DEFAULT_TYPE = TYPE_CONFIG.system;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// NotificationCard
// ---------------------------------------------------------------------------

function NotificationCard({
  item,
  onPress,
  onSwipeOpen,
  onDelete,
  isLast,
}: {
  item: NotificationItem;
  onPress: () => void;
  onSwipeOpen: (close: () => void) => void;
  onDelete: (item: NotificationItem) => void;
  isLast: boolean;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const config = TYPE_CONFIG[item.type] ?? DEFAULT_TYPE;

  const renderRightAction = () => (
    <View
      className="ml-2 flex-row items-center justify-center rounded-lg bg-red-500"
      style={{ width: SWIPE_THRESHOLD }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-red-600">
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </View>
    </View>
  );

  return (
    <View style={{ marginBottom: isLast ? 0 : 1 }}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderRightAction}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            onSwipeOpen(() => swipeableRef.current?.close());
            onDelete(item);
          }
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.6}
          className="mx-3 border-b border-gray-100 bg-white px-4 py-3.5"
        >
          <View className="flex-row items-start gap-3">
            {/* Icon badge */}
            <View
              className="mt-0.5 h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: config.bg }}
            >
              <Ionicons name={config.icon} size={20} color={config.color} />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: config.color }}
                >
                  {config.label}
                </Text>
                <Text className="text-[11px] text-gray-400">
                  {timeAgo(item.createdAt)}
                </Text>
              </View>

              <Text
                className={`mt-1 text-[15px] text-gray-900 ${
                  item.isRead ? 'font-medium' : 'font-bold'
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <Text
                className={`mt-0.5 text-[13px] leading-relaxed ${
                  item.isRead ? 'text-gray-400' : 'text-gray-600'
                }`}
                numberOfLines={2}
              >
                {item.message}
              </Text>

              {item.branchName && (
                <View className="mt-1.5 self-start rounded-full bg-gray-100 px-2 py-0.5">
                  <Text className="text-[11px] font-medium text-gray-500">
                    {item.branchName}
                  </Text>
                </View>
              )}
            </View>

            {/* Unread indicator */}
            {!item.isRead && (
              <View className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
            )}
          </View>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <Ionicons name="notifications-off-outline" size={36} color="#9ca3af" />
      </View>
      <View className="items-center gap-1.5">
        <Text className="text-lg font-bold text-gray-900">
          All caught up
        </Text>
        <Text className="text-center text-sm leading-relaxed text-gray-400">
          No notifications right now.{'\n'}We'll let you know when something new arrives.
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

  // Local deletion state (no API yet)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const { pendingItem, secondsLeft, trigger, undo } = useUndo<NotificationItem>({
    duration: 5,
  });

  const notifications = (data?.notifications ?? []).filter(
    (n) => !deletedIds.has(n._id),
  );
  const hasUnread = notifications.some((n) => !n.isRead);

  // Close other swipeables when one opens
  const openSwipeableCloseRef = useRef<(() => void) | null>(null);
  const handleSwipeOpen = useCallback((close: () => void) => {
    openSwipeableCloseRef.current?.();
    openSwipeableCloseRef.current = close;
  }, []);

  const handleDelete = useCallback(
    (item: NotificationItem) => {
      setDeletedIds((prev) => new Set(prev).add(item._id));
      trigger(item);
    },
    [trigger],
  );

  const handleUndo = useCallback(() => {
    if (pendingItem) {
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(pendingItem._id);
        return next;
      });
    }
    undo();
  }, [pendingItem, undo]);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markAsRead(item._id);
      }
      if (item.refType === 'Order' && item.refId) {
        router.push(`/orders/${item.refId}`);
      }
    },
    [markAsRead, router],
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // --- Loading ---
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ef4501" />
      </View>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
        </View>
        <Text className="text-center text-sm text-gray-500">
          Failed to load notifications
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="rounded-lg bg-brand-500 px-6 py-2.5"
        >
          <Text className="text-sm font-bold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Empty ---
  if (notifications.length === 0 && !pendingItem) {
    return <EmptyState />;
  }

  return (
    <View className="flex-1 bg-white">
      {/* Unread bar */}
      {hasUnread && (
        <View className="flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-2.5">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-brand-500" />
            <Text className="text-xs font-medium text-gray-600">
              Unread notifications
            </Text>
          </View>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text className="text-xs font-bold text-brand-500">
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <NotificationCard
            item={item}
            onPress={() => handleNotificationPress(item)}
            onSwipeOpen={handleSwipeOpen}
            onDelete={handleDelete}
            isLast={index === notifications.length - 1}
          />
        )}
        contentContainerStyle={
          notifications.length === 0
            ? { flexGrow: 1 }
            : { paddingTop: 4, paddingBottom: 24 }
        }
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
        onScrollBeginDrag={() => {
          openSwipeableCloseRef.current?.();
          openSwipeableCloseRef.current = null;
        }}
      />

      {/* Undo banner overlay */}
      {pendingItem && (
        <View className="absolute bottom-6 left-0 right-0 z-50">
          <UndoBanner
            message={
              <>
                Deleted{' '}
                <Text className="font-semibold text-white">
                  {pendingItem.title}
                </Text>
              </>
            }
            secondsLeft={secondsLeft}
            duration={5}
            onUndo={handleUndo}
            actionLabel="Undo"
            iconName="trash-outline"
          />
        </View>
      )}
    </View>
  );
}
