import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Chrome, LockKeyhole, LogOut, Mail, Phone, Save } from 'lucide-react-native';
import {
  CheckoutAddressDetails,
  emptyAddressDetails,
  useMyAddress,
  useUpdateMyAddress,
} from '@/hooks/useCheckout';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';

const BRAND = '#e13e00';

type LoadingAction = 'email' | 'google' | 'sign-out' | 'profile' | 'address' | 'password' | null;
type AddressField = keyof CheckoutAddressDetails | 'lat' | 'lng';
type EditingSection = 'profile' | 'address' | 'password' | null;

type ProfileUser = {
  email: string;
  name?: string | null;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
};

type UpdateUserPayload = Parameters<typeof authClient.updateUser>[0] & {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  image: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AddressErrors {
  line1?: string;
  city?: string;
  province?: string;
  country?: string;
  lat?: string;
  lng?: string;
}

const emptyProfileForm: ProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  image: '',
};

const emptyPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function getDisplayName(user: ProfileUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || 'My Account';
}

function getInitial(user: ProfileUser) {
  return getDisplayName(user).charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();
}

function formatAddress(address: CheckoutAddressDetails) {
  const main = [address.line1, address.line2, address.city, address.province]
    .filter(Boolean)
    .join(', ');
  const postal = [address.zipCode, address.country].filter(Boolean).join(' ');
  const landmark = address.landmark ? `Landmark: ${address.landmark}` : '';

  return [main, postal, landmark].filter(Boolean).join('\n') || 'No address saved yet.';
}

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <View className="mb-1.5 flex-row items-center justify-between">
      <Text className="text-[13px] font-semibold text-gray-700">{label}</Text>
      {optional && <Text className="text-[11px] text-gray-400">Optional</Text>}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="border-b border-gray-100 py-3">
      <Text className="text-xs font-semibold uppercase text-gray-400">{label}</Text>
      <Text className="mt-1 text-sm font-semibold text-gray-950">{value?.trim() || 'Not set'}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  isEditing,
  onEdit,
  onCancel,
}: {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="text-lg font-extrabold text-gray-950">{title}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={isEditing ? onCancel : onEdit}>
        <Text className="text-sm font-bold text-[#e13e00]">{isEditing ? 'Cancel' : 'Edit'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const Profile = () => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user as ProfileUser | undefined;
  const { data: savedAddress, isLoading: isAddressLoading } = useMyAddress(Boolean(user));
  const updateAddress = useUpdateMyAddress();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [isOAuthOnly, setIsOAuthOnly] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [addressForm, setAddressForm] = useState<CheckoutAddressDetails>(emptyAddressDetails);
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

  const handleEmailLogin = async () => {
    clearMessages();
    setLoadingAction('email');

    const { error: authError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to sign in'));
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setLoadingAction('google');

    const { error: authError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/profile',
    });

    setLoadingAction(null);

    if (authError) {
      setError(getAuthErrorMessage(authError, 'Google sign-in failed'));
      return;
    }

    router.replace('/profile');
  };

  const handleSignOut = async () => {
    setLoadingAction('sign-out');
    await authClient.signOut();
    setLoadingAction(null);
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

    if (addressErrors[field as keyof AddressErrors]) {
      setAddressErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateAddress = () => {
    const nextErrors: AddressErrors = {};

    if (!addressForm.line1.trim()) nextErrors.line1 = 'Address line 1 is required';
    if (!addressForm.city.trim()) nextErrors.city = 'City is required';
    if (!addressForm.province.trim()) nextErrors.province = 'Province is required';
    if (!addressForm.country.trim()) nextErrors.country = 'Country is required';
    setAddressErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveAddress = async () => {
    clearMessages();

    if (!validateAddress()) return;

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

  if (user) {
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
            <View className="items-center">
              <TouchableOpacity
                className="h-24 w-24 overflow-hidden rounded-full bg-orange-50"
                activeOpacity={0.85}
                onPress={isProfileEditing ? handlePickPhoto : undefined}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text className="text-3xl font-extrabold text-[#e13e00]">
                      {getInitial(user)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text className="mt-3 text-xl font-extrabold text-gray-950">
                {getDisplayName(user)}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">{user.email}</Text>
              {isProfileEditing && (
                <TouchableOpacity
                  className="mt-3 flex-row items-center gap-1.5"
                  activeOpacity={0.8}
                  onPress={handlePickPhoto}>
                  <Camera size={15} color={BRAND} />
                  <Text className="text-xs font-bold text-[#e13e00]">Upload photo</Text>
                </TouchableOpacity>
              )}
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

            <View className="mt-6">
              <SectionHeader
                title="Profile"
                isEditing={isProfileEditing}
                onEdit={() => startEditing('profile')}
                onCancel={cancelEditing}
              />

              {isProfileEditing ? (
                <View className="gap-4">
                  <View>
                    <FieldLabel label="First Name" optional />
                    <TextInput
                      className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                      placeholder="Juan"
                      placeholderTextColor="#b9b9b9"
                      value={profileForm.firstName}
                      onChangeText={(value) =>
                        setProfileForm((prev) => ({ ...prev, firstName: value }))
                      }
                      autoCapitalize="words"
                    />
                  </View>

                  <View>
                    <FieldLabel label="Last Name" optional />
                    <TextInput
                      className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                      placeholder="Dela Cruz"
                      placeholderTextColor="#b9b9b9"
                      value={profileForm.lastName}
                      onChangeText={(value) =>
                        setProfileForm((prev) => ({ ...prev, lastName: value }))
                      }
                      autoCapitalize="words"
                    />
                  </View>

                  <View>
                    <FieldLabel label="Phone" optional />
                    <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                      <Phone size={17} color="#9ca3af" />
                      <TextInput
                        className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                        placeholder="+63 912 345 6789"
                        placeholderTextColor="#b9b9b9"
                        value={profileForm.phone}
                        onChangeText={(value) =>
                          setProfileForm((prev) => ({ ...prev, phone: value }))
                        }
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-[15px] ${
                      loadingAction === 'profile' ? 'opacity-[0.65]' : ''
                    }`}
                    activeOpacity={0.85}
                    onPress={handleSaveProfile}
                    disabled={isBusy}>
                    <Save size={17} color="#fff" />
                    <Text className="text-[15px] font-bold text-white">
                      {loadingAction === 'profile' ? 'Saving...' : 'Save Profile'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <InfoRow label="First Name" value={user.firstName} />
                  <InfoRow label="Last Name" value={user.lastName} />
                  <InfoRow label="Phone" value={user.phone ?? user.phoneNumber} />
                  <InfoRow label="Email" value={user.email} />
                </View>
              )}
            </View>

            <View className="mt-7">
              <SectionHeader
                title="Address"
                isEditing={isAddressEditing}
                onEdit={() => startEditing('address')}
                onCancel={cancelEditing}
              />

              {isAddressLoading ? (
                <View className="py-6">
                  <ActivityIndicator color={BRAND} />
                </View>
              ) : isAddressEditing ? (
                <View className="gap-4">
                  <View>
                    <FieldLabel label="Address Line 1" />
                    <TextInput
                      className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                      placeholder="House number, street, barangay"
                      placeholderTextColor="#b9b9b9"
                      value={addressForm.line1}
                      onChangeText={(value) => handleAddressChange('line1', value)}
                      autoCapitalize="words"
                    />
                    {!!addressErrors.line1 && (
                      <Text className="mt-1 text-[11px] text-red-600">{addressErrors.line1}</Text>
                    )}
                  </View>

                  <View>
                    <FieldLabel label="Address Line 2" optional />
                    <TextInput
                      className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                      placeholder="Unit, floor, building"
                      placeholderTextColor="#b9b9b9"
                      value={addressForm.line2}
                      onChangeText={(value) => handleAddressChange('line2', value)}
                      autoCapitalize="words"
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <FieldLabel label="City" />
                      <TextInput
                        className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                        placeholder="Quezon City"
                        placeholderTextColor="#b9b9b9"
                        value={addressForm.city}
                        onChangeText={(value) => handleAddressChange('city', value)}
                        autoCapitalize="words"
                      />
                      {!!addressErrors.city && (
                        <Text className="mt-1 text-[11px] text-red-600">{addressErrors.city}</Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <FieldLabel label="Province" />
                      <TextInput
                        className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                        placeholder="Metro Manila"
                        placeholderTextColor="#b9b9b9"
                        value={addressForm.province}
                        onChangeText={(value) => handleAddressChange('province', value)}
                        autoCapitalize="words"
                      />
                      {!!addressErrors.province && (
                        <Text className="mt-1 text-[11px] text-red-600">
                          {addressErrors.province}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <FieldLabel label="ZIP Code" optional />
                      <TextInput
                        className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                        placeholder="1100"
                        placeholderTextColor="#b9b9b9"
                        value={addressForm.zipCode}
                        onChangeText={(value) => handleAddressChange('zipCode', value)}
                        keyboardType="number-pad"
                      />
                    </View>

                    <View className="flex-1">
                      <FieldLabel label="Country" />
                      <TextInput
                        className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                        placeholder="Philippines"
                        placeholderTextColor="#b9b9b9"
                        value={addressForm.country}
                        onChangeText={(value) => handleAddressChange('country', value)}
                        autoCapitalize="words"
                      />
                      {!!addressErrors.country && (
                        <Text className="mt-1 text-[11px] text-red-600">
                          {addressErrors.country}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View>
                    <FieldLabel label="Landmark" optional />
                    <TextInput
                      className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-950"
                      placeholder="Near the main gate"
                      placeholderTextColor="#b9b9b9"
                      value={addressForm.landmark}
                      onChangeText={(value) => handleAddressChange('landmark', value)}
                      autoCapitalize="sentences"
                    />
                  </View>

                  <TouchableOpacity
                    className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-[15px] ${
                      loadingAction === 'address' ? 'opacity-[0.65]' : ''
                    }`}
                    activeOpacity={0.85}
                    onPress={handleSaveAddress}
                    disabled={isBusy}>
                    <Save size={17} color="#fff" />
                    <Text className="text-[15px] font-bold text-white">
                      {loadingAction === 'address' ? 'Saving...' : 'Save Address'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text className="whitespace-pre-line border-b border-gray-100 py-3 text-sm font-semibold leading-5 text-gray-950">
                  {formatAddress(addressForm)}
                </Text>
              )}
            </View>

            <View className="mt-7">
              <SectionHeader
                title="Security"
                isEditing={isPasswordEditing}
                onEdit={() => startEditing('password')}
                onCancel={cancelEditing}
              />

              {isOAuthOnly && !isPasswordEditing ? (
                <Text className="border-b border-gray-100 py-3 text-sm leading-5 text-gray-600">
                  You sign in with Google, so a password change is usually not needed.
                </Text>
              ) : isPasswordEditing ? (
                <View className="gap-4">
                  {isOAuthOnly && (
                    <Text className="rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-5 text-gray-600">
                      This account is currently Google-only. Password changes may require adding
                      credential access first.
                    </Text>
                  )}

                  <View>
                    <FieldLabel label="Current Password" />
                    <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                      <LockKeyhole size={17} color="#9ca3af" />
                      <TextInput
                        className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                        placeholder="Current password"
                        placeholderTextColor="#b9b9b9"
                        value={passwordForm.currentPassword}
                        onChangeText={(value) =>
                          setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
                        }
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View>
                    <FieldLabel label="New Password" />
                    <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                      <LockKeyhole size={17} color="#9ca3af" />
                      <TextInput
                        className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                        placeholder="At least 8 characters"
                        placeholderTextColor="#b9b9b9"
                        value={passwordForm.newPassword}
                        onChangeText={(value) =>
                          setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                        }
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View>
                    <FieldLabel label="Confirm Password" />
                    <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
                      <LockKeyhole size={17} color="#9ca3af" />
                      <TextInput
                        className="min-h-12 flex-1 px-3 text-sm text-gray-950"
                        placeholder="Repeat new password"
                        placeholderTextColor="#b9b9b9"
                        value={passwordForm.confirmPassword}
                        onChangeText={(value) =>
                          setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                        }
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    className={`flex-row items-center justify-center gap-2 rounded-2xl bg-[#e13e00] py-[15px] ${
                      loadingAction === 'password' ? 'opacity-[0.65]' : ''
                    }`}
                    activeOpacity={0.85}
                    onPress={handleChangePassword}
                    disabled={isBusy}>
                    <Text className="text-[15px] font-bold text-white">
                      {loadingAction === 'password' ? 'Saving...' : 'Change Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <InfoRow label="Password" value="Protected" />
              )}
            </View>

            <TouchableOpacity
              className={`mt-7 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 ${
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            onPress={handleEmailLogin}
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
            onPress={handleGoogleLogin}
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
};

export default Profile;
