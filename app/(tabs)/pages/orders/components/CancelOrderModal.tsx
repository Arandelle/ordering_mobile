import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CancelOrderModal({
  visible,
  referenceNumber,
  isCancelling,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  referenceNumber?: string;
  isCancelling: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        className="flex-1 items-center justify-center bg-black/50 px-6"
        style={{
          paddingBottom: insets.bottom,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        }}>
        <View className="w-full rounded-3xl bg-white p-6">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Ionicons name="close-circle-outline" size={24} color="#dc2626" />
          </View>

          <Text className="mt-4 text-lg font-extrabold tracking-tight text-gray-950">
            Cancel order?
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-gray-500">
            {referenceNumber
              ? `Order ${referenceNumber} will be cancelled. This action can't be undone.`
              : "This order will be cancelled. This action can't be undone."}
          </Text>

          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white"
              activeOpacity={0.85}
              disabled={isCancelling}
              onPress={onCancel}>
              <Text className="text-[15px] font-bold text-gray-800">Keep Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`min-h-12 flex-1 items-center justify-center rounded-2xl bg-red-600 ${
                isCancelling ? 'opacity-[0.65]' : ''
              }`}
              activeOpacity={0.85}
              disabled={isCancelling}
              onPress={onConfirm}>
              {isCancelling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[15px] font-bold text-white">Cancel Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
