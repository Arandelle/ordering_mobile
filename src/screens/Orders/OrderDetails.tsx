import { useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, ClipboardList, XCircle } from 'lucide-react-native';
import { ORDER_STATUSES } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';
import { useCancelOrder, useOrder } from '@/hooks/useOrders';
import { useOrderState } from './hooks/useOrderState';
import { CancelOrderModal } from './components/CancelOrderModal';

const BRAND = '#e13e00';

function formatMoney(value: number | undefined) {
  return `PHP ${(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | Date) {
  if (!value) return 'Not available';

  return new Date(value).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusClasses(status: OrderType['status']) {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return { container: 'bg-amber-50', text: 'text-amber-700' };
    case ORDER_STATUSES.PREPARING:
      return { container: 'bg-orange-50', text: 'text-orange-700' };
    case ORDER_STATUSES.READY:
      return { container: 'bg-emerald-50', text: 'text-emerald-700' };
    case ORDER_STATUSES.COMPLETED:
      return { container: 'bg-green-50', text: 'text-green-700' };
    case ORDER_STATUSES.CANCELLED:
    case ORDER_STATUSES.FAILED:
    case ORDER_STATUSES.EXPIRED:
      return { container: 'bg-red-50', text: 'text-red-700' };
    default:
      return { container: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  return 'Unable to cancel order. Please try again.';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="flex-1 text-sm text-gray-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-bold text-gray-900">{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-3 text-[15px] font-bold text-gray-950">{title}</Text>
      {children}
    </View>
  );
}

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const orderId = Array.isArray(id) ? id[0] : id;
  const { data: order, isLoading, isError, error, refetch, isRefetching } = useOrder(orderId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const cancelOrder = useCancelOrder();

  const handleConfirmCancel = async () => {
    if (!orderId) return;

    try {
      await cancelOrder.mutateAsync(orderId);
      setShowCancelModal(false);
    } catch (cancelError) {
      Alert.alert('Cancel failed', getErrorMessage(cancelError));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-orange-50">
          <ClipboardList size={24} color={BRAND} />
        </View>
        <Text className="text-center text-lg font-extrabold text-gray-950">Order not found</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
          {error?.message || 'Unable to load this order.'}
        </Text>
        <TouchableOpacity
          className="mt-5 min-h-12 items-center justify-center rounded-2xl bg-[#e13e00] px-6"
          activeOpacity={0.85}
          onPress={() => {
            void refetch();
          }}>
          <Text className="text-[15px] font-bold text-white">
            {isRefetching ? 'Retrying...' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusClasses = getStatusClasses(order.status);
  const state = useOrderState(order);
  const referenceNumber = order.paymentInfo.referenceNumber ?? order._id;
  const address = order.paymentInfo.shippingAddress;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}>
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase text-gray-400">Status</Text>
              <Text className="mt-1 text-lg font-extrabold capitalize text-gray-950">
                {order.status}
              </Text>
              <Text className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt)}</Text>
            </View>

            <View className={`rounded-full px-3 py-1 ${statusClasses.container}`}>
              <Text className={`text-xs font-extrabold capitalize ${statusClasses.text}`}>
                {order.status}
              </Text>
            </View>
          </View>

          {state?.canCancel && (
            <TouchableOpacity
              className="mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-red-600"
              activeOpacity={0.85}
              onPress={() => setShowCancelModal(true)}>
              <XCircle size={17} color="#fff" />
              <Text className="text-[15px] font-bold text-white">Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        <Section title="Items">
          <View className="gap-3">
            {order.items.map((item) => (
              <View key={item.productId} className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-950" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-500">
                    {item.quantity} x {formatMoney(item.price)}
                  </Text>
                </View>
                <Text className="text-sm font-extrabold text-gray-950">
                  {formatMoney(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Payment">
          <View className="gap-2.5">
            <DetailRow label="Method" value={order.paymentInfo.paymentMethod.toUpperCase()} />
            <DetailRow label="Status" value={order.paymentInfo.paymentStatus} />
            <DetailRow label="Paid at" value={formatDate(order.paymentInfo.paidAt)} />
          </View>
        </Section>

        <Section title="Customer">
          <View className="gap-2.5">
            <DetailRow
              label="Name"
              value={`${order.paymentInfo.firstName} ${order.paymentInfo.lastName}`.trim()}
            />
            <DetailRow label="Email" value={order.paymentInfo.customerEmail} />
            <DetailRow label="Phone" value={order.paymentInfo.customerPhone} />
          </View>
        </Section>

        <Section title="Delivery Address">
          <Text className="text-sm leading-5 text-gray-800">
            {[address.line1, address.line2, address.city, address.province, address.postalCode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {!!address.landmark && (
            <Text className="mt-2 text-xs text-gray-500">Landmark: {address.landmark}</Text>
          )}
        </Section>

        <Section title="Summary">
          <View className="gap-2.5">
            <DetailRow label="Vatable sales" value={formatMoney(order.total.vatableSales)} />
            <DetailRow label="VAT" value={formatMoney(order.total.vatAmount)} />
            <View className="my-1 h-px bg-gray-100" />
            <DetailRow label="Total" value={formatMoney(order.total.totalAmount)} />
          </View>
        </Section>

        {!!order.notes && (
          <Section title="Notes">
            <Text className="text-sm leading-5 text-gray-800">{order.notes}</Text>
          </Section>
        )}
      </ScrollView>

      <CancelOrderModal
        visible={showCancelModal}
        referenceNumber={referenceNumber}
        isCancelling={cancelOrder.isPending}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </View>
  );
}
