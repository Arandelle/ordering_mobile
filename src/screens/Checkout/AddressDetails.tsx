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
import {
  CheckoutAddressDetails,
  emptyAddressDetails,
  useCheckoutDraft,
} from '@/hooks/useCheckout';
import CheckoutStepper from './CheckoutStepper';
import CheckoutTextField from './CheckoutTextField';

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

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="px-5 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
          
        <CheckoutStepper currentStep={2} />

        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-1 text-xl font-bold text-gray-950">Address Details</Text>
          <Text className="mb-5 text-[13px] text-gray-500">Where should we deliver your order?</Text>

          <CheckoutTextField
            label="Address Line 1"
            placeholder="House number, street, barangay"
            value={form.line1}
            onChangeText={(v) => handleChange('line1', v)}
            autoCapitalize="words"
            error={errors.line1}
          />

          <CheckoutTextField
            label="Address Line 2"
            optional
            placeholder="Unit, floor, building"
            value={form.line2}
            onChangeText={(v) => handleChange('line2', v)}
            autoCapitalize="words"
          />

          <View className="flex-row gap-3">
            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="City"
              placeholder="Quezon City"
              value={form.city}
              onChangeText={(v) => handleChange('city', v)}
              autoCapitalize="words"
              error={errors.city}
            />

            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Province"
              placeholder="Metro Manila"
              value={form.province}
              onChangeText={(v) => handleChange('province', v)}
              autoCapitalize="words"
              error={errors.province}
            />
          </View>

          <View className="flex-row gap-3">
            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="ZIP Code"
              optional
              placeholder="1100"
              value={form.zipCode}
              onChangeText={(v) => handleChange('zipCode', v)}
              keyboardType="number-pad"
            />

            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Country"
              placeholder="Philippines"
              value={form.country}
              onChangeText={(v) => handleChange('country', v)}
              autoCapitalize="words"
              error={errors.country}
            />
          </View>

          <CheckoutTextField
            label="Landmark"
            optional
            placeholder="Near the main gate"
            value={form.landmark}
            onChangeText={(v) => handleChange('landmark', v)}
            autoCapitalize="sentences"
          />

          <View className="flex-row gap-3">
            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Latitude"
              optional
              placeholder="14.5995"
              value={form.coordinates.lat}
              onChangeText={(v) => handleChange('lat', v)}
              keyboardType="decimal-pad"
              error={errors.lat}
            />

            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Longitude"
              optional
              placeholder="120.9842"
              value={form.coordinates.lng}
              onChangeText={(v) => handleChange('lng', v)}
              keyboardType="decimal-pad"
              error={errors.lng}
            />
          </View>

          <TouchableOpacity
            className={`mt-2 items-center rounded-2xl bg-[#e13e00] py-[15px] ${
              saveAddressDetails.isPending ? 'opacity-[0.65]' : ''
            }`}
            onPress={handleProceed}
            activeOpacity={0.85}
            disabled={saveAddressDetails.isPending}>
            <Text className="text-[15px] font-bold text-white">
              {saveAddressDetails.isPending ? 'Saving...' : 'Review Order'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddressDetails;
