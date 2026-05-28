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
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="text-lg font-extrabold text-gray-950">{title}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={isEditing ? onCancel : onEdit}>
        <Text className="text-sm font-bold text-[#e13e00]">{isEditing ? 'Cancel' : 'Edit'}</Text>
      </TouchableOpacity>
    </View>
  );
}
