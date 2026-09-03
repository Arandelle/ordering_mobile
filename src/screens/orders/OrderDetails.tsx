import { useState, type ComponentProps, type ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCancelOrder, useOrder } from '@/hooks/useOrders';
import { formatDate } from '@/helper/formatter/formateDate';
import { ORDER_STATUSES } from '@/types/orders.type';
import { FULFILLMENT_TYPE, OrderType } from '@/types/orders.type';
import { ModifierSelection } from '@/types/menu-types';

import { useOrderState } from './hooks/useOrderState';
import { CancelOrderModal } from './components/CancelOrderModal';
import { OrderStatusPill } from './components/OrderStatusPill';
import { OrderTimeline } from './components/OrderTimeline';
import { getErrorMessage } from './helper/getErrorMessage';
import { getFulfillmentMeta } from './helper/getFulfillmentMeta';
import { formatDisplayLabel, getOrderStatusLabel } from './helper/getOrderStatusLabel';
import { getPaymentMethodLabel, getPaymentStatusMeta } from './helper/getPaymentMeta';
import { formatMoney } from '@/helper/formatter';
import DynamicImage from '@/components/ui/DynamicImage';

const BRAND = '#e13e00';

const ACTIVE_STATUSES = new Set<string>([
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY_FOR_PICKUP,
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

function DetailRow({
  label,
  value,
  valueClassName = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="shrink-0 text-sm text-gray-500">{label}</Text>
      <Text className={`flex-1 text-right text-sm font-bold ${valueClassName}`} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IoniconName;
  label: string;
  value?: string | null;
}) {
  const display = value?.trim() ? value : 'Not available';

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Ionicons name={icon} size={15} color="#6b7280" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </Text>
        <Text className="mt-0.5 text-sm font-semibold text-gray-900" numberOfLines={1}>
          {display}
        </Text>
      </View>
    </View>
  );
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

function Section({
  icon,
  title,
  children,
}: {
  icon: IoniconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-3 rounded-3xl bg-white p-4" style={cardShadow.card}>
      <View className="mb-3 flex-row items-center gap-2.5">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
          <Ionicons name={icon} size={15} color={BRAND} />
        </View>
        <Text className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-950">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function PaymentStatusPill({ status }: { status?: string | null }) {
  const meta = getPaymentStatusMeta(status);

  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1">
      <View className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      <Text className="text-[11px] font-bold text-gray-600">{meta.label}</Text>
    </View>
  );
}

function TerminationNotice({ order }: { order: OrderType }) {
  const title = formatDisplayLabel(order.status);
  const endedAt =
    order.timeline?.cancelledAt ?? order.timeline?.failedAt ?? order.timeline?.expiredAt;
  const reason = order.terminationDetails?.reason;

  return (
    <View className="flex-row gap-3">
      <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
        <Ionicons name="close-circle-outline" size={22} color="#dc2626" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-extrabold tracking-tight text-gray-950">
          Order {title.toLowerCase()}
        </Text>
        {endedAt && <Text className="mt-0.5 text-xs text-gray-500">{formatDate(endedAt)}</Text>}
        <Text className="mt-1.5 text-sm leading-5 text-gray-600">
          {reason ? `Reason: ${reason}` : 'This order is no longer active.'}
        </Text>
      </View>
    </View>
  );
}

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const orderId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const { data: order, isLoading, isError, error, refetch, isRefetching } = useOrder(orderId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const cancelOrder = useCancelOrder();
  const state = useOrderState(order ?? null);

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
        <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-50">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-orange-100/70">
            <Ionicons name="receipt-outline" size={26} color={BRAND} />
          </View>
        </View>
        <Text className="mt-5 text-center text-lg font-extrabold tracking-tight text-gray-950">
          Order not found
        </Text>
        <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
          {error?.message || 'Unable to load this order.'}
        </Text>
        <TouchableOpacity
          className="mt-5 min-h-12 items-center justify-center rounded-2xl bg-[#e13e00] px-8"
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

  const statusLabel = getOrderStatusLabel(order);
  const referenceNumber = order.paymentInfo.referenceNumber ?? order._id;
  const address = order.paymentInfo.shippingAddress;
  const fulfillment = getFulfillmentMeta(order.fulfillmentType);
  const paymentMethodLabel = getPaymentMethodLabel(order.paymentInfo.paymentMethod);
  const isActiveOrder = ACTIVE_STATUSES.has(order.status);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const scheduledLabel = (() => {
    if (order.fulfillmentType === FULFILLMENT_TYPE.PICKUP && order.pickupTime) {
      return `Pickup · ${formatDate(order.pickupTime)}`;
    }

    if (order.fulfillmentType === FULFILLMENT_TYPE.DINE_IN && order.reservation?.scheduledAt) {
      const partySize = order.reservation.partySize;

      return `Reservation · ${formatDate(order.reservation.scheduledAt)}${
        partySize ? ` · ${partySize} guest${partySize === 1 ? '' : 's'}` : ''
      }`;
    }

    return null;
  })();

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + (state?.canCancel ? 108 : 32) }}
        showsVerticalScrollIndicator={false}>
        {/* Hero — reference, meta and status */}
        <View className="mb-3 rounded-3xl bg-white p-5" style={cardShadow.card}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Order reference
              </Text>
              <Text
                className="mt-1 text-xl font-extrabold tracking-tight text-gray-950"
                numberOfLines={1}>
                #{referenceNumber}
              </Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-1">
                <Ionicons name={fulfillment.icon} size={12} color="#9ca3af" />
                <Text className="text-xs font-medium text-gray-500">{fulfillment.label}</Text>
                <View className="mx-1 h-1 w-1 rounded-full bg-gray-300" />
                <Ionicons name="card-outline" size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-500">{paymentMethodLabel}</Text>
                <View className="mx-1 h-1 w-1 rounded-full bg-gray-300" />
                <Text className="text-xs text-gray-500">{formatDate(order.createdAt)}</Text>
              </View>
            </View>

            <OrderStatusPill status={order.status} label={statusLabel} size="md" />
          </View>

          {(isActiveOrder && !!order.estimatedTime) || scheduledLabel ? (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {isActiveOrder && !!order.estimatedTime && (
                <View className="flex-row items-center gap-1.5 rounded-full bg-[#fdeee7] px-3 py-1.5">
                  <Ionicons name="timer-outline" size={13} color={BRAND} />
                  <Text className="text-xs font-bold text-[#e13e00]">
                    Est. {order.estimatedTime}
                  </Text>
                </View>
              )}

              {scheduledLabel && (
                <View className="flex-row items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5">
                  <Ionicons name="calendar-outline" size={13} color={BRAND} />
                  <Text className="text-xs font-bold text-orange-700">{scheduledLabel}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Progress or termination */}
        <View className="mb-3 rounded-3xl bg-white p-4" style={cardShadow.card}>
          {state?.isCancelled ? (
            <TerminationNotice order={order} />
          ) : (
            <>
              <View className="mb-4 flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
                  <Ionicons name="time-outline" size={15} color={BRAND} />
                </View>
                <Text className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-950">
                  Order progress
                </Text>
              </View>

              <OrderTimeline order={order} />

              {order.dispatchInfo?.riderName && (
                <View className="mt-5 flex-row items-center gap-2.5 rounded-2xl bg-gray-50 px-3 py-2.5">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                    <Ionicons name="bicycle-outline" size={15} color={BRAND} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1}>
                      {order.dispatchInfo.riderName}
                    </Text>
                    {!!order.dispatchInfo.riderPhone && (
                      <Text className="text-[11px] text-gray-500">
                        {order.dispatchInfo.riderPhone}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Items */}
        <Section icon="fast-food-outline" title={`Items (${totalItems})`}>
          <View className="gap-4">
            {order.items.map((item, idx) => (
              <View
                key={`${item.productId}-${idx}`}
                className={idx > 0 ? 'border-t border-gray-100 pt-4' : ''}>
                <View className="flex-row gap-3">
                  <DynamicImage
                    src={item.image ?? undefined}
                    alt={item.name}
                    variant="order"
                    containerClassName="w-16 h-16 rounded-2xl overflow-hiddenFF"
                  />

                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text
                        className="min-w-0 flex-1 text-sm font-bold leading-5 text-gray-950"
                        numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text className="shrink-0 text-sm font-extrabold text-gray-950">
                        {formatMoney(item.price * item.quantity)}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-gray-500">
                      {item.quantity} x {formatMoney(item.price)}
                    </Text>
                    <ModifierList modifiers={item.modifierSelections} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* Payment */}
        <Section icon="card-outline" title="Payment">
          <View className="gap-3">
            <DetailRow label="Method" value={paymentMethodLabel} />
            <View className="flex-row items-center justify-between gap-4">
              <Text className="shrink-0 text-sm text-gray-500">Status</Text>
              <PaymentStatusPill status={order.paymentInfo.paymentStatus} />
            </View>
            <DetailRow label="Paid at" value={formatDate(order.paymentInfo.paidAt)} />
          </View>
        </Section>

        {/* Customer */}
        <Section icon="person-outline" title="Customer">
          <View className="gap-3.5">
            <InfoRow
              icon="person-outline"
              label="Name"
              value={`${order.paymentInfo.firstName} ${order.paymentInfo.lastName}`.trim()}
            />
            <InfoRow icon="mail-outline" label="Email" value={order.paymentInfo.customerEmail} />
            <InfoRow icon="call-outline" label="Phone" value={order.paymentInfo.customerPhone} />
          </View>
        </Section>

        {address && (
          <Section icon="location-outline" title="Delivery Address">
            <View className="flex-row gap-3">
              <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                <Ionicons name="location-outline" size={15} color="#6b7280" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold leading-5 text-gray-800">
                  {[
                    address.line1,
                    address.line2,
                    address.city,
                    address.province,
                    address.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
                {!!address.landmark && (
                  <Text className="mt-1.5 text-xs text-gray-500">Landmark: {address.landmark}</Text>
                )}
              </View>
            </View>
          </Section>
        )}

        {/* Summary */}
        <Section icon="receipt-outline" title="Order Summary">
          <View className="gap-2.5">
            <DetailRow label="Vatable sales" value={formatMoney(order.total.vatableSales)} />
            <DetailRow label="VAT" value={formatMoney(Number(order.total.vatAmount))} />
            {!!order.total.deliveryFeeAmount && order.total.deliveryFeeAmount > 0 && (
              <DetailRow label="Delivery fee" value={formatMoney(order.total.deliveryFeeAmount)} />
            )}
            {!!order.total.discountAmount && order.total.discountAmount > 0 && (
              <DetailRow
                label="Discount"
                value={`- ${formatMoney(order.total.discountAmount)}`}
                valueClassName="text-emerald-600"
              />
            )}
            <View className="my-1 h-px bg-gray-100" />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-extrabold tracking-tight text-[#e13e00]">
                {formatMoney(order.total.totalAmount)}
              </Text>
            </View>
          </View>
        </Section>

        {!!order.notes && (
          <Section icon="chatbubble-ellipses-outline" title="Notes">
            <View className="rounded-2xl bg-gray-50 px-3.5 py-3">
              <Text className="text-sm leading-5 text-gray-700">{order.notes}</Text>
            </View>
          </Section>
        )}
      </ScrollView>

      {state?.canCancel && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <TouchableOpacity
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50"
            activeOpacity={0.85}
            onPress={() => setShowCancelModal(true)}>
            <Ionicons name="close-circle-outline" size={17} color="#dc2626" />
            <Text className="text-[15px] font-bold text-red-600">Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

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
