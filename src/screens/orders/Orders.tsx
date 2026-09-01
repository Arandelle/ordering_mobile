import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authClient } from '@/lib/auth-client';
import { useCancelOrder, useCreateMayaCheckout, useOrders } from '@/hooks/useOrders';
import { useCart } from '@/context/CartContext';
import { formatDate } from '@/helper/formateDate';
import { ORDER_STATUSES } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';
import { CartItem, ModifierSelection } from '@/types/menu-types';

import { useOrderState } from './hooks/useOrderState';
import { CancelOrderModal } from './components/CancelOrderModal';
import { OrderItemImage } from './components/OrderItemImage';
import { OrderStatusPill } from './components/OrderStatusPill';
import { getErrorMessage } from './helper/getErrorMessage';
import { getFulfillmentMeta } from './helper/getFulfillmentMeta';
import { getOrderStatusLabel } from './helper/getOrderStatusLabel';
import { formatMoney } from './helper/formatMoney';

const BRAND = '#e13e00';

const ACTIVE_ORDER_STATUSES = new Set<string>([
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
]);

const cardShadow = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type OrderListItem =
  { type: 'header'; title: string; count: number } | { type: 'order'; order: OrderType };

const ACTION_BUTTON_STYLES = {
  primary: {
    container: 'bg-[#e13e00]',
    text: 'text-white',
    icon: '#ffffff',
  },
  danger: {
    container: 'border border-red-100 bg-red-50',
    text: 'text-red-700',
    icon: '#dc2626',
  },
  secondary: {
    container: 'border border-gray-200 bg-white',
    text: 'text-gray-700',
    icon: '#374151',
  },
} as const;

function toCartItem(item: OrderType['items'][number]): CartItem {
  return {
    _id: item.productId,
    name: item.name,
    price: item.price,
    description: item.description,
    image: item.image ?? '',
    quantity: item.quantity,
    modifierSelections: item.modifierSelections,
  };
}

