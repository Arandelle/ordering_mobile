import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Wallet } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import { useMembershipStatus } from '@/hooks/useMembership';
import { Ionicons } from '@expo/vector-icons';
import { emptyAddressDetails } from '@/hooks/useCheckout';
import { apiClient } from '@/lib/apiClient';
import { useMyAddress, useUpdateMyAddress } from '@/hooks/useAddress';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { AddressDetails } from './AddressDetails';
import type {
  DeliveryCoordinates,
  ResolvedDeliveryAddress,
} from '../checkout/DeliveryLocationPicker';
import { ProfileDetails } from './ProfileDetails';
import { SecurityDetails } from './SecurityDetails';
import SignInForm from '@/screens/auth/SignInForm';
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
import { Toast } from './components/ToastMessage';
const BRAND = '#e13e00';

export default function Profile() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user as ProfileUser | undefined;
  const { data: walletData, isLoading: walletLoading } = useWallet({ enabled: Boolean(user) });
  const walletBalance = walletData?.balance ?? 0;
  const { data: membershipData } = useMembershipStatus({ enabled: Boolean(user) });
  const hasActiveMembership = membershipData?.activeMembership?.status === 'paid';
  const hasTiers = (membershipData?.tiers?.length ?? 0) > 0;
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
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(null);
  const [mapMismatch, setMapMismatch] = useState(false);
  const mapResolvedCodesRef = useRef<{ cityCode?: string; barangayCode?: string }>({});

  const profileImage = pendingAvatarBase64 || profileForm.image || user?.image || '';
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

  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(clearMessages, 4000);
    return () => clearTimeout(timer);
  }, [error, success]);

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
    setPendingAvatarBase64(null);
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
    setMapMismatch(false);
    mapResolvedCodesRef.current = {};
    setEditingSection(null);
  };

  const handlePickPhoto = async () => {
    clearMessages();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to update your profile image.'
      );
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
    setPendingAvatarBase64(`data:${mimeType};base64,${asset.base64}`);
  };

  const handleSaveProfile = async () => {
    clearMessages();
    setLoadingAction('profile');

    try {
      let imageUrl = profileForm.image || null;
      let newPublicId: string | undefined;

      if (pendingAvatarBase64) {
        const uploaded = await apiClient.post<{ secure_url: string; public_id: string }>(
          '/customer/upload-avatar',
          {
            imageFile: pendingAvatarBase64,
            oldPublicId: user?.publicId ?? undefined,
          },
          { timeoutMs: 30000 }
        );
        imageUrl = uploaded.secure_url;
        newPublicId = uploaded.public_id;
      }

      const fullName = [profileForm.firstName, profileForm.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const payload: UpdateUserPayload = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
        name: fullName || user?.name || user?.email.split('@')[0] || 'Customer',
        image: imageUrl,
        ...(newPublicId ? { publicId: newPublicId } : {}),
      };
      const { error: authError } = await authClient.updateUser(payload);

      if (authError) {
        setError(getAuthErrorMessage(authError, 'Unable to update profile'));
        return;
      }

      setPendingAvatarBase64(null);
      await refetch();
      setEditingSection(null);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Unable to update profile'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddressChange = (field: AddressField, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));

    const errorField = field as keyof AddressErrors;
    if (addressErrors[errorField]) {
      setAddressErrors((prev) => ({ ...prev, [errorField]: undefined }));
    }
  };

  const handleCoordinatesChange = (coords: DeliveryCoordinates) => {
    setAddressForm((prev) => ({ ...prev, coordinates: coords }));
  };

  const handleAddressResolved = (
    resolved: ResolvedDeliveryAddress & { cityCode?: string; barangayCode?: string }
  ) => {
    mapResolvedCodesRef.current = {
      cityCode: resolved.cityCode,
      barangayCode: resolved.barangayCode,
    };
    setMapMismatch(false);
    setAddressForm((prev) => ({
      ...prev,
      line1: resolved.road || prev.line1,
      line2: resolved.line2 || prev.line2,
      city: resolved.city || prev.city,
      province: resolved.province || prev.province,
      zipCode: resolved.zipCode || prev.zipCode,
      subMunicipality: resolved.subMunicipality || prev.subMunicipality,
      placeName: resolved.placeName || prev.placeName,
      cityCode: resolved.cityCode || prev.cityCode,
      barangayCode: resolved.barangayCode || prev.barangayCode,
    }));
  };

  const handlePsgcChange = useCallback(
    async (selection: { city?: string; barangay?: string; subMunicipality?: string }) => {
      const parts = [selection.barangay, selection.subMunicipality, selection.city].filter(Boolean);
      if (!parts.length) return;

      const query = [...parts, 'Metro Manila, Philippines'].join(', ');
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ph&format=json&limit=1`;
        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'HarrisonExpoApp/1.0 (https://github.com/harrison-expo)',
          },
        });
        if (!res.ok) return;
        const results = await res.json();
        if (!results.length) return;

        const { lat, lon } = results[0];
        const coords = { lat: Number(lat), lng: Number(lon) };
        setAddressForm((prev) => ({ ...prev, coordinates: coords }));

        const mapCityCode = mapResolvedCodesRef.current.cityCode;
        const mapBarangayCode = mapResolvedCodesRef.current.barangayCode;
        const psgcChangedCityOrBarangay = Boolean(selection.city || selection.barangay);
        if (psgcChangedCityOrBarangay && (mapCityCode || mapBarangayCode)) {
          setMapMismatch(true);
        }
      } catch {
        // Geocoding failed — coordinates stay as-is
      }
    },
    []
  );

  const handleSaveAddress = async () => {
    clearMessages();
    setLoadingAction('address');

    try {
      await updateAddress.mutateAsync(addressForm);
      setMapMismatch(false);
      mapResolvedCodesRef.current = {};
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

      {/* Fixed toast overlay — always visible regardless of scroll */}
      {(!!error || !!success) && (
        <View
          style={{ top: insets.top + 8 }}
          className="absolute left-5 right-5 z-50 gap-2"
          pointerEvents="box-none">
          {!!error && <Toast variant="error" message={error} onDismiss={clearMessages} />}
          {!!success && <Toast variant="success" message={success} onDismiss={clearMessages} />}
        </View>
      )}

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View className="overflow-hidden bg-white p-5 border border-gray-200">
          <ProfileDetails
            user={user}
            profileImage={profileImage}
            profileForm={profileForm}
            isEditing={isProfileEditing}
            isBusy={isBusy}
            loadingAction={loadingAction}
            setProfileForm={setProfileForm}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            onSave={handleSaveProfile}
            onPickPhoto={handlePickPhoto}
          />
        </View>

        {/* Wallet & Membership — side by side */}
        <View className="mt-3 flex-row gap-3">
          <TouchableOpacity
            className={`${hasTiers ? 'flex-1' : 'w-full'} border border-gray-200 bg-white p-4`}
            activeOpacity={0.7}
            onPress={() => router.push('/wallet')}>
            <View className="flex-row items-center gap-3">
              <View className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Wallet size={18} color={BRAND} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-400">Wallet</Text>
                {walletLoading ? (
                  <ActivityIndicator size="small" color={BRAND} />
                ) : (
                  <Text className="text-base font-bold text-brand-500">
                    ₱{walletBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </View>
          </TouchableOpacity>

          {hasTiers && (
            <TouchableOpacity
              className="flex-1 border border-gray-200 bg-white p-4"
              activeOpacity={0.7}
              onPress={() => router.push('/membership')}>
              <View className="flex-row items-center gap-3">
                <View className={`flex h-10 w-10 items-center justify-center rounded-full ${hasActiveMembership ? 'bg-brand-500' : 'bg-gray-100'}`}>
                  <Ionicons
                    name={hasActiveMembership ? 'star' : 'star-outline'}
                    size={18}
                    color={hasActiveMembership ? '#fff' : '#6b7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-400">Membership</Text>
                  <Text className={`text-sm font-bold ${hasActiveMembership ? 'text-brand-500' : 'text-gray-700'}`} numberOfLines={1}>
                    {hasActiveMembership ? 'VIP Active' : 'View plans'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Address */}
        <View className="mt-3 border border-gray-200 bg-white p-5">
          <AddressDetails
            addressForm={addressForm}
            addressErrors={addressErrors}
            isEditing={isAddressEditing}
            isLoading={isAddressLoading}
            isBusy={isBusy}
            loadingAction={loadingAction}
            mapMismatch={mapMismatch}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            onChange={handleAddressChange}
            onCoordinatesChange={handleCoordinatesChange}
            onAddressResolved={handleAddressResolved}
            onPsgcChange={handlePsgcChange}
            onSave={handleSaveAddress}
          />
        </View>

        {/* Security */}
        <View className="mt-3 border border-gray-200 bg-white p-5">
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

        {/* Sign out */}
        <TouchableOpacity
          className={`mt-3 flex-row items-center justify-center gap-2 border border-gray-200 bg-white py-3.5 ${
            loadingAction === 'sign-out' ? 'opacity-60' : ''
          }`}
          activeOpacity={0.85}
          onPress={handleSignOut}
          disabled={loadingAction === 'sign-out'}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text className="text-sm font-bold text-red-500">
            {loadingAction === 'sign-out' ? 'Signing out...' : 'Sign out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
