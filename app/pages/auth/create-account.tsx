import * as WebBrowser from 'expo-web-browser';
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
import { LockKeyhole, Mail, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { isAllowedCustomerDomain } from '@/lib/isAllowedEmails';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constant';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

export default function CreateAccount() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'email' | 'google' | null>(null);

  const handleCreateAccount = async () => {
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Use and Privacy Policy to continue.');
      return;
    }

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

    router.replace('pages/profile');
  };

  const handleGoogleSignup = async () => {
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Use and Privacy Policy to continue.');
      return;
    }

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

    router.replace('pages/profile');
  };

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
          <Text className="text-3xl font-bold text-gray-900">Create an account</Text>
          <Text className="mt-2 text-base text-gray-500">
            Sign up to start ordering and track your purchases
          </Text>
        </View>

        {/* Form Card */}
        <View className="mb-3 border border-gray-200 bg-white p-5">
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

          {/* Terms Checkbox */}
          <TouchableOpacity
            className="mt-4 flex-row items-start gap-3"
            activeOpacity={0.7}
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              setError('');
            }}>
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                agreedToTerms ? 'border-[#e13e00] bg-[#e13e00]' : 'border-gray-300 bg-white'
              }`}>
              {agreedToTerms && <Check size={14} color="#fff" />}
            </View>
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              I agree to the{' '}
              <Text
                className="font-semibold text-[#e13e00]"
                onPress={(e) => {
                  e.stopPropagation();
                  WebBrowser.openBrowserAsync(TERMS_OF_USE_URL);
                }}>
                Terms of Use
              </Text>{' '}
              and{' '}
              <Text
                className="font-semibold text-[#e13e00]"
                onPress={(e) => {
                  e.stopPropagation();
                  WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
                }}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          <Button
            className="mt-5 rounded-lg"
            text="Create Account"
            onPress={handleCreateAccount}
            loading={{ isLoading: loadingAction === 'email', text: 'Creating...' }}
            disabled={loadingAction !== null}
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="text-xs font-medium text-gray-400">or continue with</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        {/* Google Sign Up */}
        <TouchableOpacity
          className={`mt-3 flex-row items-center justify-center gap-2.5 border border-gray-200 bg-white py-3.5 ${
            loadingAction === 'google' ? 'opacity-60' : ''
          }`}
          activeOpacity={0.7}
          onPress={handleGoogleSignup}
          disabled={loadingAction !== null}>
          <GoogleIcon size={18} />
          <Text className="text-sm font-semibold text-gray-900">
            {loadingAction === 'google' ? 'Opening Google...' : 'Sign up with Google'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-sm text-gray-500">Already have an account?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-[#e13e00]">Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
