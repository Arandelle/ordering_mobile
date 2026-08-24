import { useMemo, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { authClient } from '@/lib/auth-client';
import { ORDER_STATUSES, getActionConfig } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';
import { PAYMENT_STATUSES } from '@/types/payment.type';
import { useCancelOrder, useCreateMayaCheckout, useOrders } from '@/hooks/useOrders';
import { useOrderState } from './hooks/useOrderState';
import { CancelOrderModal } from './components/CancelOrderModal';
import { getErrorMessage } from './helper/getErrorMessage';
import { getStatusClasses } from './helper/getStatusClasses';
import { formatMoney } from './helper/formatMoney';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/menu-types';
import { OrderItemImage } from './components/OrderItemImage';

const BRAND = '#e13e00';

const ACTION_BUTTON_STYLES = {
  primary: {
    container: 'border-[#e13e00] bg-[#e13e00]',
    text: 'text-white',
    icon: 'white',
  },
  danger: {
    container: 'border-red-200 bg-white',
    text: 'text-red-700',
    icon: '#b91c1c',
  },
  secondary: {
    container: 'border-gray-200 bg-white',
    text: 'text-gray-700',
    icon: '#374151',
  },
  muted: {
    container: 'border-gray-200 bg-gray-50',
    text: 'text-gray-400',
    icon: '#9ca3af',
  },
} as const;

function formatDisplayLabel(value?: string | null) {
  if (!value) return 'Pending';

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getOrderStatusLabel(order: OrderType) {
  const statusLabel = formatDisplayLabel(order.status);
  const isPaid = order.paymentInfo?.paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS;

  return isPaid ? `Paid - ${statusLabel}` : statusLabel;
}

function toCartItem(item: OrderType['items'][number]): CartItem {
  return {
    _id: item.productId,
    name: item.name,
    price: item.price,
    description: item.description,
    image: item.image ?? '',
    quantity: item.quantity,
  };
}

function OrderItemRow({ item }: { item: OrderType['items'][number] }) {
  return (
    <View className="flex-row gap-3 rounded-xl p-2">
      <View className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
        <OrderItemImage image={item.image} name={item.name} />
      </View>

      <View className="min-w-0 flex-1 flex-row justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold leading-5 text-gray-900" numberOfLines={2}>
            {item.name}
          </Text>
          {!!item.description && (
            <Text className="mt-0.5 text-xs leading-4 text-gray-500" numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>

        <View className="items-end">
          <Text className="text-sm font-extrabold text-gray-950">{formatMoney(item.price)}</Text>
          <Text className="mt-1 text-xs font-semibold text-gray-500">x{item.quantity}</Text>
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  variant,
  onPress,
  disabled = false,
}: {
  label?: string | ReactNode;
  variant: keyof typeof ACTION_BUTTON_STYLES;
  onPress: () => void;
  disabled?: boolean;
}) {
  const style = ACTION_BUTTON_STYLES[variant];
  const disabledClassName = disabled ? 'opacity-[0.55]' : '';

  return (
    <TouchableOpacity
      className={`min-h-9 flex-row items-center justify-center gap-1.5 rounded-3xl border px-3 ${style.container} ${disabledClassName}`}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}>
      {label && <Text className={`text-center text-sm font-bold ${style.text}`}>{label}</Text>}
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
  const statusClasses = getStatusClasses(order.status);
  const orderStatusLabel = getOrderStatusLabel(order);
  const cancelConfig = getActionConfig(order.status, ORDER_STATUSES.CANCELLED);
  const visibleItems = showAllItems ? order.items : order.items.slice(0, 1);
  const hiddenItemCount = Math.max(order.items.length - visibleItems.length, 0);

  const isPaying = payingOrderId === order._id;
  const isCheckingPayment = checkingPaymentOrderId === order._id;
  const disableActions = isPaying || isCheckingPayment;
  const cardStateClass = state?.isCancelled ? 'opacity-70' : '';

  return (
    <TouchableOpacity
      className={`mb-2 overflow-hidden bg-white ${cardStateClass}`}
      activeOpacity={0.88}
      onPress={() => router.push(`/orders/${order._id}`)}>
      <View className="p-4">
        <View className="mb-3 flex-row items-start justify-end gap-3">
          <View className={`rounded-full px-2.5 py-0.5 ${statusClasses.container}`}>
            <Text className={`text-[11px] font-bold ${statusClasses.text}`}>
              {orderStatusLabel}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => <OrderItemRow key={item.productId} item={item} />)
          ) : (
            <View className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
              <Text className="text-center text-sm font-semibold text-gray-500">
                No items listed
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className={`mt-2 flex-row items-center justify-start gap-1 rounded-xl px-2 py-1 ${order.items.length > 1 ? 'opacity-100' : 'opacity-0'}`}
            activeOpacity={0.85}
            onPress={() => setShowAllItems((current) => !current)}>
            <Text className="text-sm font-bold text-gray-500">
              {showAllItems ? 'Show less' : `View more (${hiddenItemCount})`}
            </Text>
            {showAllItems ? (
              <Ionicons name='chevron-up-outline' size={14} className="text-gray-500" />
            ) : (
              <Ionicons name='chevron-down-outline' size={14} className="text-gray-500" />
            )}
          </TouchableOpacity>

          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-gray-400">Total: </Text>
            <Text className="text-sm font-semibold text-gray-950">
              {formatMoney(order.total.totalAmount)}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 py-3">
        {isCheckingPayment && (
          <View className="mb-3 rounded-2xl bg-amber-50 px-4 py-3">
            <Text className="text-sm font-bold text-amber-800">Checking payment status</Text>
            <Text className="mt-1 text-xs leading-4 text-amber-700">
              Maya is processing your payment. This can take a few moments.
            </Text>
          </View>
        )}

        <View className="flex-row flex-wrap justify-end gap-2">
          {state?.needPayment && (
            <ActionButton
              label={isPaying ? 'Opening...' : isCheckingPayment ? 'Checking...' : 'Pay Now'}
              variant="primary"
              disabled={disableActions}
              onPress={() => onPayNowPress(order)}
            />
          )}

          {state?.canCancel && (
            <ActionButton
              label={cancelConfig?.label ?? 'Cancel'}
              variant="danger"
              disabled={disableActions}
              onPress={() => onCancelPress(order)}
            />
          )}

          {state?.needsReview && (
            <ActionButton
              label="Write Review"
              variant="primary"
              disabled={disableActions}
              onPress={() => router.push(`/review/${order._id}`)}
            />
          )}

          {state?.isCompleted && (
            <>
              {!state?.needsReview && (
                <ActionButton
                  label="View Review"
                  variant="muted"
                  disabled
                  onPress={() => undefined}
                />
              )}
              <ActionButton
                label={
                  <Ionicons
                    name="cart-outline"
                    size={14}
                    color={ACTION_BUTTON_STYLES.secondary.icon}
                  />
                }
                variant="secondary"
                disabled={disableActions}
                onPress={() => onAddToCartPress(order)}
              />
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyOrders({ isGuestSearch }: { isGuestSearch: boolean }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-orange-50">
        <Ionicons name='clipboard-outline' size={24} color={BRAND} />
      </View>
      <Text className="text-center text-lg font-extrabold text-gray-950">
        {isGuestSearch ? 'No order found' : 'No orders yet'}
      </Text>
      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
        {isGuestSearch
          ? 'Check the reference number and try again.'
          : 'Your order history will appear here after checkout.'}
      </Text>
    </View>
  );
}

export default function Orders() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
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
    return activeQuery.data?.pages.flatMap((page) => page.data) ?? [];
  }, [activeQuery.data?.pages]);

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
        data={orders}
        keyExtractor={(order) => order._id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onCancelPress={setOrderToCancel}
            onPayNowPress={handlePayNow}
            onAddToCartPress={handleAddToCart}
            payingOrderId={payingOrderId}
            checkingPaymentOrderId={checkingPaymentOrderId}
          />
        )}
        contentContainerClassName=""
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
            />
          ) : undefined
        }
        ListHeaderComponent={
          <View className="p-5">
            <Text className="text-2xl font-extrabold text-gray-950">Orders</Text>
            <Text className="mt-1 text-sm leading-5 text-gray-500">
              {isAuthenticated
                ? 'Track your recent orders and available actions.'
                : 'Enter your order reference number to check a guest order.'}
            </Text>

            {!isAuthenticated && (
              <View className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">
                  Order reference number
                </Text>
                <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                  <Ionicons name="search-outline" size={17} color="#9ca3af" />
                  <TextInput
                    className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                    placeholder="Example: ORD-123456"
                    placeholderTextColor="#b9b9b9"
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    autoCapitalize="characters"
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                </View>

                <TouchableOpacity
                  className={`mt-4 min-h-12 items-center justify-center rounded-2xl bg-[#e13e00] ${
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
              <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="text-sm font-semibold text-red-700">
                  {activeQuery.error.message || 'Unable to load orders.'}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          activeQuery.isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={BRAND} />
              <Text className="mt-3 text-sm font-semibold text-gray-500">Loading orders...</Text>
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
