import { useState, type ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ClipboardList, XCircle } from 'lucide-react-native';
import { useCancelOrder, useOrder } from '@/hooks/useOrders';
import { useOrderState } from './hooks/useOrderState';
import { CancelOrderModal } from './components/CancelOrderModal';
import { formatDate } from '@/helper/formateDate';
import { getErrorMessage } from './helper/getErrorMessage';
import { getStatusClasses } from './helper/getStatusClasses';
import { formatMoney } from './helper/formatMoney';
import { ModifierSelection } from '@/types/menu-types';

const BRAND = '#e13e00';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="flex-1 text-sm text-gray-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-bold text-gray-900">{value}</Text>
    </View>
  );
}

function ModifierList({ modifiers }: { modifiers?: ModifierSelection[] }) {
  if (!modifiers || modifiers.length === 0) return null;

  return (
    <View className="mt-1">
      {modifiers.map((group, idx) => (
        <View key={idx} className={idx > 0 ? 'mt-1 border-t border-gray-100 pt-1' : ''}>
          <Text className="text-[11px] font-semibold text-gray-400">{group.groupName}</Text>
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
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-3 text-[15px] font-bold text-gray-950">{title}</Text>
      {children}
    </View>
  );
}

export default function OrderDetails() {
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
                  <ModifierList modifiers={item.modifierSelections} />
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
        {address && (
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
        )}

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
