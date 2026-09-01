import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCheckout } from '@/context/CheckoutContext';
import { authClient } from '@/lib/auth-client';
import { useMyAddress } from '@/hooks/useAddress';
import { FULFILLMENT_TYPE } from '@/types/orders.type';
import CheckoutStepper from './CheckoutStepper';
import { DeliveryLocationPicker } from './DeliveryLocationPicker';
import type { ResolvedDeliveryAddress } from './DeliveryLocationPicker';
import { PsgcAddressFields } from './PsgcAddressFields';
import CheckoutTextField from './CheckoutTextField';

const AddressDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const { data: savedAddress } = useMyAddress(Boolean(session?.user));

  const {
    draft,
    errors,
    setShippingField,
    setShippingCoordinates,
    validateShippingField,
    isReady,
    shouldShowSyncProfileDetails,
    syncProfileDetails,
  } = useCheckout();

  const [mapError, setMapError] = useState<string | undefined>();

  const isDelivery = draft.fulfillmentType === FULFILLMENT_TYPE.DELIVERY;

  // If not delivery, skip to review
  useEffect(() => {
    if (isReady && !isDelivery) {
      router.replace('/checkout/review');
    }
  }, [isReady, isDelivery]);

  const handleAddressResolved = (address: ResolvedDeliveryAddress & { cityCode?: string; barangayCode?: string }) => {
    // Auto-fill text fields from reverse geocoding
    if (address.road) setShippingField('line1', address.road);
    if (address.line2) setShippingField('line2', address.line2);
    if (address.city) setShippingField('city', address.city);
    if (address.province) setShippingField('province', address.province);
    if (address.zipCode) setShippingField('zipCode', address.zipCode);
    // PSGC codes
    if (address.cityCode) setShippingField('cityCode', address.cityCode);
    if (address.barangayCode) setShippingField('barangayCode', address.barangayCode);
  };

  const handleProceed = () => {
    const fieldErrors = [
      validateShippingField('line1', draft.shippingAddress.line1),
      validateShippingField('city', draft.shippingAddress.city),
      validateShippingField('province', draft.shippingAddress.province),
    ];

    if (fieldErrors.some(Boolean)) {
      Alert.alert('Missing details', 'Please fill in all required address fields.');
      return;
    }

    router.push('/checkout/review');
  };

  if (!isReady || !isDelivery) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-sm text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        contentContainerClassName="px-5 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <CheckoutStepper currentStep={2} />

        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-1 text-xl font-bold text-gray-950">Delivery Address</Text>
          <Text className="mb-5 text-[13px] text-gray-500">
            Where should we deliver your order?
          </Text>

          {/* Sync from profile */}
          {shouldShowSyncProfileDetails && (
            <TouchableOpacity
              className="mb-3 self-end rounded-lg border border-gray-200 bg-white px-3 py-1.5"
              onPress={syncProfileDetails}>
              <Text className="text-xs font-bold text-[#e13e00]">Sync from profile</Text>
            </TouchableOpacity>
          )}

          {/* Map-based delivery location picker */}
          <DeliveryLocationPicker
            value={draft.shippingAddress.coordinates}
            addressQuery={draft.shippingAddress.line1 ? `${draft.shippingAddress.line1}, ${draft.shippingAddress.city}` : ''}
            onChange={setShippingCoordinates}
            onAddressResolved={handleAddressResolved}
            error={mapError}
          />

          <View className="my-4 h-px bg-gray-100" />

          <Text className="mb-3 text-sm font-bold text-gray-900">Delivery Address</Text>

          <CheckoutTextField
            label="Address Line 1"
            placeholder="House number, street"
            value={draft.shippingAddress.line1}
            onChangeText={(v) => setShippingField('line1', v)}
            autoCapitalize="words"
            error={errors.shipping.line1}
          />

          <CheckoutTextField
            label="Address Line 2 (optional)"
            placeholder="Unit, floor, building"
            value={draft.shippingAddress.line2}
            onChangeText={(v) => setShippingField('line2', v)}
            autoCapitalize="words"
          />

          {/* Cascading PSGC address selects: Region → City → (Manila Area) → Barangay */}
          <PsgcAddressFields />

          <View className="flex-row gap-3">
            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="ZIP Code (optional)"
              placeholder="1100"
              value={draft.shippingAddress.zipCode}
              onChangeText={(v) => setShippingField('zipCode', v)}
              keyboardType="number-pad"
            />

            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Country"
              placeholder="Philippines"
              value={draft.shippingAddress.country}
              onChangeText={(v) => setShippingField('country', v)}
              autoCapitalize="words"
              error={errors.shipping.country}
            />
          </View>

          <CheckoutTextField
            label="Landmark (optional)"
            placeholder="Near the main gate"
            value={draft.shippingAddress.landmark}
            onChangeText={(v) => setShippingField('landmark', v)}
            autoCapitalize="sentences"
          />

          <TouchableOpacity
            className="mt-4 items-center rounded-2xl bg-[#e13e00] py-[15px]"
            onPress={handleProceed}
            activeOpacity={0.85}>
            <Text className="text-[15px] font-bold text-white">Review Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddressDetails;
