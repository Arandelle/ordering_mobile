import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { emptyPersonalDetails, useCheckoutDraft } from '@/hooks/useCheckout';
import CheckoutStepper from './CheckoutStepper';
import CheckoutTextField from './CheckoutTextField';

type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'note';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const PersonalDetails = () => {
  const router = useRouter();
  const { draft, savePersonalDetails } = useCheckoutDraft();

  const [form, setForm] = useState<FormData>({
    ...emptyPersonalDetails,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (draft?.personalDetails) {
      setForm(draft.personalDetails);
    }
  }, [draft?.personalDetails]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = async () => {
    if (validate()) {
      await savePersonalDetails.mutateAsync(form);
      router.push('/checkout/address');
    }
  };

  const handleChange = (field: Field, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="px-5 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <CheckoutStepper currentStep={1} />

        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-1 text-xl font-bold text-gray-950">Personal Details</Text>
          <Text className="mb-5 text-[13px] text-gray-500">Tell us a bit about yourself</Text>

          <View className="flex-row gap-3">
            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="First Name"
              placeholder="Juan"
              value={form.firstName}
              onChangeText={v => handleChange('firstName', v)}
              autoCapitalize="words"
              error={errors.firstName}
            />

            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Last Name"
              placeholder="dela Cruz"
              value={form.lastName}
              onChangeText={v => handleChange('lastName', v)}
              autoCapitalize="words"
              error={errors.lastName}
            />
          </View>

          <CheckoutTextField
            label="Email Address"
            placeholder="juan@email.com"
            value={form.email}
            onChangeText={v => handleChange('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <CheckoutTextField
            label="Phone Number"
            placeholder="+63 912 345 6789"
            value={form.phone}
            onChangeText={v => handleChange('phone', v)}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <CheckoutTextField
            label="Order Note"
            optional
            inputClassName="h-[88px] pt-3"
            placeholder="Any special instructions for your order..."
            value={form.note}
            onChangeText={v => handleChange('note', v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`mt-2 items-center rounded-2xl bg-[#e13e00] py-[15px] ${
              savePersonalDetails.isPending ? 'opacity-[0.65]' : ''
            }`}
            onPress={handleProceed}
            activeOpacity={0.85}
            disabled={savePersonalDetails.isPending}>
            <Text className="text-[15px] font-bold text-white">
              {savePersonalDetails.isPending ? 'Saving...' : 'Proceed to Address'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetails;
