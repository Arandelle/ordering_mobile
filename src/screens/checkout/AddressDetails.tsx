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
import { Ionicons } from '@expo/vector-icons';
import { useCheckout } from '@/context/CheckoutContext';
import { authClient } from '@/lib/auth-client';
import { useBranchContext } from '@/context/BranchContext';
import { useDeliveryFeeEstimate } from '@/hooks/useOrders';
import { FULFILLMENT_TYPE } from '@/types/orders.type';
import CheckoutStepper from './CheckoutStepper';
import { DeliveryLocationPicker } from './DeliveryLocationPicker';
import type { ResolvedDeliveryAddress } from './DeliveryLocationPicker';
import { PsgcAddressFields } from './PsgcAddressFields';
import CheckoutTextField from './CheckoutTextField';
import { Button } from '@/components/ui/Button';

const AddressDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedBranch } = useBranchContext();
  const { data: session } = authClient.useSession();

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

  // Delivery fee estimate — shown early so user sees issues before proceeding
  const deliveryCoords = draft.shippingAddress.coordinates;
  const { data: deliveryEstimate, isLoading: isLoadingDeliveryFee } = useDeliveryFeeEstimate(
    isDelivery && deliveryCoords && selectedBranch?._id
      ? {
          branchId: selectedBranch._id,
          lat: deliveryCoords.lat,
          lng: deliveryCoords.lng,
          customerBarangayCode: draft.shippingAddress.barangayCode || undefined,
        }
      : null,
  );

  // If not delivery, skip to review
  useEffect(() => {
    if (isReady && !isDelivery) {
      router.replace('/checkout/review');
    }
  }, [isReady, isDelivery]);

  const handleAddressResolved = (address: ResolvedDeliveryAddress & { cityCode?: string; barangayCode?: string }) => {
    // Auto-fill text fields from reverse geocoding
    if (address.road) setShippingField('line1', address.road);
    // Do NOT set line2 from reverse geocode — the PSGC barangay dropdown owns line2.
    // The reverse-geocoded line2 (neighbourhood/village) is used only as a hint
    // for the PSGC dropdown to auto-select the matching barangay.
    if (address.city) setShippingField('city', address.city);
    if (address.province) setShippingField('province', address.province);
    if (address.zipCode) setShippingField('zipCode', address.zipCode);
    // PSGC codes
    if (address.cityCode) setShippingField('cityCode', address.cityCode);
    if (address.barangayCode) setShippingField('barangayCode', address.barangayCode);
    // Sub-municipality (Manila areas)
    if (address.subMunicipality) setShippingField('subMunicipality', address.subMunicipality);
  };

  const handleProceed = () => {
    // Validate required address fields
    const fieldErrors = [
      validateShippingField('line1', draft.shippingAddress.line1),
      validateShippingField('city', draft.shippingAddress.city),
      validateShippingField('province', draft.shippingAddress.province),
    ];

    if (fieldErrors.some(Boolean)) {
      Alert.alert('Missing details', 'Please fill in all required address fields.');
      return;
    }

    // Check coordinates are pinned
    if (!draft.shippingAddress.coordinates) {
      Alert.alert('Missing location', 'Please pin your delivery location on the map.');
      return;
    }

    // Check delivery availability
    if (deliveryEstimate?.deliveryUnavailable) {
      Alert.alert(
        'Delivery not available',
        deliveryEstimate.freeDeliveryReason || 'Your address is outside our delivery range.',
      );
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

          {/* Delivery estimate status */}
          {deliveryCoords && (
            <View className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
              {isLoadingDeliveryFee ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="hourglass-outline" size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-500">Calculating delivery fee...</Text>
                </View>
              ) : deliveryEstimate ? (
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="location-outline" size={14} color="#6b7280" />
                      <Text className="text-xs font-semibold text-gray-700">Distance</Text>
                    </View>
                    <Text className="text-xs font-semibold text-gray-800">
                      {deliveryEstimate.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold text-gray-700">Delivery fee</Text>
                    {deliveryEstimate.freeDeliveryEligible ? (
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[10px] text-gray-400 line-through">
                          ₱{deliveryEstimate.deliveryFee.toFixed(2)}
                        </Text>
                        <Text className="text-xs font-bold text-green-600">FREE</Text>
                      </View>
                    ) : (
                      <Text className="text-xs font-semibold text-gray-800">
                        ₱{deliveryEstimate.effectiveDeliveryFee.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {deliveryEstimate.deliveryUnavailable && (
                    <View className="flex-row items-start gap-1.5 rounded-lg bg-red-50 px-2 py-1.5">
                      <Ionicons name="alert-circle" size={12} color="#dc2626" />
                      <Text className="flex-1 text-[10px] text-red-600">
                        {deliveryEstimate.freeDeliveryReason || 'Delivery is not available for this address.'}
                      </Text>
                    </View>
                  )}
                  {deliveryEstimate.recommendedBranch && (
                    <View className="flex-row items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5">
                      <Ionicons name="navigate" size={12} color="#d97706" />
                      <Text className="flex-1 text-[10px] text-amber-800">
                        Try {deliveryEstimate.recommendedBranch.name} — {deliveryEstimate.recommendedBranch.distanceKm.toFixed(1)} km away
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          )}

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

          {/* line2 is owned by the PSGC barangay dropdown — no separate text input */}

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
              editable={false}
            />
          </View>

          <CheckoutTextField
            label="Landmark (optional)"
            placeholder="Near the main gate"
            value={draft.shippingAddress.landmark}
            onChangeText={(v) => setShippingField('landmark', v)}
            autoCapitalize="sentences"
          />

          <Button
            className="mt-4"
            text="Review Order"
            onPress={handleProceed}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddressDetails;
