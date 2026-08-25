import { Text, View } from 'react-native';

export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-baseline justify-between border-b border-gray-100 py-2.5">
      <Text className="text-xs font-medium text-gray-400">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-gray-950" numberOfLines={1}>
        {value?.trim() || 'Not set'}
      </Text>
    </View>
  );
}
