import { useMemo, useState, type ReactNode } from 'react';
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
import { ORDER_STATUSES, getActionConfig, getPriority } from '@/types/order-constant';
import { OrderType } from '@/types/orders.type';
import { useOrders } from '@/hooks/useOrders';
import { useOrderState } from './hooks/useOrderState';

const BRAND = '#e13e00';

function formatMoney(value: number | undefined) {
  return `PHP ${(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
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

function ActionButton({
  label,
  icon,
  variant,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  variant: 'primary' | 'danger' | 'outline';
  onPress: () => void;
}) {
  const className =
    variant === 'primary'
      ? 'border-[#e13e00] bg-[#e13e00]'
      : variant === 'danger'
        ? 'border-red-600 bg-red-600'
        : 'border-gray-200 bg-white';

  const textClassName = variant === 'outline' ? 'text-gray-800' : 'text-white';

  return (
    <TouchableOpacity
      className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-3 ${className}`}
      activeOpacity={0.85}
      onPress={onPress}>
      {icon}
      <Text className={`text-center text-[13px] font-bold ${textClassName}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function OrderCard({ order }: { order: OrderType }) {
  const state = useOrderState(order);
  const statusClasses = getStatusClasses(order.status);
  const referenceNumber = order.paymentInfo?.referenceNumber ?? order._id;
  const cancelConfig = getActionConfig(order.status, ORDER_STATUSES.CANCELLED);
  const itemPreview = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
  const hiddenItemCount = Math.max(order.items.length - 2, 0);

  const showActionMessage = (action: string) => {
    Alert.alert(action, 'This action will be connected after the order mutation or route is ready.');
  };

  return (
    <View className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-gray-400">Reference</Text>
          <Text className="mt-1 text-base font-extrabold text-gray-950">{referenceNumber}</Text>
          <Text className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt)}</Text>
        </View>

        <View className={`rounded-full px-3 py-1 ${statusClasses.container}`}>
          <Text className={`text-xs font-extrabold capitalize ${statusClasses.text}`}>{order.status}</Text>
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
          Payment: {order.paymentInfo.paymentStatus}
        </Text>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {state?.canCancel && (
          <ActionButton
            label={cancelConfig?.label ?? 'Cancel'}
            variant="danger"
            icon={<XCircle size={16} color="white" />}
            onPress={() => showActionMessage('Cancel order')}
          />
        )}

        {state?.needPayment && (
          <ActionButton
            label="Pay Now"
            variant="primary"
            icon={<CreditCard size={16} color="white" />}
            onPress={() => showActionMessage('Pay now')}
          />
        )}

        {state?.needsReview && (
          <ActionButton
            label="Review"
            variant="outline"
            icon={<MessageSquare size={16} color="#374151" />}
            onPress={() => showActionMessage('Review order')}
          />
        )}

        <ActionButton
          label="View Details"
          variant="outline"
          icon={<Eye size={16} color="#374151" />}
          onPress={() => showActionMessage('View details')}
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
  const isAuthenticated = Boolean(session?.user);

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
    return [...(activeQuery.data?.data ?? [])].sort(
      (first, second) =>
        getPriority(first.status) - getPriority(second.status) ||
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );
  }, [activeQuery.data?.data]);

  const handleSearch = () => {
    setSubmittedReference(referenceNumber.trim());
  };

  if (isSessionPending) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  console.log(orders)

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={orders}
        keyExtractor={(order) => order._id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
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
      />
    </KeyboardAvoidingView>
  );
}
