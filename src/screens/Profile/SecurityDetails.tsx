import { Dispatch, SetStateAction } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';
import { FieldLabel } from './components/FieldLabel';
import { InfoRow } from './components/InfoRow';
import { SectionHeader } from './components/SectionHeader';
import { EditingSection, LoadingAction, PasswordForm } from './types';

interface SecurityDetailsProps {
  passwordForm: PasswordForm;
  isEditing: boolean;
  isBusy: boolean;
  isOAuthOnly: boolean;
  loadingAction: LoadingAction;
  setPasswordForm: Dispatch<SetStateAction<PasswordForm>>;
  startEditing: (section: EditingSection) => void;
  cancelEditing: () => void;
  onSave: () => void;
}

export function SecurityDetails({
  passwordForm,
  isEditing,
  isBusy,
  isOAuthOnly,
  loadingAction,
  setPasswordForm,
  startEditing,
  cancelEditing,
  onSave,
}: SecurityDetailsProps) {
  return (
    <View className="mt-7">
      <SectionHeader
        title="Security"
        isEditing={isEditing}
        onEdit={() => startEditing('password')}
        onCancel={cancelEditing}
      />

      {isOAuthOnly && !isEditing ? (
        <Text className="border-b border-gray-100 py-3 text-sm leading-5 text-gray-600">
          You sign in with Google, so a password change is usually not needed.
        </Text>
      ) : isEditing ? (
        <View className="gap-4">
          {isOAuthOnly && (
            <Text className="rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-5 text-gray-600">
              This account is currently Google-only. Password changes may require adding credential
              access first.
            </Text>
          )}

          <View>
            <FieldLabel label="Current Password" />
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
              <LockKeyhole size={17} color="#9ca3af" />
              <TextInput
                className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                placeholder="Current password"
                placeholderTextColor="#b9b9b9"
                value={passwordForm.currentPassword}
                onChangeText={(value) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
                }
                secureTextEntry
              />
            </View>
          </View>

          <View>
            <FieldLabel label="New Password" />
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
              <LockKeyhole size={17} color="#9ca3af" />
              <TextInput
                className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                placeholder="At least 8 characters"
                placeholderTextColor="#b9b9b9"
                value={passwordForm.newPassword}
                onChangeText={(value) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                }
                secureTextEntry
              />
            </View>
          </View>

          <View>
            <FieldLabel label="Confirm Password" />
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
              <LockKeyhole size={17} color="#9ca3af" />
              <TextInput
                className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                placeholder="Repeat new password"
                placeholderTextColor="#b9b9b9"
                value={passwordForm.confirmPassword}
                onChangeText={(value) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                }
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-[15px] ${
              loadingAction === 'password' ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={onSave}
            disabled={isBusy}>
            <Text className="text-[15px] font-bold text-white">
              {loadingAction === 'password' ? 'Saving...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <InfoRow label="Password" value="Protected" />
      )}
    </View>
  );
}
