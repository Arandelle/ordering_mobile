import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileUser } from '../types';
import { getDisplayName } from '../utils';

interface ProfileHeaderProps {
  user: ProfileUser;
  profileImage: string;
  isEditing: boolean;
  onPickPhoto: () => void;
}

export function ProfileHeader({
  user,
  profileImage,
  isEditing,
  onPickPhoto,
}: ProfileHeaderProps) {
  return (
    <View className="items-center pb-3">
      <TouchableOpacity
        className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-50"
        activeOpacity={0.85}
        onPress={isEditing ? onPickPhoto : undefined}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={{ width: 80, height: 80 }}
            className="rounded-full"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-bold text-brand-500">
              {getDisplayName(user).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {isEditing && (
          <View className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500">
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      <Text className="mt-2.5 text-lg font-bold text-gray-900">{getDisplayName(user)}</Text>
      <Text className="mt-0.5 text-xs text-gray-400">{user.email}</Text>
      {isEditing && (
        <TouchableOpacity
          className="mt-2 flex-row items-center gap-1 rounded-full bg-brand-50 px-3 py-1"
          activeOpacity={0.8}
          onPress={onPickPhoto}>
          <Ionicons name="image-outline" size={12} color="#ef4501" />
          <Text className="text-[11px] font-medium text-brand-500">Change photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
