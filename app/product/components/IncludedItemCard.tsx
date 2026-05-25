import { IncludedItem } from '@/types/products';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function IncludedItemCard({ item }: { item: IncludedItem }) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-gray-50 p-3">
      <View className="h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <Ionicons name="checkmark" size={16} color="#e13e00" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium text-gray-900" numberOfLines={1}>
          {item.product.name}
        </Text>
      </View>
      {item.quantity != null && item.quantity > 0 && (
        <View className="rounded-2xl bg-orange-50 px-2 py-1">
          <Text className="text-xs font-medium text-orange-600">x{item.quantity}</Text>
        </View>
      )}
    </View>
  );
}
