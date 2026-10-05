import { Phone } from 'lucide-react-native';
import { Dispatch, SetStateAction } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditingSection, LoadingAction, ProfileForm, ProfileUser } from './types';
import { getDisplayName } from './utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ProfileDetailsProps {
  user: ProfileUser;
  profileImage: string;
  profileForm: ProfileForm;
  isEditing: boolean;
  isBusy: boolean;
  loadingAction: LoadingAction;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
  startEditing: (section: EditingSection) => void;
  cancelEditing: () => void;
  onSave: () => void;
  onPickPhoto: () => void;
}

export function ProfileDetails({
  user,
  profileImage,
  profileForm,
  isEditing,
  isBusy,
  loadingAction,
  setProfileForm,
  startEditing,
  cancelEditing,
  onSave,
  onPickPhoto,
}: ProfileDetailsProps) {
  if (isEditing) {
    return (
      <View className="gap-4">
        {/* Avatar row while editing */}
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-50"
            activeOpacity={0.85}
            onPress={onPickPhoto}>
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
            <View className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500">
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5"
            activeOpacity={0.8}
            onPress={onPickPhoto}>
            <Ionicons name="image-outline" size={12} color="#ef4501" />
            <Text className="text-[11px] font-medium text-brand-500">Change photo</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="First Name"
          placeholder="Juan"
          value={profileForm.firstName}
          onChangeText={(value) => setProfileForm((prev) => ({ ...prev, firstName: value }))}
          autoCapitalize="words"
        />

        <Input
          label="Last Name"
          placeholder="Dela Cruz"
          value={profileForm.lastName}
          onChangeText={(value) => setProfileForm((prev) => ({ ...prev, lastName: value }))}
          autoCapitalize="words"
        />

        <Input
          label="Phone"
          placeholder="+63 912 345 6789"
          value={profileForm.phone}
          onChangeText={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))}
          keyboardType="phone-pad"
          leftIcon={{ icon: Phone }}
        />

        <View className="flex-row gap-3">
          <Button
            text="Cancel"
            variant="outline"
            onPress={cancelEditing}
            activeOpacity={0.85}
            className="flex-1"
          />

          <Button
            className="flex-1"
            text="Save"
            onPress={onSave}
            loading={{ isLoading: loadingAction === 'profile', text: 'Saving...' }}
            disabled={isBusy}
            icon={{ name: 'save', size: 16 }}
          />
        </View>
      </View>
    );
  }

  const phone = user.phone ?? user.phoneNumber;

  return (
    <View className="flex-row items-center gap-3">
      {/* Avatar */}
      <View className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-50">
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
      </View>

      {/* Details */}
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
          {getDisplayName(user)}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
          {user.email}
        </Text>
        {phone ? (
          <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
            {phone}
          </Text>
        ) : null}
      </View>

      {/* Edit button */}
      <TouchableOpacity
        className="items-center justify-center rounded-lg bg-gray-100 p-2"
        activeOpacity={0.8}
        onPress={() => startEditing('profile')}>
        <Ionicons name="create-outline" size={18} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}
