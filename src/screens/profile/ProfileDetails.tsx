import { Phone, Save } from 'lucide-react-native';
import { Dispatch, SetStateAction } from 'react';
import { View } from 'react-native';
import { InfoRow } from './components/InfoRow';
import { SectionHeader } from './components/SectionHeader';
import { EditingSection, LoadingAction, ProfileForm, ProfileUser } from './types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    <View>
      <SectionHeader
        title="Profile"
        isEditing={isEditing}
        onEdit={() => startEditing('profile')}
        onCancel={cancelEditing}
      />

      {isEditing ? (
        <View className="mt-4 gap-4">
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
              text={'Save'}
              onPress={onSave}
              isLoading={loadingAction === 'profile'}
              loadingText="Saving..."
              disabled={isBusy}
              iconLeft={{ icon: Save, size: 16 }}
            />
          </View>
        </View>
      ) : (
        <View className="mt-2">
          <InfoRow label="First Name" value={user.firstName} />
          <InfoRow label="Last Name" value={user.lastName} />
          <InfoRow label="Phone" value={user.phone ?? user.phoneNumber} />
          <InfoRow label="Email" value={user.email} />
        </View>
      )}
    </View>
  );
}
