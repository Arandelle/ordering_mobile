import { Dispatch, SetStateAction } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';
import { DangerZone } from './components/DangerZone';
import { InfoRow } from './components/InfoRow';
import { SectionHeader } from './components/SectionHeader';
import { EditingSection, LoadingAction, PasswordForm } from './types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
  onDeleteAccount: (reason: string) => void;
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
  onDeleteAccount,
}: SecurityDetailsProps) {
  return (
    <View>
      <SectionHeader
        title="Security"
        isEditing={isEditing}
        onEdit={() => startEditing('password')}
        onCancel={cancelEditing}
      />

      {isOAuthOnly && !isEditing ? (
        <Text className="border-b border-gray-100 py-2.5 text-sm leading-5 text-gray-500">
          You sign in with Google, so a password change is usually not needed.
        </Text>
      ) : isEditing ? (
        <View className="mt-4 gap-4">
          {isOAuthOnly && (
            <View className="rounded-2xl bg-orange-50 px-4 py-3">
              <Text className="text-sm leading-5 text-gray-600">
                This account is currently Google-only. Password changes may require adding
                credential access first.
              </Text>
            </View>
          )}

          <Input
            label="Current Password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChangeText={(value) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
            }
            secureTextEntry
            leftIcon={{ icon: LockKeyhole }}
          />

          <Input
            label="New Password"
            placeholder="At least 8 characters"
            value={passwordForm.newPassword}
            onChangeText={(value) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: value }))
            }
            secureTextEntry
            leftIcon={{ icon: LockKeyhole }}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat new password"
            value={passwordForm.confirmPassword}
            onChangeText={(value) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
            }
            secureTextEntry
            leftIcon={{ icon: LockKeyhole }}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 items-center rounded-2xl border border-gray-200 py-[15px]"
              activeOpacity={0.85}
              onPress={cancelEditing}>
              <Text className="text-[15px] font-bold text-gray-600">Cancel</Text>
            </TouchableOpacity>

            <Button
              className="flex-1"
              text={loadingAction === 'password' ? 'Saving...' : 'Save'}
              onPress={onSave}
              isLoading={loadingAction === 'password'}
              loadingText="Saving..."
              disabled={isBusy}
            />
          </View>
        </View>
      ) : (
        <View className="mt-2">
          <InfoRow label="Password" value="Protected" />
        </View>
      )}

      <DangerZone
        isBusy={isBusy}
        loadingAction={loadingAction}
        onDeleteAccount={onDeleteAccount}
      />
    </View>
  );
}
