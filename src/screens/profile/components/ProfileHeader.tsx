import { Camera } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ProfileUser } from '../types';
import { getDisplayName, getInitial } from '../utils';

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
    <View className="items-center">
      <TouchableOpacity
        className="h-24 w-24 overflow-hidden rounded-full bg-orange-50"
        activeOpacity={0.85}
        onPress={isEditing ? onPickPhoto : undefined}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="text-3xl font-extrabold text-[#e13e00]">{getInitial(user)}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text className="mt-3 text-xl font-extrabold text-gray-950">{getDisplayName(user)}</Text>
      <Text className="mt-1 text-sm text-gray-500">{user.email}</Text>
      {isEditing && (
        <TouchableOpacity
          className="mt-3 flex-row items-center gap-1.5"
          activeOpacity={0.8}
          onPress={onPickPhoto}>
          <Camera size={15} color="#e13e00" />
          <Text className="text-xs font-bold text-[#e13e00]">Upload photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
