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
import {
  CheckoutAddressDetails,
  emptyAddressDetails,
  useCheckoutDraft,
} from '@/hooks/useCheckout';

type Field = keyof CheckoutAddressDetails | 'lat' | 'lng';

interface FormErrors {
  line1?: string;
  city?: string;
  province?: string;
  country?: string;
  lat?: string;
  lng?: string;
}

const AddressDetails = () => {
  const router = useRouter();
  const { draft, saveAddressDetails } = useCheckoutDraft();

  const [form, setForm] = useState<CheckoutAddressDetails>({
    ...emptyAddressDetails,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focused, setFocused] = useState<Field | null>(null);

  useEffect(() => {
    if (draft?.shippingAddress) {
      setForm(draft.shippingAddress);
    }
  }, [draft?.shippingAddress]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.line1.trim()) newErrors.line1 = 'Address line 1 is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.province.trim()) newErrors.province = 'Province is required';
    if (!form.country.trim()) newErrors.country = 'Country is required';

    if (form.coordinates.lat.trim() && Number.isNaN(Number(form.coordinates.lat))) {
      newErrors.lat = 'Latitude must be a number';
    }
    if (form.coordinates.lng.trim() && Number.isNaN(Number(form.coordinates.lng))) {
      newErrors.lng = 'Longitude must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: Field, value: string) => {
    if (field === 'lat' || field === 'lng') {
      setForm((prev) => ({
        ...prev,
        coordinates: { ...prev.coordinates, [field]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProceed = async () => {
    if (validate()) {
      await saveAddressDetails.mutateAsync(form);
      router.push('/checkout/review');
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
                    i <= 1 ? 'bg-[#e13e00]' : 'bg-gray-100'
                  }`}>
                  <Text className={`text-xs font-semibold ${i <= 1 ? 'text-white' : 'text-gray-400'}`}>
                    {i + 1}
                  </Text>
                </View>
                <Text className={`text-[11px] ${i <= 1 ? 'font-semibold text-[#e13e00]' : 'text-gray-400'}`}>
                  {step}
                </Text>
              </View>
              {i < 2 && (
                <View className={`mb-3.5 h-[1.5px] flex-1 ${i <= 1 ? 'bg-[#e13e00]' : 'bg-gray-100'}`} />
              )}
            </View>
          ))}
        </View>

        <Text className="mb-1 text-xl font-bold text-gray-950">Address Details</Text>
        <Text className="mb-6 text-[13px] text-gray-500">Where should we deliver your order?</Text>

        <View className="mb-4">
          <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Address Line 1</Text>
          <TextInput
            className={inputClassName('line1')}
            placeholder="House number, street, barangay"
            placeholderTextColor="#bbb"
            value={form.line1}
            onChangeText={(v) => handleChange('line1', v)}
            onFocus={() => setFocused('line1')}
            onBlur={() => setFocused(null)}
            autoCapitalize="words"
          />
          {errors.line1 && <Text className="mt-1 text-[11px] text-red-600">{errors.line1}</Text>}
        </View>

        <View className="mb-4">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[13px] font-semibold text-gray-700">Address Line 2</Text>
            <Text className="text-[11px] text-gray-400">Optional</Text>
          </View>
          <TextInput
            className={inputClassName('line2')}
            placeholder="Unit, floor, building"
            placeholderTextColor="#bbb"
            value={form.line2}
            onChangeText={(v) => handleChange('line2', v)}
            onFocus={() => setFocused('line2')}
            onBlur={() => setFocused(null)}
            autoCapitalize="words"
          />
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">City</Text>
            <TextInput
              className={inputClassName('city')}
              placeholder="Quezon City"
              placeholderTextColor="#bbb"
              value={form.city}
              onChangeText={(v) => handleChange('city', v)}
              onFocus={() => setFocused('city')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.city && <Text className="mt-1 text-[11px] text-red-600">{errors.city}</Text>}
          </View>

          <View className="flex-1">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Province</Text>
            <TextInput
              className={inputClassName('province')}
              placeholder="Metro Manila"
              placeholderTextColor="#bbb"
              value={form.province}
              onChangeText={(v) => handleChange('province', v)}
              onFocus={() => setFocused('province')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.province && <Text className="mt-1 text-[11px] text-red-600">{errors.province}</Text>}
          </View>
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-gray-700">ZIP Code</Text>
              <Text className="text-[11px] text-gray-400">Optional</Text>
            </View>
            <TextInput
              className={inputClassName('zipCode')}
              placeholder="1100"
              placeholderTextColor="#bbb"
              value={form.zipCode}
              onChangeText={(v) => handleChange('zipCode', v)}
              onFocus={() => setFocused('zipCode')}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
            />
          </View>

          <View className="flex-1">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Country</Text>
            <TextInput
              className={inputClassName('country')}
              placeholder="Philippines"
              placeholderTextColor="#bbb"
              value={form.country}
              onChangeText={(v) => handleChange('country', v)}
              onFocus={() => setFocused('country')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.country && <Text className="mt-1 text-[11px] text-red-600">{errors.country}</Text>}
          </View>
        </View>

        <View className="mb-4">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[13px] font-semibold text-gray-700">Landmark</Text>
            <Text className="text-[11px] text-gray-400">Optional</Text>
          </View>
          <TextInput
            className={inputClassName('landmark')}
            placeholder="Near the main gate"
            placeholderTextColor="#bbb"
            value={form.landmark}
            onChangeText={(v) => handleChange('landmark', v)}
            onFocus={() => setFocused('landmark')}
            onBlur={() => setFocused(null)}
            autoCapitalize="sentences"
          />
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-gray-700">Latitude</Text>
              <Text className="text-[11px] text-gray-400">Optional</Text>
            </View>
            <TextInput
              className={inputClassName('lat')}
              placeholder="14.5995"
              placeholderTextColor="#bbb"
              value={form.coordinates.lat}
              onChangeText={(v) => handleChange('lat', v)}
              onFocus={() => setFocused('lat')}
              onBlur={() => setFocused(null)}
              keyboardType="decimal-pad"
            />
            {errors.lat && <Text className="mt-1 text-[11px] text-red-600">{errors.lat}</Text>}
          </View>

          <View className="flex-1">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-gray-700">Longitude</Text>
              <Text className="text-[11px] text-gray-400">Optional</Text>
            </View>
            <TextInput
              className={inputClassName('lng')}
              placeholder="120.9842"
              placeholderTextColor="#bbb"
              value={form.coordinates.lng}
              onChangeText={(v) => handleChange('lng', v)}
              onFocus={() => setFocused('lng')}
              onBlur={() => setFocused(null)}
              keyboardType="decimal-pad"
            />
            {errors.lng && <Text className="mt-1 text-[11px] text-red-600">{errors.lng}</Text>}
          </View>
        </View>

        <TouchableOpacity
          className={`mt-2 items-center rounded-xl bg-[#e13e00] py-[15px] ${
            saveAddressDetails.isPending ? 'opacity-[0.65]' : ''
          }`}
          onPress={handleProceed}
          activeOpacity={0.85}
          disabled={saveAddressDetails.isPending}>
          <Text className="text-[15px] font-bold text-white">
            {saveAddressDetails.isPending ? 'Saving...' : 'Review Order'}
          </Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddressDetails;
