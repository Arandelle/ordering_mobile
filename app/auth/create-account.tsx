import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Chrome, LockKeyhole, Mail } from 'lucide-react-native';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { isAllowedCustomerDomain } from '@/lib/isAllowedEmails';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function CreateAccount() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState<'email' | 'google' | null>(null);

  const handleCreateAccount = async () => {
    setError('');

    if (!isAllowedCustomerDomain(email.trim())) {
      setError('This email domain is not allowed. Please use an approved email provider.');
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

    setLoadingAction('email');

    const { error: authError } = await authClient.signUp.email({
      email: email.trim(),
      password,
      name: email.trim().split('@')[0] || 'Customer',
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to create account'));
      return;
    }

    router.replace('/profile');
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoadingAction('google');

    const { error: authError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '',
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Google sign-up failed'));
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
          <Text className="text-2xl font-extrabold text-gray-950">Create an account</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-500">
            Use your email or continue with Google.
          </Text>

          <View className="mt-6 gap-4">
            <Input
              label="Email"
              placeholder="juan@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={{ icon: Mail }}
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={{ icon: LockKeyhole }}
            />

            <Input
              label="Confirm Password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={{ icon: LockKeyhole }}
            />
          </View>

          {!!error && (
            <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="text-sm font-semibold text-red-600">{error}</Text>
            </View>
          )}

          <Button
            className="mt-5"
            text={loadingAction === 'email' ? 'Creating...' : 'Create Account'}
            onPress={handleCreateAccount}
            isLoading={loadingAction === 'email'}
            loadingText="Creating..."
            disabled={loadingAction !== null}
          />

          <View className="my-5 h-px bg-gray-100" />

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 py-[15px] ${
              loadingAction === 'google' ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={handleGoogleSignup}
            disabled={loadingAction !== null}>
            <Chrome size={18} color="#111827" />
            <Text className="text-[15px] font-bold text-gray-950">
              {loadingAction === 'google' ? 'Opening Google...' : 'Sign up with Google'}
            </Text>
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-sm text-gray-500">Already have an account?</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()}>
              <Text className="text-sm font-bold text-[#e13e00]">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
