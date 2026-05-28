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
  View,
} from 'react-native';
import { ClipboardList, CreditCard, Eye, MessageSquare, Search, XCircle } from 'lucide-react-native';
import { authClient } from '@/lib/auth-client';
import { ORDER_STATUSES, getActionConfig } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';
import { PAYMENT_STATUSES } from '@/types/payment.type';
import { useCancelOrder, useCreateMayaCheckout, useOrders } from '@/hooks/useOrders';
import { useOrderState } from './hooks/useOrderState';
import { CancelOrderModal } from './components/CancelOrderModal';
import { formatDate } from '@/helper/formateDate';
import { getErrorMessage } from './helper/getErrorMessage';
import { getStatusClasses } from './helper/getStatusClasses';
import { formatMoney } from './helper/formatMoney';

const BRAND = '#e13e00';

const ACTION_BUTTON_STYLES = {
  primary: {
    container: 'border-[#e13e00] bg-[#e13e00]',
    text: 'text-white',
    icon: 'white',
  },
  danger: {
    container: 'border-red-600 bg-red-600',
    text: 'text-white',
    icon: 'white',
  },
  review: {
    container: 'border-emerald-600 bg-emerald-600',
    text: 'text-white',
    icon: 'white',
  },
  outline: {
    container: 'border-gray-200 bg-white',
    text: 'text-gray-800',
    icon: '#374151',
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

function getPaymentStatusLabel(paymentStatus?: string | null) {
  if (paymentStatus === PAYMENT_STATUSES.PAYMENT_SUCCESS) return 'Paid';
  if (paymentStatus === PAYMENT_STATUSES.PAYMENT_FAILED) return 'Failed';
  if (paymentStatus === PAYMENT_STATUSES.PAYMENT_EXPIRED) return 'Expired';

  return formatDisplayLabel(paymentStatus);
}

function ActionButton({
  label,
  icon,
  variant,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  variant: keyof typeof ACTION_BUTTON_STYLES;
  onPress: () => void;
  disabled?: boolean;
}) {
  const style = ACTION_BUTTON_STYLES[variant];
  const disabledClassName = disabled ? 'opacity-[0.55]' : '';

  return (
    <TouchableOpacity
      className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-3 ${style.container} ${disabledClassName}`}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}>
      {icon}
      <Text className={`text-center text-[13px] font-bold ${style.text}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function OrderCard({
  order,
  onCancelPress,
  onPayNowPress,
  payingOrderId,
  checkingPaymentOrderId,
}: {
  order: OrderType;
  onCancelPress: (order: OrderType) => void;
  onPayNowPress: (order: OrderType) => void;
  payingOrderId: string | null;
  checkingPaymentOrderId: string | null;
}) {
  const state = useOrderState(order);
  const statusClasses = getStatusClasses(order.status);
  const orderStatusLabel = getOrderStatusLabel(order);
  const paymentStatusLabel = getPaymentStatusLabel(order.paymentInfo?.paymentStatus);
  const referenceNumber = order.paymentInfo?.referenceNumber ?? order._id;
  const cancelConfig = getActionConfig(order.status, ORDER_STATUSES.CANCELLED);
  const itemPreview = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
  const hiddenItemCount = Math.max(order.items.length - 2, 0);

  const isPaying = payingOrderId === order._id;
  const isCheckingPayment = checkingPaymentOrderId === order._id;
  const disableActions = isPaying || isCheckingPayment;

  return (
    <View className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-gray-400">Reference</Text>
          <Text className="mt-1 text-base font-extrabold text-gray-950">{referenceNumber}</Text>
          <Text className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt)}</Text>
        </View>

        <View className={`rounded-full px-3 py-1 ${statusClasses.container}`}>
          <Text className={`text-xs font-extrabold ${statusClasses.text}`}>{orderStatusLabel}</Text>
        </View>
      </View>

      <View className="my-4 h-px bg-gray-100" />

      <Text className="text-sm font-semibold text-gray-900">
        {itemPreview || 'No items listed'}
        {hiddenItemCount > 0 ? `, +${hiddenItemCount} more` : ''}
      </Text>
      <Text className="mt-1 text-xs text-gray-500">
        {order.branchSnapshot?.name ?? 'Branch pending'} - {order.paymentInfo.paymentMethod?.toUpperCase()}
      </Text>

      <View className="mt-4 flex-row items-end justify-between">
        <View>
          <Text className="text-xs font-semibold uppercase text-gray-400">Total</Text>
          <Text className="mt-1 text-lg font-extrabold text-gray-950">
            {formatMoney(order.total.totalAmount)}
          </Text>
        </View>
        <Text className="text-xs font-semibold text-gray-500">
          Payment: {paymentStatusLabel}
        </Text>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {isCheckingPayment && (
          <View className="w-full rounded-2xl bg-amber-50 px-4 py-3">
            <Text className="text-sm font-bold text-amber-800">Checking payment status</Text>
            <Text className="mt-1 text-xs leading-4 text-amber-700">
              Maya is processing your payment. This can take a few moments.
            </Text>
          </View>
        )}

        {state?.canCancel && (
          <ActionButton
            label={cancelConfig?.label ?? 'Cancel'}
            variant="danger"
            icon={<XCircle size={16} color="white" />}
            disabled={disableActions}
            onPress={() => onCancelPress(order)}
          />
        )}

        {state?.needPayment && (
          <ActionButton
            label={isPaying ? 'Opening...' : isCheckingPayment ? 'Checking...' : 'Pay Now'}
            variant="primary"
            icon={<CreditCard size={16} color="white" />}
            disabled={disableActions}
            onPress={() => onPayNowPress(order)}
          />
        )}

        {state?.needsReview && (
          <ActionButton
            label={order.isReviewed ? 'Reviewed' : 'Review Order'}
            variant="review"
            icon={<MessageSquare size={16} color={ACTION_BUTTON_STYLES.review.icon} />}
            disabled={disableActions}
            onPress={() => router.push(`/review/${order._id}`)}
          />
        )}

        <ActionButton
          label="View Details"
          variant="outline"
          icon={<Eye size={16} color={ACTION_BUTTON_STYLES.outline.icon} />}
          disabled={disableActions}
          onPress={() => router.push(`/orders/${order._id}`)}
        />
      </View>
    </View>
  );
}

function EmptyOrders({ isGuestSearch }: { isGuestSearch: boolean }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-orange-50">
        <ClipboardList size={24} color={BRAND} />
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
            payingOrderId={payingOrderId}
            checkingPaymentOrderId={checkingPaymentOrderId}
          />
        )}
        contentContainerClassName="px-5 pb-8 pt-6"
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
          <View className="mb-5">
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
                  <Search size={17} color="#9ca3af" />
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
