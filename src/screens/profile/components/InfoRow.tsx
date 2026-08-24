import { Text, View } from 'react-native';

export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="border-b border-gray-100 py-3">
      <Text className="text-xs font-semibold uppercase text-gray-400">{label}</Text>
      <Text className="mt-1 text-sm font-semibold text-gray-950">{value?.trim() || 'Not set'}</Text>
    </View>
  );
}
