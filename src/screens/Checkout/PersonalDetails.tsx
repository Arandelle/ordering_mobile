import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { emptyPersonalDetails, useCheckoutDraft } from '@/hooks/useCheckout';

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
  const [focused, setFocused] = useState<Field | null>(null);

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

  const inputClassName = (field: Field) => {
    const hasError = errors[field as keyof FormErrors];
    const isFocused = focused === field;

    return [
      'rounded-[10px] border-[1.5px] px-3.5 py-3 text-sm text-gray-950',
      isFocused ? 'border-[#e13e00] bg-white' : 'border-[#e8e8e8] bg-[#fafafa]',
      hasError && 'border-red-600 bg-red-50',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="px-5 pt-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-7 flex-row items-center">
          {['Details', 'Address', 'Review'].map((step, i) => (
            <View key={step} className="flex-1 flex-row items-center">
              <View className="items-center gap-1">
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full ${
                    i === 0 ? 'bg-[#e13e00]' : 'bg-gray-100'
                  }`}>
                  <Text className={`text-xs font-semibold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                    {i + 1}
                  </Text>
                </View>
                <Text className={`text-[11px] ${i === 0 ? 'font-semibold text-[#e13e00]' : 'text-gray-400'}`}>
                  {step}
                </Text>
              </View>
              {i < 2 && (
                <View className={`mb-3.5 h-[1.5px] flex-1 ${i === 0 ? 'bg-[#e13e00]' : 'bg-gray-100'}`} />
              )}
            </View>
          ))}
        </View>

        <Text className="mb-1 text-xl font-bold text-gray-950">Personal Details</Text>
        <Text className="mb-6 text-[13px] text-gray-500">Tell us a bit about yourself</Text>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">First Name</Text>
            <TextInput
              className={inputClassName('firstName')}
              placeholder="Juan"
              placeholderTextColor="#bbb"
              value={form.firstName}
              onChangeText={v => handleChange('firstName', v)}
              onFocus={() => setFocused('firstName')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.firstName && <Text className="mt-1 text-[11px] text-red-600">{errors.firstName}</Text>}
          </View>

          <View className="flex-1">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Last Name</Text>
            <TextInput
              className={inputClassName('lastName')}
              placeholder="dela Cruz"
              placeholderTextColor="#bbb"
              value={form.lastName}
              onChangeText={v => handleChange('lastName', v)}
              onFocus={() => setFocused('lastName')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.lastName && <Text className="mt-1 text-[11px] text-red-600">{errors.lastName}</Text>}
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Email Address</Text>
          <TextInput
            className={inputClassName('email')}
            placeholder="juan@email.com"
            placeholderTextColor="#bbb"
            value={form.email}
            onChangeText={v => handleChange('email', v)}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text className="mt-1 text-[11px] text-red-600">{errors.email}</Text>}
        </View>

        <View className="mb-4">
          <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Phone Number</Text>
          <TextInput
            className={inputClassName('phone')}
            placeholder="+63 912 345 6789"
            placeholderTextColor="#bbb"
            value={form.phone}
            onChangeText={v => handleChange('phone', v)}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text className="mt-1 text-[11px] text-red-600">{errors.phone}</Text>}
        </View>

        <View className="mb-4">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[13px] font-semibold text-gray-700">Order Note</Text>
            <Text className="text-[11px] text-gray-400">Optional</Text>
          </View>
          <TextInput
            className={`${inputClassName('note')} h-[88px] pt-3`}
            placeholder="Any special instructions for your order..."
            placeholderTextColor="#bbb"
            value={form.note}
            onChangeText={v => handleChange('note', v)}
            onFocus={() => setFocused('note')}
            onBlur={() => setFocused(null)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          className={`mt-2 items-center rounded-xl bg-[#e13e00] py-[15px] ${
            savePersonalDetails.isPending ? 'opacity-[0.65]' : ''
          }`}
          onPress={handleProceed}
          activeOpacity={0.85}
          disabled={savePersonalDetails.isPending}>
          <Text className="text-[15px] font-bold text-white">
            {savePersonalDetails.isPending ? 'Saving...' : 'Proceed to Address'}
          </Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetails;
