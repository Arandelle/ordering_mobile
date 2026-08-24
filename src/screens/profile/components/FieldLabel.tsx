import { Text, View } from 'react-native';

export function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <View className="mb-1.5 flex-row items-center justify-between">
      <Text className="text-[13px] font-semibold text-gray-700">{label}</Text>
      {optional && <Text className="text-[11px] text-gray-400">Optional</Text>}
    </View>
  );
}
