import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View className="w-full rounded-2xl bg-white p-5">
          <Text className="text-lg font-extrabold text-gray-950">Cancel order?</Text>
          <Text className="mt-2 text-sm leading-5 text-gray-500">
            {referenceNumber
              ? `This will cancel order ${referenceNumber}.`
              : 'This will cancel your order.'}
          </Text>

          <View className="mt-5 flex-row gap-3">
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
