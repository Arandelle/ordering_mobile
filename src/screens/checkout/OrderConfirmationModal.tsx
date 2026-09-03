import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { useBranchContext } from '@/context/BranchContext';
import { FULFILLMENT_TYPE } from '@/types/orders.type';

function formatMoney(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrderConfirmationModal({
  visible,
  onClose,
  onConfirm,
  isPlacingOrder,
  displayTotalPrice,
  selectedPayment,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPlacingOrder: boolean;
  displayTotalPrice: number;
  selectedPayment: 'cod' | 'maya' | 'wallet';
}) {
  const insets = useSafeAreaInsets();
  const { cartItems, totalPrice, vatableSales, vatAmount } = useCart();
  const { selectedBranch } = useBranchContext();

  const isDineIn = selectedBranch
    ? false
    : false; // determined by parent

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View
          className="w-full rounded-3xl bg-white px-5 py-6"
          style={{ marginBottom: insets.bottom, maxHeight: '85%' }}>
          {/* Header */}
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Ionicons name="receipt-outline" size={20} color="#e13e00" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">Confirm Order</Text>
              <Text className="text-xs text-gray-400">Review before placing</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Items summary */}
          <View className="mb-4 rounded-xl bg-gray-50 p-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-900">Items ({cartItems.length})</Text>
              <Text className="text-sm font-bold text-gray-900">{formatMoney(totalPrice)}</Text>
            </View>
            {cartItems.slice(0, 3).map((item) => (
              <View key={String(item._id)} className="flex-row justify-between py-1">
                <Text className="flex-1 text-xs text-gray-600" numberOfLines={1}>
                  {item.quantity}× {item.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatMoney(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            {cartItems.length > 3 && (
              <Text className="mt-1 text-xs text-gray-400">+{cartItems.length - 3} more items</Text>
            )}
          </View>

          {/* Payment method */}
          <View className="mb-4 flex-row items-center justify-between rounded-xl bg-gray-50 p-3">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={
                  selectedPayment === 'cod'
                    ? 'cash-outline'
                    : selectedPayment === 'wallet'
                      ? 'wallet-outline'
                      : 'card-outline'
                }
                size={16}
                color="#6b7280"
              />
              <Text className="text-sm text-gray-700">
                {selectedPayment === 'cod'
                  ? 'Cash on Delivery'
                  : selectedPayment === 'wallet'
                    ? 'Wallet Balance'
                    : 'Maya'}
              </Text>
            </View>
            <Text className="text-sm font-bold text-orange-600">{formatMoney(displayTotalPrice || totalPrice)}</Text>
          </View>

          {/* Breakdown */}
          <View className="mb-4 gap-1.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Vatable Sales</Text>
              <Text className="text-xs text-gray-700">{formatMoney(vatableSales)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">VAT (12%)</Text>
              <Text className="text-xs text-gray-700">{formatMoney(vatAmount)}</Text>
            </View>
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-4 ${
              isPlacingOrder ? 'opacity-65' : ''
            }`}
            activeOpacity={0.85}
            disabled={isPlacingOrder}
            onPress={onConfirm}>
            {isPlacingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text className="text-sm font-bold text-white">Place Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
