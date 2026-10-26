import { useState } from 'react';
import { Text, View } from 'react-native';
import { Mail } from 'lucide-react-native';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { AuthScreenWrapper, Button, Input } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetRequest = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const { error: authError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: '/auth/reset-password',
    });

    setIsSubmitting(false);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to send reset link'));
      return;
    }

    setSuccess('If that email exists, a password reset link has been sent.');
  };

  return (
    <AuthScreenWrapper>
      {/* Header Section */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900">Forgot password?</Text>
        <Text className="mt-2 text-base text-gray-500">
          Enter your email and we'll send you a reset link
        </Text>
      </View>

      {/* Form Card */}
      <View className="border border-gray-200 bg-white p-5">
        <Input
          label="Email"
          placeholder="juan@email.com"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError('');
            setSuccess('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={{ icon: Mail }}
        />

        {!!error && (
          <View className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-sm font-medium text-red-600">{error}</Text>
          </View>
        )}

        {!!success && (
          <View className="mt-4 border border-green-200 bg-green-50 px-4 py-3">
            <Text className="text-sm font-medium text-green-700">{success}</Text>
          </View>
        )}

        <Button
          className="mt-5 rounded-lg"
          text="Send Reset Link"
          onPress={handleResetRequest}
          loading={{ isLoading: isSubmitting, text: 'Sending...' }}
        />
      </View>
    </AuthScreenWrapper>
  );
}
