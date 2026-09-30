import { Text, TouchableOpacity, View } from 'react-native';

export function SectionHeader({
  title,
  isEditing,
  onEdit,
  onCancel,
}: {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[15px] font-bold text-gray-900">{title}</Text>
      <TouchableOpacity
        className="rounded-lg px-2 py-1"
        activeOpacity={0.8}
        onPress={isEditing ? onCancel : onEdit}>
        <Text className="text-xs font-bold text-brand-500">{isEditing ? 'Cancel' : 'Edit'}</Text>
      </TouchableOpacity>
    </View>
  );
}
