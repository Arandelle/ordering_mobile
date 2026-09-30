import { useState, type ComponentProps, type ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
    <View className="flex-row items-start justify-between gap-4 py-2">
      <Text className="shrink-0 text-sm text-gray-500">{label}</Text>
      <Text
        className={`flex-1 text-right text-sm font-semibold ${valueClassName}`}
        numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function CustomerField({
  icon,
  label,
  value,
}: {
  icon: IoniconName;
  label: string;
  value?: string | null;
}) {
  const display = value?.trim() ? value : '—';

  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <Ionicons name={icon} size={16} color="#9ca3af" />
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-medium text-gray-400">{label}</Text>
        <Text className="mt-0.5 text-sm text-gray-900" numberOfLines={1}>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-3 bg-white p-8">
      <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
        {title}
      </Text>
      {children}
    </View>
  );
}

function TerminationNotice({ order }: { order: OrderType }) {
  const title = formatDisplayLabel(order.status);
  const endedAt =
    order.timeline?.cancelledAt ?? order.timeline?.failedAt ?? order.timeline?.expiredAt;
  const reason = order.terminationDetails?.reason;

  return (
    <View className="flex-row gap-3 rounded-lg bg-red-50 p-4">
      <Ionicons name="close-circle-outline" size={22} color="#dc2626" style={{ marginTop: 1 }} />
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-bold text-red-900">Order {title.toLowerCase()}</Text>
        {endedAt && <Text className="mt-0.5 text-xs text-red-700">{formatDate(endedAt)}</Text>}
        <Text className="mt-1.5 text-sm leading-5 text-red-700">
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
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
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
          className="mt-5 min-h-12 items-center justify-center rounded-md bg-[#e13e00] px-8"
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

  const customerName = `${order.paymentInfo.firstName} ${order.paymentInfo.lastName}`.trim() || '—';

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + (state?.canCancel ? 108 : 32) }}
        showsVerticalScrollIndicator={false}>
        {/* Hero — reference, status, meta */}
        <View className="bg-white p-8">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                Order Reference
              </Text>
              <Text
                className="mt-1 text-2xl font-bold tracking-tight text-gray-900"
                numberOfLines={1}>
                #{referenceNumber}
              </Text>
            </View>

            <OrderStatusPill status={order.status} label={statusLabel} size="md" />
          </View>

          <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name={fulfillment.icon} size={13} color="#6b7280" />
              <Text className="text-xs font-medium text-gray-600">{fulfillment.label}</Text>
            </View>
            <View className="h-3 w-px bg-gray-200" />
            <View className="flex-row items-center gap-1">
              <Ionicons name="card-outline" size={13} color="#6b7280" />
              <Text className="text-xs text-gray-600">{paymentMethodLabel}</Text>
            </View>
            <View className="h-3 w-px bg-gray-200" />
            <Text className="text-xs text-gray-500">{formatDate(order.createdAt)}</Text>
          </View>

          {(isActiveOrder && !!order.estimatedTime) || scheduledLabel ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
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
        <View className="mb-3 mt-3 bg-white p-8">
          {state?.isCancelled ? (
            <TerminationNotice order={order} />
          ) : (
            <>
              <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                Order Progress
              </Text>

              <OrderTimeline order={order} />

              {order.dispatchInfo?.riderName && (
                <View className="mt-5 flex-row items-center gap-3 border-t border-gray-100 pt-4">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    <Ionicons name="bicycle-outline" size={16} color={BRAND} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {order.dispatchInfo.riderName}
                    </Text>
                    {!!order.dispatchInfo.riderPhone && (
                      <Text className="mt-0.5 text-xs text-gray-500">
                        {order.dispatchInfo.riderPhone}
                      </Text>
                    )}
                  </View>
                  {!!order.dispatchInfo.riderPhone && (
                    <TouchableOpacity
                      className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                      activeOpacity={0.7}
                      onPress={() => {
                        // Could open dialer in future
                      }}>
                      <Ionicons name="call-outline" size={16} color={BRAND} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* Items */}
        <Section title={`Items · ${totalItems}`}>
          <View>
            {order.items.map((item, idx) => (
              <View
                key={`${item.productId}-${idx}`}
                className={idx > 0 ? 'mt-3 border-t border-gray-100 pt-3' : ''}>
                <View className="flex-row gap-3">
                  <DynamicImage
                    src={item.image ?? undefined}
                    alt={item.name}
                    variant="order"
                    containerClassName="w-14 h-14 rounded-lg overflow-hidden"
                  />

                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text
                        className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-gray-900"
                        numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text className="shrink-0 text-[13px] font-bold text-gray-900">
                        {formatMoney(item.price * item.quantity)}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-xs text-gray-400">
                      {item.quantity} x {formatMoney(item.price)}
                    </Text>
                    <ModifierList modifiers={item.modifierSelections} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* Customer & Payment combined */}
        <Section title="Customer Details">
          <View className="flex-row items-center gap-3 border-b border-gray-100 pb-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
              <Text className="text-sm font-bold text-brand-500">
                {customerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {customerName}
              </Text>
              <Text className="mt-0.5 text-xs text-gray-400">Customer</Text>
            </View>
          </View>

          <View className="mt-1">
            <CustomerField
              icon="mail-outline"
              label="Email"
              value={order.paymentInfo.customerEmail}
            />
            <View className="h-px bg-gray-100" />
            <CustomerField
              icon="call-outline"
              label="Phone"
              value={order.paymentInfo.customerPhone}
            />
          </View>
        </Section>

        {address && (
          <Section title="Delivery Address">
            <View className="flex-row gap-3">
              <Ionicons
                name="location-outline"
                size={18}
                color="#9ca3af"
                style={{ marginTop: 2 }}
              />
              <View className="min-w-0 flex-1">
                <Text className="text-sm leading-5 text-gray-900">
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
                  <Text className="mt-1 text-xs text-gray-400">Landmark: {address.landmark}</Text>
                )}
              </View>
            </View>
          </Section>
        )}

        {/* Payment */}
        <Section title="Payment">
          <View>
            <DetailRow label="Method" value={paymentMethodLabel} />
            <View className="h-px bg-gray-100" />
            <DetailRow
              label="Status"
              value={getPaymentStatusMeta(order.paymentInfo.paymentStatus)}
            />
            <View className="h-px bg-gray-100" />
            <DetailRow label="Paid at" value={formatDate(order.paymentInfo.paidAt)} />
          </View>
        </Section>

        {/* Summary */}
        <Section title="Order Summary">
          <View>
            <DetailRow label="Vatable sales" value={formatMoney(order.total.vatableSales)} />
            <View className="h-px bg-gray-100" />
            <DetailRow label="VAT" value={formatMoney(Number(order.total.vatAmount))} />
            {!!order.total.deliveryFeeAmount && order.total.deliveryFeeAmount > 0 && (
              <>
                <View className="h-px bg-gray-100" />
                <DetailRow
                  label="Delivery fee"
                  value={formatMoney(order.total.deliveryFeeAmount)}
                />
              </>
            )}
            {!!order.total.discountAmount && order.total.discountAmount > 0 && (
              <>
                <View className="h-px bg-gray-100" />
                <DetailRow
                  label="Discount"
                  value={`- ${formatMoney(order.total.discountAmount)}`}
                  valueClassName="text-emerald-600"
                />
              </>
            )}
            <View className="mt-2 h-px bg-gray-200" />
            <View className="flex-row items-center justify-between pt-3">
              <Text className="text-base font-bold text-gray-900">Total</Text>
              <Text className="text-xl font-bold text-[#e13e00]">
                {formatMoney(order.total.totalAmount)}
              </Text>
            </View>
          </View>
        </Section>

        {!!order.notes && (
          <Section title="Notes">
            <Text className="text-sm leading-5 text-gray-700">{order.notes}</Text>
          </Section>
        )}
      </ScrollView>

      {state?.canCancel && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <TouchableOpacity
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50"
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
