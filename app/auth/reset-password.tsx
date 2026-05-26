import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    setError('');

    if (!token) {
      setError('Reset token is missing or expired.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    const { error: authError } = await authClient.resetPassword({
      token,
      newPassword: password,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to reset password'));
      return;
    }

    router.replace('/profile');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="px-5 py-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <Text className="text-2xl font-extrabold text-gray-950">Reset password</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-500">
            Enter a new password for your account.
          </Text>

          <View className="mt-6 gap-4">
            <View>
              <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">New Password</Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                <LockKeyhole size={17} color="#9ca3af" />
                <TextInput
                  className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                  placeholder="At least 8 characters"
                  placeholderTextColor="#b9b9b9"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View>
              <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Confirm Password</Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                <LockKeyhole size={17} color="#9ca3af" />
                <TextInput
                  className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                  placeholder="Repeat password"
                  placeholderTextColor="#b9b9b9"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {!!error && (
            <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="text-sm font-semibold text-red-600">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`mt-5 items-center rounded-2xl bg-[#e13e00] py-[15px] ${
              isSubmitting ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={handleResetPassword}
            disabled={isSubmitting}>
            <Text className="text-[15px] font-bold text-white">
              {isSubmitting ? 'Saving...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
