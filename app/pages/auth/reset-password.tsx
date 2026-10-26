import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { AuthScreenWrapper, Button, Input } from '@/components/ui';

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
    <AuthScreenWrapper>
      {/* Header Section */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900">Reset password</Text>
        <Text className="mt-2 text-base text-gray-500">
          Enter a new password for your account
        </Text>
      </View>

      {/* Form Card */}
      <View className="border border-gray-200 bg-white p-5">
        <View className="gap-4">
          <Input
            label="New Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError('');
            }}
            secureTextEntry
            leftIcon={{ icon: LockKeyhole }}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setError('');
            }}
            secureTextEntry
            leftIcon={{ icon: LockKeyhole }}
          />
        </View>

        {!!error && (
          <View className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-sm font-medium text-red-600">{error}</Text>
          </View>
        )}

        <Button
          className="mt-5 rounded-lg"
          text="Reset Password"
          onPress={handleResetPassword}
          loading={{ isLoading: isSubmitting, text: 'Saving...' }}
        />
      </View>
    </AuthScreenWrapper>
  );
}
