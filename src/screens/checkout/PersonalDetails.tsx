import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { BranchSelector } from '@/components/home/BranchSelector';
import { useCheckout } from '@/context/CheckoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckoutStepper from './CheckoutStepper';
import CheckoutTextField from './CheckoutTextField';
import { FulfillmentSelector } from './FulfillmentSelector';
import { ReservationPicker } from './ReservationPicker';
import { PickupTimePicker } from './PickupTimePicker';
import { useSettings } from '@/hooks/useSettings';
import { FULFILLMENT_TYPE } from '@/types/orders.type';

const PersonalDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const { data: operatingSched } = useSettings();

  const {
    draft,
    errors,
    isReady,
    selectedBranch,
    shouldShowSyncProfileDetails,
    isCodAvailable,
    setFulfillmentType,
    setCustomerField,
    setReservationField,
    setPickupTime,
    syncProfileDetails,
    validateCustomerField,
    validateReservation,
    validatePickupTime,
  } = useCheckout();

  const isDineIn = draft.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;
  const isPickup = draft.fulfillmentType === FULFILLMENT_TYPE.PICKUP;
  const isDelivery = draft.fulfillmentType === FULFILLMENT_TYPE.DELIVERY;

  const handleProceed = () => {
    // Validate customer fields
    const fieldErrors = [
      validateCustomerField('firstName', draft.customer.firstName),
      validateCustomerField('lastName', draft.customer.lastName),
      validateCustomerField('customerEmail', draft.customer.customerEmail),
      validateCustomerField('customerPhone', draft.customer.customerPhone),
    ];

    if (fieldErrors.some(Boolean)) return;

    // Validate conditional fields
    if (isDineIn && !validateReservation()) return;
    if (isPickup && !validatePickupTime()) return;

    // For delivery, go to address step; for pickup/dine-in, skip to review
    if (isDelivery) {
      router.push('/checkout/address');
    } else {
      router.push('/checkout/review');
    }
  };

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-sm text-gray-400">Loading checkout...</Text>
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
        <CheckoutStepper currentStep={1} />

        {/* Branch selector */}
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-3 text-[15px] font-bold text-gray-950">Pickup branch</Text>
          <BranchSelector className="mt-0 px-0" />
        </View>

        {/* Fulfillment type selector */}
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-3 text-[15px] font-bold text-gray-950">Order type</Text>
          <FulfillmentSelector
            value={draft.fulfillmentType}
            onChange={setFulfillmentType}
          />
        </View>

        {/* Customer details */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-1">
            <Text className="text-xl font-bold text-gray-950">Personal Details</Text>
            <Text className="mb-1 text-[13px] text-gray-500">
              We&apos;ll use this to process and contact you about your order.
            </Text>
          </View>

          {/* Sync from profile button */}
          {shouldShowSyncProfileDetails && (
            <TouchableOpacity
              className="mb-3 self-end rounded-lg border border-gray-200 bg-white px-3 py-1.5"
              onPress={syncProfileDetails}>
              <Text className="text-xs font-bold text-[#e13e00]">Sync from profile</Text>
            </TouchableOpacity>
          )}

          {/* Authenticated hint */}
          {session?.user && (
            <Text className="mb-3 text-xs text-gray-400">
              Prefilled from your saved profile.
            </Text>
          )}

          <View className="flex-row gap-3">
            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="First name"
              placeholder="Juan"
              value={draft.customer.firstName}
              onChangeText={(v) => setCustomerField('firstName', v)}
              autoCapitalize="words"
              error={errors.customer.firstName}
            />

            <CheckoutTextField
              fieldClassName="mb-4 flex-1"
              label="Last name"
              placeholder="Dela Cruz"
              value={draft.customer.lastName}
              onChangeText={(v) => setCustomerField('lastName', v)}
              autoCapitalize="words"
              error={errors.customer.lastName}
            />
          </View>

          <CheckoutTextField
            label="Email"
            placeholder="juan@example.com"
            value={draft.customer.customerEmail}
            onChangeText={(v) => setCustomerField('customerEmail', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.customer.customerEmail}
          />

          <CheckoutTextField
            label="Phone number"
            placeholder="+63 912 345 6789"
            value={draft.customer.customerPhone}
            onChangeText={(v) => setCustomerField('customerPhone', v)}
            keyboardType="phone-pad"
            error={errors.customer.customerPhone}
          />

          <CheckoutTextField
            label="Order note (optional)"
            inputClassName="h-[88px] pt-3"
            placeholder="Any special instructions for your order..."
            value={draft.customer.notes}
            onChangeText={(v) => setCustomerField('notes', v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Reservation picker for dine-in */}
          {isDineIn && (
            <ReservationPicker
              scheduledAt={draft.reservation.scheduledAt}
              partySize={draft.reservation.partySize}
              onChangeScheduledAt={(v) => setReservationField('scheduledAt', v)}
              onChangePartySize={(v) => setReservationField('partySize', v)}
              error={errors.reservation.scheduledAt || errors.reservation.partySize}
              operatingHours={operatingSched?.operatingHours}
            />
          )}

          {/* Pickup time picker for pickup */}
          {isPickup && (
            <PickupTimePicker
              value={draft.pickupTime}
              onChange={setPickupTime}
              error={errors.pickupTime ?? undefined}
              operatingHours={operatingSched?.operatingHours}
            />
          )}

          {/* Delivery hint */}
          {isDelivery && (
            <Text className="mt-2 text-xs text-gray-400">
              Delivery address will be collected on the next step.
            </Text>
          )}

          <TouchableOpacity
            className={`mt-4 items-center rounded-2xl bg-[#e13e00] py-[15px]`}
            onPress={handleProceed}
            activeOpacity={0.85}>
            <Text className="text-[15px] font-bold text-white">
              {isDelivery ? 'Proceed to Address' : 'Continue to Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetails;
