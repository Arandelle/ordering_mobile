import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { LockKeyhole, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constant';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { isAllowedCustomerDomain } from '@/lib/isAllowedEmails';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

export default function SignInForm() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isPending: sessionPending } = authClient.useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState<'email' | 'google' | null>(null);

  const handleEmailLogin = async () => {
    setError('');

    if (!isAllowedCustomerDomain(email.trim())) {
      setError('This email domain is not allowed. Please use an approved email provider.');
      return;
    }

    setLoadingAction('email');

    const { error: authError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to sign in'));
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['orders-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['order-summary'] });
    router.replace('/pages');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoadingAction('google');

    const { error: authError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/pages/profile',
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Google sign-in failed'));
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['orders-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['order-summary'] });
    router.replace('pages/profile');
  };

  if (sessionPending) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#e13e00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 80,
          paddingLeft: 24,
          paddingRight: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
          <Text className="mt-2 text-base text-gray-500">
            Sign in to track orders and check out faster
          </Text>
        </View>

        {/* Form Card */}
        <View className="border border-gray-200 bg-white p-5 mb-3">
          <View className="gap-4">
            <Input
              label="Email"
              placeholder="juan@email.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={{ icon: Mail }}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError('');
              }}
              secureTextEntry
              leftIcon={{ icon: LockKeyhole }}
              returnKeyType="done"
              onSubmitEditing={handleEmailLogin}
            />
          </View>

          {!!error && (
            <View className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm font-medium text-red-600">{error}</Text>
            </View>
          )}

          <Button
            className="mt-5 rounded-lg"
            text="Sign in"
            onPress={handleEmailLogin}
            loading={{ isLoading: loadingAction === 'email', text: 'Signing in...' }}
            disabled={loadingAction !== null}
          />

          <TouchableOpacity
            className="mt-4 self-center"
            activeOpacity={0.7}
            onPress={() => router.push('pages/auth/forgot-password')}>
            <Text className="text-sm font-semibold text-[#e13e00]">Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="font-medium text-gray-400">or</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          className={`flex-row items-center justify-center gap-2.5 mt-3 border border-gray-200 bg-white py-3.5 ${
            loadingAction === 'google' ? 'opacity-60' : ''
          }`}
          activeOpacity={0.7}
          onPress={handleGoogleLogin}
          disabled={loadingAction !== null}>
          <GoogleIcon size={18} />
          <Text className="text-sm font-semibold text-gray-900">
            {loadingAction === 'google' ? 'Opening Google...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-sm text-gray-500">No account yet?</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('pages/auth/create-account')}>
            <Text className="text-sm font-semibold text-[#e13e00]">Create one</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Text className="text-xs text-gray-400">By continuing, you agree to our</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => WebBrowser.openBrowserAsync(TERMS_OF_USE_URL)}>
            <Text className="text-xs font-medium text-[#e13e00]">Terms of Use</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400">and</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
            <Text className="text-xs font-medium text-[#e13e00]">Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
