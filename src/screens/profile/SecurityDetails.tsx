import { Dispatch, SetStateAction } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LockKeyhole } from 'lucide-react-native';
import { DangerZone } from './components/DangerZone';
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
              text="Save"
              onPress={onSave}
              loading={{ isLoading: loadingAction === 'password', text: 'Saving...' }}
              disabled={isBusy}
            />
          </View>
        </View>
      ) : (
        <View className="mt-3 flex-row items-center gap-3">
          <View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="lock-closed-outline" size={18} color="#6b7280" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">Password</Text>
            <Text className="text-xs text-gray-400">Protected</Text>
          </View>
          <TouchableOpacity
            className="items-center justify-center rounded-lg bg-gray-100 p-2"
            activeOpacity={0.8}
            onPress={() => startEditing('password')}>
            <Ionicons name="create-outline" size={18} color="#6b7280" />
          </TouchableOpacity>
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
