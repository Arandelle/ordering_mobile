import { Phone, Save } from 'lucide-react-native';
import { Dispatch, SetStateAction } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FieldLabel } from './components/FieldLabel';
import { InfoRow } from './components/InfoRow';
import { SectionHeader } from './components/SectionHeader';
import { EditingSection, LoadingAction, ProfileForm, ProfileUser } from './types';

interface ProfileDetailsProps {
  user: ProfileUser;
  profileForm: ProfileForm;
  isEditing: boolean;
  isBusy: boolean;
  loadingAction: LoadingAction;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
  startEditing: (section: EditingSection) => void;
  cancelEditing: () => void;
  onSave: () => void;
}

export function ProfileDetails({
  user,
  profileForm,
  isEditing,
  isBusy,
  loadingAction,
  setProfileForm,
  startEditing,
  cancelEditing,
  onSave,
}: ProfileDetailsProps) {
  return (
    <View className="mt-6">
      <SectionHeader
        title="Profile"
        isEditing={isEditing}
        onEdit={() => startEditing('profile')}
        onCancel={cancelEditing}
      />

      {isEditing ? (
        <View className="gap-4">
          <View>
            <FieldLabel label="First Name" optional />
            <TextInput
              className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
              placeholder="Juan"
              placeholderTextColor="#b9b9b9"
              value={profileForm.firstName}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, firstName: value }))}
              autoCapitalize="words"
            />
          </View>

          <View>
            <FieldLabel label="Last Name" optional />
            <TextInput
              className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
              placeholder="Dela Cruz"
              placeholderTextColor="#b9b9b9"
              value={profileForm.lastName}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, lastName: value }))}
              autoCapitalize="words"
            />
          </View>

          <View>
            <FieldLabel label="Phone" optional />
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
              <Phone size={17} color="#9ca3af" />
              <TextInput
                className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                placeholder="+63 912 345 6789"
                placeholderTextColor="#b9b9b9"
                value={profileForm.phone}
                onChangeText={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-[15px] ${
              loadingAction === 'profile' ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={onSave}
            disabled={isBusy}>
            <Save size={17} color="#fff" />
            <Text className="text-[15px] font-bold text-white">
              {loadingAction === 'profile' ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <InfoRow label="First Name" value={user.firstName} />
          <InfoRow label="Last Name" value={user.lastName} />
          <InfoRow label="Phone" value={user.phone ?? user.phoneNumber} />
          <InfoRow label="Email" value={user.email} />
        </View>
      )}
    </View>
  );
}
