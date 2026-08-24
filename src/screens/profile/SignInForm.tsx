import { router } from 'expo-router';
import { Chrome, LockKeyhole, Mail } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LoadingAction } from './types';

interface SignInFormProps {
  email: string;
  password: string;
  error: string;
  loadingAction: LoadingAction;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onEmailLogin: () => void;
  onGoogleLogin: () => void;
}

export function SignInForm({
  email,
  password,
  error,
  loadingAction,
  setEmail,
  setPassword,
  onEmailLogin,
  onGoogleLogin,
}: SignInFormProps) {
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
          <Text className="text-2xl font-extrabold text-gray-950">Welcome back</Text>
          <Text className="mt-1 text-sm leading-5 text-gray-500">
            Sign in to track orders, save details, and check out faster.
          </Text>

          <View className="mt-6 gap-4">
            <View>
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

            <View>
              <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Password</Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                <LockKeyhole size={17} color="#9ca3af" />
                <TextInput
                  className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                  placeholder="Password"
                  placeholderTextColor="#b9b9b9"
                  value={password}
                  onChangeText={setPassword}
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
              loadingAction === 'email' ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={onEmailLogin}
            disabled={loadingAction !== null}>
            <Text className="text-[15px] font-bold text-white">
              {loadingAction === 'email' ? 'Signing in...' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 self-center"
            activeOpacity={0.8}
            onPress={() => router.push('/auth/forgot-password')}>
            <Text className="text-sm font-bold text-[#e13e00]">Forgot password?</Text>
          </TouchableOpacity>

          <View className="my-5 h-px bg-gray-100" />

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 py-[15px] ${
              loadingAction === 'google' ? 'opacity-[0.65]' : ''
            }`}
            activeOpacity={0.85}
            onPress={onGoogleLogin}
            disabled={loadingAction !== null}>
            <Chrome size={18} color="#111827" />
            <Text className="text-[15px] font-bold text-gray-950">
              {loadingAction === 'google' ? 'Opening Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-sm text-gray-500">No account yet?</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/auth/create-account')}>
              <Text className="text-sm font-bold text-[#e13e00]">Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
