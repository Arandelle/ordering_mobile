import { Ionicons } from '@expo/vector-icons';

import { Text, TouchableOpacity, View } from 'react-native';

export function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View className="flex-row items-center overflow-hidden rounded-xl border border-gray-200">
      <TouchableOpacity
        onPress={onDecrement}
        className="h-12 w-10 items-center justify-center"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="remove" size={16} color="#111827" />
      </TouchableOpacity>

      <View className="h-12 w-px bg-gray-200" />

      <View className="h-12 w-10 items-center justify-center">
        <Text className="text-sm font-medium text-gray-900">{value}</Text>
      </View>

      <View className="h-12 w-px bg-gray-200" />

      <TouchableOpacity
        onPress={onIncrement}
        className="h-12 w-10 items-center justify-center"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="add" size={16} color="#e13e00" />
      </TouchableOpacity>
    </View>
  );
}
