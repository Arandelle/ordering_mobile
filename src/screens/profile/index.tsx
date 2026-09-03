import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { LogOut, Wallet } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import { Ionicons } from '@expo/vector-icons';
import {
  emptyAddressDetails
} from '@/hooks/useCheckout';
import { apiClient } from '@/lib/apiClient';
import { useMyAddress, useUpdateMyAddress } from '@/hooks/useAddress';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { AddressDetails } from './AddressDetails';
import { ProfileDetails } from './ProfileDetails';
import { SecurityDetails } from './SecurityDetails';
import SignInForm from '@/screens/auth/SignInForm';
import { ProfileHeader } from './components/ProfileHeader';
import {
  AddressErrors,
  AddressField,
  EditingSection,
  emptyPasswordForm,
  emptyProfileForm,
  LoadingAction,
  PasswordForm,
  ProfileForm,
  ProfileUser,
  UpdateUserPayload,
} from './types';

const BRAND = '#e13e00';

export default function Profile() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user as ProfileUser | undefined;
  const { data: walletData, isLoading: walletLoading } = useWallet({ enabled: Boolean(user) });
  const walletBalance = walletData?.balance ?? 0;
  const { data: savedAddress, isLoading: isAddressLoading } = useMyAddress(Boolean(user));
  const updateAddress = useUpdateMyAddress();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [isOAuthOnly, setIsOAuthOnly] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [addressForm, setAddressForm] = useState(emptyAddressDetails);
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);

  const profileImage = profileForm.image || user?.image || '';
  const isBusy = loadingAction !== null;
  const isProfileEditing = editingSection === 'profile';
  const isAddressEditing = editingSection === 'address';
  const isPasswordEditing = editingSection === 'password';

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? user.phoneNumber ?? '',
      image: user.image ?? '',
    });
  }, [user]);

  useEffect(() => {
    if (savedAddress) {
      setAddressForm(savedAddress);
    }
  }, [savedAddress]);

  useEffect(() => {
    if (!user) return;

    authClient.listAccounts().then(({ data }) => {
      if (data) {
        setIsOAuthOnly(!data.some((acc) => acc.providerId === 'credential'));
      }
    });
  }, [user]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSignOut = async () => {
    setLoadingAction('sign-out');
    await authClient.signOut();
    queryClient.removeQueries({ queryKey: ['order-summary'] });
    queryClient.removeQueries({ queryKey: ['orders-infinite'] });
    queryClient.removeQueries({ queryKey: ['order-detail'] });
    queryClient.removeQueries({ queryKey: ['user_address'] });
    queryClient.removeQueries({ queryKey: ['user_address', 'my_address'] });
    setLoadingAction(null);
  };

  const handleDeleteAccount = async (reason: string) => {
    setLoadingAction('delete-account');
    clearMessages();

    try {
      await apiClient.post('/customer/account/delete', {
        reason: reason || undefined,
      });

      await authClient.signOut();
      queryClient.removeQueries({ queryKey: ['order-summary'] });
      queryClient.removeQueries({ queryKey: ['orders-infinite'] });
      queryClient.removeQueries({ queryKey: ['order-detail'] });
      queryClient.removeQueries({ queryKey: ['user_address'] });
      queryClient.removeQueries({ queryKey: ['user_address', 'my_address'] });

      setSuccess('Account scheduled for deletion. You will be signed out.');

      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Failed to delete account';
      setError(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const startEditing = (section: EditingSection) => {
    clearMessages();
    setEditingSection(section);
  };

  const cancelEditing = () => {
    clearMessages();
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? user.phoneNumber ?? '',
        image: user.image ?? '',
      });
    }
    if (savedAddress) {
      setAddressForm(savedAddress);
    }
    setAddressErrors({});
    setPasswordForm(emptyPasswordForm);
    setEditingSection(null);
  };

  const handlePickPhoto = async () => {
    clearMessages();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to update your profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.base64) {
      setError('Unable to read the selected image.');
      return;
    }

    const mimeType = asset.mimeType ?? 'image/jpeg';
    setProfileForm((prev) => ({
      ...prev,
      image: `data:${mimeType};base64,${asset.base64}`,
    }));
  };

  const handleSaveProfile = async () => {
    clearMessages();
    setLoadingAction('profile');

    const fullName = [profileForm.firstName, profileForm.lastName].filter(Boolean).join(' ').trim();
    const payload: UpdateUserPayload = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phone: profileForm.phone.trim(),
      name: fullName || user?.name || user?.email.split('@')[0] || 'Customer',
      image: profileForm.image || null,
    };
    const { error: authError } = await authClient.updateUser(payload);

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to update profile'));
      return;
    }

    await refetch();
    setEditingSection(null);
    setSuccess('Profile updated.');
  };

  const handleAddressChange = (field: AddressField, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));

    const errorField = field as keyof AddressErrors;
    if (addressErrors[errorField]) {
      setAddressErrors((prev) => ({ ...prev, [errorField]: undefined }));
    }
  };

  const handleSaveAddress = async () => {
    clearMessages();
    setLoadingAction('address');

    try {
      await updateAddress.mutateAsync(addressForm);
      setEditingSection(null);
      setSuccess('Address updated.');
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, 'Unable to update address'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChangePassword = async () => {
    clearMessages();

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoadingAction('password');

    const { error: authError } = await authClient.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      revokeOtherSessions: true,
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to change password'));
      return;
    }

    setPasswordForm(emptyPasswordForm);
    setEditingSection(null);
    setSuccess('Password updated.');
  };

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  if (!user) {
    return <SignInForm />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingLeft: 20, paddingRight: 20, paddingTop: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <ProfileHeader
            user={user}
            profileImage={profileImage}
            isEditing={isProfileEditing}
            onPickPhoto={handlePickPhoto}
          />

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
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <ProfileDetails
            user={user}
            profileForm={profileForm}
            isEditing={isProfileEditing}
            isBusy={isBusy}
            loadingAction={loadingAction}
            setProfileForm={setProfileForm}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            onSave={handleSaveProfile}
          />
        </View>

        {/* Wallet Card */}
        <TouchableOpacity
          className="mt-6 rounded-3xl bg-white p-5 shadow-sm"
          activeOpacity={0.8}
          onPress={() => router.push('/wallet')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
                <Wallet size={20} color={BRAND} />
              </View>
              <View>
                <Text className="text-sm font-bold text-gray-950">Wallet</Text>
                {walletLoading ? (
                  <ActivityIndicator size="small" color={BRAND} />
                ) : (
                  <Text className="text-lg font-extrabold text-[#e13e00]">
                    ₱{walletBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <AddressDetails
            addressForm={addressForm}
            addressErrors={addressErrors}
            isEditing={isAddressEditing}
            isLoading={isAddressLoading}
            isBusy={isBusy}
            loadingAction={loadingAction}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            onChange={handleAddressChange}
            onSave={handleSaveAddress}
          />
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <SecurityDetails
            passwordForm={passwordForm}
            isEditing={isPasswordEditing}
            isBusy={isBusy}
            isOAuthOnly={isOAuthOnly}
            loadingAction={loadingAction}
            setPasswordForm={setPasswordForm}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            onSave={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
          />
        </View>

        <TouchableOpacity
          className={`mt-8 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 shadow-sm ${
            loadingAction === 'sign-out' ? 'opacity-[0.65]' : ''
          }`}
          activeOpacity={0.85}
          onPress={handleSignOut}
          disabled={loadingAction === 'sign-out'}>
          <LogOut size={17} color={BRAND} />
          <Text className="text-sm font-bold text-[#e13e00]">
            {loadingAction === 'sign-out' ? 'Signing out...' : 'Sign out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
