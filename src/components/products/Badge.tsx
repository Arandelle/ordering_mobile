// ─── Badge ────────────────────────────────────────────────────────────────────

import { Text, View } from "react-native";

const variantMap = {
  default: {
    container: 'bg-gray-200 rounded-2xl px-3 py-1',
    text: 'text-xs font-medium text-gray-600',
  },
  category: {
    container: 'bg-gray-200 rounded-2xl px-3 py-1',
    text: 'text-xs font-medium text-gray-600',
  },
  subcategory: {
    container: 'bg-amber-200 rounded-2xl px-3 py-1',
    text: 'text-xs font-medium text-amber-600',
  },
  popular: {
    container: 'bg-orange-200 rounded-2xl px-3 py-1 border border-orange-500',
    text: 'text-xs font-medium text-orange-600',
  },
  signature: {
    container: 'bg-orange-200 rounded-2xl px-3 py-1 border border-orange-500',
    text: 'text-xs font-medium text-orange-600',
  },
};

export function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: keyof typeof variantMap;
}) {
  const { container, text } = variantMap[variant];
  return (
    <View className={container}>
      <Text className={text}>{label}</Text>
    </View>
  );
}