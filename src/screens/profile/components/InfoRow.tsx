import { Text, View } from 'react-native';

export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const display = value?.trim();
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-2.5 last:border-0">
      <Text className="text-xs font-medium text-gray-400">{label}</Text>
      <Text className={`flex-1 pl-3 text-right text-sm font-semibold ${display ? 'text-gray-900' : 'text-gray-300'}`} numberOfLines={1}>
        {display || 'Not set'}
      </Text>
    </View>
  );
}