function ModifierList({ modifiers }: { modifiers?: ModifierSelection[] }) {
  if (!modifiers || modifiers.length === 0) return null;

  return (
    <View className="mt-1.5">
      {modifiers.map((group, idx) => (
        <View key={idx} className={idx > 0 ? 'mt-1 border-t border-gray-100 pt-1.5' : ''}>
          <Text className="text-[11px] font-semibold text-gray-500">{group.groupName}</Text>
          <View className="mt-0.5 flex-row flex-wrap gap-x-2 gap-y-0.5">
            {group.items.map((item, iIdx) => (
              <Text key={iIdx} className="text-[11px] text-gray-500">
                {item.name}
                {item.quantity > 1 ? ` x${item.quantity}` : ''}
                {item.upgradePrice > 0
                  ? ` (+₱${(item.upgradePrice * item.quantity).toLocaleString('en-PH')})`
                  : ''}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function OrderItemRow({ item }: { item: OrderType['items'][number] }) {
  return (
    <View className="flex-row gap-3 py-0.5">
      <View className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <OrderItemImage image={item.image} name={item.name} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[13px] font-bold leading-[18px] text-gray-900" numberOfLines={2}>
              {item.name}
            </Text>
            {!!item.description && (
              <Text className="mt-0.5 text-[11px] leading-4 text-gray-400" numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>

          <View className="shrink-0 items-end">
            <Text className="text-[13px] font-extrabold text-gray-950">
              {formatMoney(item.price)}
            </Text>
            <Text className="mt-0.5 text-[11px] font-semibold text-gray-400">x{item.quantity}</Text>
          </View>
        </View>

        <ModifierList modifiers={item.modifierSelections} />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  onPress,
  disabled = false,
}: {
  label: string;
  icon?: IoniconName;
  variant: keyof typeof ACTION_BUTTON_STYLES;
  onPress: () => void;
  disabled?: boolean;
}) {
  const style = ACTION_BUTTON_STYLES[variant];

  return (
    <TouchableOpacity
      className={`min-h-10 flex-row items-center justify-center gap-1.5 rounded-full px-4 ${style.container} ${
        disabled ? 'opacity-[0.55]' : ''
      }`}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}>
      {icon && <Ionicons name={icon} size={15} color={style.icon} />}
      <Text className={`text-[13px] font-bold ${style.text}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function OrderCard({
  order,
  onCancelPress,
  onPayNowPress,
  onAddToCartPress,
  payingOrderId,
  checkingPaymentOrderId,
}: {
  order: OrderType;
  onCancelPress: (order: OrderType) => void;
  onPayNowPress: (order: OrderType) => void;
  onAddToCartPress: (order: OrderType) => void;
  payingOrderId: string | null;
  checkingPaymentOrderId: string | null;
}) {
  const [showAllItems, setShowAllItems] = useState(false);
  const state = useOrderState(order);
  const statusLabel = getOrderStatusLabel(order);
  const referenceNumber = order.paymentInfo.referenceNumber ?? order._id;
  const fulfillment = getFulfillmentMeta(order.fulfillmentType);
  const visibleItems = showAllItems ? order.items : order.items.slice(0, 2);
  const hiddenItemCount = Math.max(order.items.length - visibleItems.length, 0);
  const itemLineCount = order.items.length;

  const isPaying = payingOrderId === order._id;
  const isCheckingPayment = checkingPaymentOrderId === order._id;
  const disableActions = isPaying || isCheckingPayment;

  const hasActions = Boolean(
    state?.needPayment || state?.canCancel || state?.needsReview || state?.isCompleted
  );
  const showFooter = hasActions || isCheckingPayment;

  return (
    <TouchableOpacity
      className={`mb-3 overflow-hidden rounded-3xl bg-white ${state?.isCancelled ? 'opacity-80' : ''}`}
      style={cardShadow.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/orders/${order._id}`)}>
      {/* Header — reference, fulfillment and status */}
      <View className="flex-row items-start justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1">
          <Text
            className="text-[15px] font-extrabold tracking-tight text-gray-950"
            numberOfLines={1}>
            #{referenceNumber}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <Ionicons name={fulfillment.icon} size={12} color="#9ca3af" />
            <Text className="text-xs font-medium text-gray-500">{fulfillment.label}</Text>
            <View className="h-1 w-1 rounded-full bg-gray-300" />
            <Text className="text-xs text-gray-500">
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        <OrderStatusPill status={order.status} label={statusLabel} />
      </View>

      {/* Items */}
      <View className="gap-2 border-t border-gray-100 px-4 pb-3 pt-3">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => (
            <View
              key={`${item.productId}-${idx}`}
              className={idx > 0 ? 'border-t border-dashed border-gray-100 pt-2' : ''}>
              <OrderItemRow item={item} />
            </View>
          ))
        ) : (
          <View className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5">
            <Text className="text-center text-sm font-semibold text-gray-400">No items listed</Text>
          </View>
        )}

        {itemLineCount > 2 && (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1 rounded-xl bg-gray-50 py-2.5"
            activeOpacity={0.8}
            onPress={() => setShowAllItems((current) => !current)}>
            <Text className="text-xs font-bold text-gray-500">
              {showAllItems
                ? 'Show less'
                : `View ${hiddenItemCount} more item${hiddenItemCount === 1 ? '' : 's'}`}
            </Text>
            <Ionicons
              name={showAllItems ? 'chevron-up' : 'chevron-down'}
              size={13}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Totals */}
      <View className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-medium text-gray-400">
            {itemLineCount} item{itemLineCount === 1 ? '' : 's'}
          </Text>
          <View className="h-1 w-1 rounded-full bg-gray-300" />
          <Text className="text-xs font-bold text-[#e13e00]">View details</Text>
          <Ionicons name="chevron-forward" size={11} color="#e13e00" />
        </View>

        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-xs font-semibold text-gray-400">Total</Text>
          <Text className="text-base font-extrabold tracking-tight text-gray-950">
            {formatMoney(order.total.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {showFooter && (
        <View className="gap-2.5 border-t border-gray-100 bg-gray-50/70 px-4 pb-4 pt-3">
          {isCheckingPayment && (
            <View className="flex-row items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-3.5 py-3">
              <ActivityIndicator size="small" color="#b45309" />
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] font-bold text-amber-800">
                  Checking payment status
                </Text>
                <Text className="mt-0.5 text-[11px] leading-4 text-amber-700">
                  Maya is processing your payment. This can take a few moments.
                </Text>
              </View>
            </View>
          )}

          {hasActions && (
            <View className="flex-row flex-wrap justify-end gap-2">
              {state?.needPayment && (
                <ActionButton
                  label={isPaying ? 'Opening...' : isCheckingPayment ? 'Checking...' : 'Pay Now'}
                  icon="card-outline"
                  variant="primary"
                  disabled={disableActions}
                  onPress={() => onPayNowPress(order)}
                />
              )}

              {state?.canCancel && (
                <ActionButton
                  label="Cancel Order"
                  icon="close-circle-outline"
                  variant="danger"
                  disabled={disableActions}
                  onPress={() => onCancelPress(order)}
                />
              )}

              {state?.needsReview && (
                <ActionButton
                  label="Write Review"
                  icon="star-outline"
                  variant="primary"
                  disabled={disableActions}
                  onPress={() => router.push(`/review/${order._id}`)}
                />
              )}

              {state?.isCompleted && !state?.needsReview && (
                <View className="min-h-10 flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4">
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text className="text-[13px] font-bold text-gray-500">Reviewed</Text>
                </View>
              )}

              {state?.isCompleted && (
                <ActionButton
                  label="Buy Again"
                  icon="repeat-outline"
                  variant="secondary"
                  disabled={disableActions}
                  onPress={() => onAddToCartPress(order)}
                />
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function OrdersSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center gap-2 bg-gray-50 px-1 pb-2 pt-5">
      <Text className="text-[13px] font-extrabold uppercase tracking-widest text-gray-400">
        {title}
      </Text>
      <View className="rounded-full bg-gray-200/80 px-2 py-0.5">
        <Text className="text-[11px] font-bold text-gray-600">{count}</Text>
      </View>
    </View>
  );
}

function usePulse() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return pulse;
}

function OrderCardSkeleton({ opacity }: { opacity: Animated.Value }) {
  return (
    <View className="mb-3 rounded-3xl bg-white p-4" style={cardShadow.card}>
      <View className="flex-row items-start justify-between">
        <View className="gap-2">
          <Animated.View style={{ opacity }} className="h-4 w-36 rounded-full bg-gray-100" />
          <Animated.View style={{ opacity }} className="h-3 w-24 rounded-full bg-gray-100" />
        </View>
        <Animated.View style={{ opacity }} className="h-6 w-20 rounded-full bg-gray-100" />
      </View>

      <View className="mt-4 flex-row gap-3 border-t border-gray-100 pt-4">
        <Animated.View style={{ opacity }} className="h-14 w-14 rounded-xl bg-gray-100" />
        <View className="flex-1 gap-2 pt-1">
          <Animated.View style={{ opacity }} className="h-4 w-3/4 rounded-full bg-gray-100" />
          <Animated.View style={{ opacity }} className="h-3 w-1/2 rounded-full bg-gray-100" />
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
        <Animated.View style={{ opacity }} className="h-3 w-24 rounded-full bg-gray-100" />
        <Animated.View style={{ opacity }} className="h-5 w-24 rounded-full bg-gray-100" />
      </View>
    </View>
  );
}

function EmptyOrders({ isGuestSearch }: { isGuestSearch: boolean }) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-50">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-orange-100/70">
          <Ionicons name="receipt-outline" size={26} color={BRAND} />
        </View>
      </View>
      <Text className="mt-5 text-center text-lg font-extrabold tracking-tight text-gray-950">
        {isGuestSearch ? 'No order found' : 'No orders yet'}
      </Text>
      <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
        {isGuestSearch
          ? "We couldn't find an order with that reference number. Double-check it and try again."
          : 'Your order history will appear here after your first checkout.'}
      </Text>

      {!isGuestSearch && (
        <TouchableOpacity
          className="mt-5 min-h-11 items-center justify-center rounded-full bg-[#e13e00] px-6"
          activeOpacity={0.85}
          onPress={() => router.push('/')}>
          <Text className="text-sm font-bold text-white">Browse Menu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function Orders() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const insets = useSafeAreaInsets();
  const pulse = usePulse();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submittedReference, setSubmittedReference] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<OrderType | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [checkingPaymentOrderId, setCheckingPaymentOrderId] = useState<string | null>(null);
  const isAuthenticated = Boolean(session?.user);
  const cancelOrder = useCancelOrder();
  const createMayaCheckout = useCreateMayaCheckout();
  const { addToCart } = useCart();

  const customerOrders = useOrders({
    userType: 'customer',
    enabled: isAuthenticated,
  });
  const guestOrders = useOrders({
    userType: 'guest',
    referenceNumber: submittedReference,
    enabled: !isAuthenticated && submittedReference.length > 0,
  });

  const activeQuery = isAuthenticated ? customerOrders : guestOrders;
  const orders = useMemo(() => {
    const result = activeQuery.data?.pages.flatMap((page) => page.data) ?? [];
    return result;
  }, [activeQuery.data?.pages]);

  const listData = useMemo<OrderListItem[]>(() => {
    if (!isAuthenticated) {
      return orders.map((order) => ({ type: 'order', order }));
    }

    const active = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status));
    const past = orders.filter((order) => !ACTIVE_ORDER_STATUSES.has(order.status));
    const result: OrderListItem[] = [];

    if (active.length > 0) {
      result.push({ type: 'header', title: 'Active', count: active.length });
      active.forEach((order) => result.push({ type: 'order', order }));
    }

    if (past.length > 0) {
      result.push({ type: 'header', title: 'Past', count: past.length });
      past.forEach((order) => result.push({ type: 'order', order }));
    }

    return result;
  }, [isAuthenticated, orders]);

  const handleSearch = () => {
    setSubmittedReference(referenceNumber.trim());
  };

  const handleLoadMore = () => {
    if (!activeQuery.hasNextPage || activeQuery.isFetchingNextPage) return;

    void activeQuery.fetchNextPage();
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      await cancelOrder.mutateAsync(orderToCancel._id);
      setOrderToCancel(null);
    } catch (error) {
      Alert.alert('Cancel failed', getErrorMessage(error));
    }
  };

  const handlePayNow = async (order: OrderType) => {
    setPayingOrderId(order._id);

    try {
      const response = await createMayaCheckout.mutateAsync(order._id);

      if (!response.redirectUrl) {
        Alert.alert('Payment link missing', 'No Maya payment link was returned for this order.');
        return;
      }

      await WebBrowser.openBrowserAsync(response.redirectUrl);
      setCheckingPaymentOrderId(order._id);
      await activeQuery.refetch();
      setTimeout(() => {
        setCheckingPaymentOrderId((current) => (current === order._id ? null : current));
      }, 8000);
    } catch (error) {
      Alert.alert('Payment failed', getErrorMessage(error));
      setCheckingPaymentOrderId(null);
    } finally {
      setPayingOrderId(null);
    }
  };

  const addOrderItemsToCart = (order: OrderType) => {
    if (order.items.length === 0) {
      Alert.alert('No items', 'This order has no items to add.');
      return false;
    }

    order.items.forEach((item) => {
      addToCart(toCartItem(item));
    });

    if (Platform.OS === 'android') {
      ToastAndroid.show('Added order items to cart', ToastAndroid.SHORT);
    }

    return true;
  };

  const handleAddToCart = (order: OrderType) => {
    const added = addOrderItemsToCart(order);

    if (added && Platform.OS !== 'android') {
      Alert.alert('Added to cart', 'Order items were added to your cart.');
    }
  };

  if (isSessionPending) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={listData}
        keyExtractor={(item) => (item.type === 'header' ? `header-${item.title}` : item.order._id)}
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <OrdersSectionHeader title={item.title} count={item.count} />
          ) : (
            <OrderCard
              order={item.order}
              onCancelPress={setOrderToCancel}
              onPayNowPress={handlePayNow}
              onAddToCartPress={handleAddToCart}
              payingOrderId={payingOrderId}
              checkingPaymentOrderId={checkingPaymentOrderId}
            />
          )
        }
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          isAuthenticated || submittedReference ? (
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={() => {
                void activeQuery.refetch();
              }}
              tintColor={BRAND}
              colors={[BRAND]}
            />
          ) : undefined
        }
        ListHeaderComponent={
          <View className="pb-2 pt-1">
            <View className="flex-row items-end justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-2xl font-extrabold tracking-tight text-gray-950">Orders</Text>
                <Text className="mt-1 text-sm leading-5 text-gray-500">
                  {isAuthenticated
                    ? 'Track your orders and manage pending actions.'
                    : 'Look up a guest order with its reference number.'}
                </Text>
              </View>

              {isAuthenticated && orders.length > 0 && (
                <View className="mb-1 rounded-full bg-[#fdeee7] px-3 py-1">
                  <Text className="text-xs font-bold text-[#e13e00]">
                    {orders.length} order{orders.length === 1 ? '' : 's'}
                  </Text>
                </View>
              )}
            </View>

            {!isAuthenticated && (
              <View className="mt-5 rounded-3xl bg-white p-4" style={cardShadow.card}>
                <View className="flex-row items-center gap-2.5">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                    <Ionicons name="search-outline" size={16} color={BRAND} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-bold text-gray-900">Find your order</Text>
                    <Text className="text-[11px] text-gray-400">
                      Enter the reference number from your receipt
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                  <Ionicons name="barcode-outline" size={15} color="#9ca3af" />
                  <TextInput
                    className="min-h-12 flex-1 text-sm text-gray-950"
                    placeholder="ORD-123456"
                    placeholderTextColor="#b9b9b9"
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    autoCapitalize="characters"
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                </View>

                <TouchableOpacity
                  className={`mt-3 min-h-12 items-center justify-center rounded-2xl bg-[#e13e00] ${
                    referenceNumber.trim() ? '' : 'opacity-[0.55]'
                  }`}
                  activeOpacity={0.85}
                  onPress={handleSearch}
                  disabled={!referenceNumber.trim()}>
                  <Text className="text-[15px] font-bold text-white">Search Order</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeQuery.isError && (
              <View className="mt-4 flex-row items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-red-700">Couldn&apos;t load orders</Text>
                  <Text className="mt-0.5 text-xs leading-4 text-red-600" numberOfLines={2}>
                    {activeQuery.error?.message || 'Please check your connection and try again.'}
                  </Text>
                </View>
                <TouchableOpacity
                  className="rounded-full bg-red-600 px-3.5 py-2"
                  activeOpacity={0.85}
                  onPress={() => {
                    void activeQuery.refetch();
                  }}>
                  <Text className="text-xs font-bold text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          activeQuery.isLoading ? (
            <View>
              <OrderCardSkeleton opacity={pulse} />
              <OrderCardSkeleton opacity={pulse} />
              <OrderCardSkeleton opacity={pulse} />
            </View>
          ) : !isAuthenticated && !submittedReference ? null : (
            <EmptyOrders isGuestSearch={!isAuthenticated} />
          )
        }
        ListFooterComponent={
          activeQuery.isFetchingNextPage ? (
            <View className="items-center py-5">
              <ActivityIndicator color={BRAND} />
            </View>
          ) : null
        }
      />

      <CancelOrderModal
        visible={Boolean(orderToCancel)}
        referenceNumber={orderToCancel?.paymentInfo.referenceNumber ?? orderToCancel?._id}
        isCancelling={cancelOrder.isPending}
        onCancel={() => setOrderToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </KeyboardAvoidingView>
  );
}
