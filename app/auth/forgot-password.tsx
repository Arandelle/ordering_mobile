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
import { Mail } from 'lucide-react-native';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';

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
      redirectTo: "/auth/reset-password",
    });

    setIsSubmitting(false);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to send reset link'));
      return;
    }

    setSuccess('If that email exists, a password reset link has been sent.');
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
          <Text className="text-2xl font-extrabold text-gray-950">Forgot password?</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-500">
            Enter your email and we will send a reset link.
          </Text>

          <View className="mt-6">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Email</Text>
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
              <Mail size={17} color="#9ca3af" />
              <TextInput
                className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                placeholder="juan@email.com"
                placeholderTextColor="#b9b9b9"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {!!error && (
            <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="text-sm font-semibold text-red-600">{error}</Text>
            </View>
          )}

          {!!success && (
            <View className="mt-4 rounded-2xl bg-green-50 px-4 py-3">
              <Text className="text-sm font-semibold text-green-700">{success}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`mt-5 items-center rounded-2xl bg-[#e13e00] py-[15px] ${
              isSubmitting ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={handleResetRequest}
            disabled={isSubmitting}>
            <Text className="text-[15px] font-bold text-white">
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
