import { Banknote, ChevronRight, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBranchContext } from '@/context/BranchContext';
import { useCart } from '@/context/CartContext';
import { BranchSelector } from '@/components/home/BranchSelector';
import { useCheckout } from '@/context/CheckoutContext';
import { CreateOrderPayload, FULFILLMENT_TYPE } from '@/types/orders.type';
import { QuantityStepper } from '@/components/products/QuantityStepper';
import CheckoutStepper from './CheckoutStepper';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { useDeliveryFeeEstimate } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';

function formatMoney(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function display(value?: string) {
  return value?.trim() ? value.trim() : 'Not provided';
}

function formatFulfillment(type: string): string {
  switch (type) {
    case FULFILLMENT_TYPE.DELIVERY: return 'Delivery';
    case FULFILLMENT_TYPE.PICKUP: return 'Pickup';
    case FULFILLMENT_TYPE.DINE_IN: return 'Dine-In';
    default: return type;
  }
}

function getCheckoutErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unable to submit order. Please try again.';
}

function PaymentOption({
  method,
  selected,
  disabled,
  onPress,
}: {
  method: 'cod' | 'maya';
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const isCod = method === 'cod';
  const Icon = isCod ? Banknote : CreditCard;

  return (
    <TouchableOpacity
      className={`flex-1 rounded-2xl border p-4 ${
        selected ? 'border-[#e13e00] bg-orange-50' : 'border-gray-200 bg-white'
      } ${disabled ? 'opacity-40' : ''}`}
      activeOpacity={0.86}
      disabled={disabled}
      onPress={onPress}>
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-white">
        <Icon size={20} color={selected ? '#e13e00' : '#4b5563'} />
      </View>
      <Text className="text-sm font-extrabold text-gray-950">
        {isCod ? 'Cash on Delivery' : 'Maya'}
      </Text>
      <Text className="mt-1 text-xs leading-4 text-gray-500">
        {isCod ? 'Pay when your order arrives.' : 'Pay online through Maya checkout.'}
      </Text>
    </TouchableOpacity>
  );
}

const ReviewOrder = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedBranch } = useBranchContext();
  const {
    cartItems,
    totalItems,
    vatableSales,
    vatAmount,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const {
    draft,
    errors,
    isCodAvailable,
    setPaymentMethod,
    submitOrder,
    clearDraftAndState,
    isReady,
  } = useCheckout();

  const paymentMethod = draft.paymentMethod;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const isDelivery = draft.fulfillmentType === FULFILLMENT_TYPE.DELIVERY;
  const isDineIn = draft.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;
  const isPickup = draft.fulfillmentType === FULFILLMENT_TYPE.PICKUP;

  // Delivery fee estimate
  const deliveryCoords = draft.shippingAddress.coordinates;
  const { data: deliveryEstimate, isLoading: isLoadingDeliveryFee } = useDeliveryFeeEstimate(
    isDelivery && deliveryCoords && selectedBranch?._id
      ? {
          branchId: selectedBranch._id,
          lat: deliveryCoords.lat,
          lng: deliveryCoords.lng,
          customerBarangayCode: draft.shippingAddress.barangayCode || undefined,
          itemSubtotalAmount: vatableSales,
        }
      : null,
  );

  // Effective COD availability
  const effectiveCodAvailable = isCodAvailable && isDelivery;

  // Ensure payment method defaults to maya if COD not available
  if (!effectiveCodAvailable && paymentMethod === 'cod') {
    setPaymentMethod('maya');
  }

  const buildPayload = (): CreateOrderPayload => {
    const base: CreateOrderPayload = {
      branchId: selectedBranch?._id ?? '',
      fulfillmentType: draft.fulfillmentType,
      firstName: draft.customer.firstName.trim(),
      lastName: draft.customer.lastName.trim(),
      customerEmail: draft.customer.customerEmail.trim(),
      customerPhone: draft.customer.customerPhone.trim(),
      notes: draft.customer.notes.trim() || undefined,
      paymentMethod,
      items: cartItems.map((item) => ({
        _id: String(item._id),
        quantity: item.quantity,
      })),
    };

    if (isDelivery) {
      base.shippingAddress = {
        line1: draft.shippingAddress.line1,
        line2: draft.shippingAddress.line2 || undefined,
        city: draft.shippingAddress.city,
        province: draft.shippingAddress.province,
        zipCode: draft.shippingAddress.zipCode,
        country: 'Philippines',
        landmark: draft.shippingAddress.landmark || undefined,
      };
    }

    if (isDineIn) {
      base.reservation = {
        scheduledAt: draft.reservation.scheduledAt,
        partySize: draft.reservation.partySize,
      };
    }

    if (isPickup) {
      base.pickupTime = draft.pickupTime;
    }

    return base;
  };

  const handleConfirmOrder = () => {
    setShowConfirmModal(true);
  };

  const handlePlaceOrder = async () => {
    // Double-check validation at submit time
    if (!canPlaceOrder) {
      Alert.alert('Cannot place order', 'Please complete all required fields.');
      return;
    }

    if (!selectedBranch?._id) {
      Alert.alert('Branch required', 'Please select a branch before checkout.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty cart', 'Please add items before checkout.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const payload = buildPayload();
      const response = await submitOrder(payload);

      await clearCart();
      await clearDraftAndState();

      if (paymentMethod === 'maya') {
        if (!response.redirectUrl) {
          Alert.alert(
            'Payment link missing',
            'Order was created but no Maya payment link was returned.'
          );
          return;
        }

        await WebBrowser.openBrowserAsync(response.redirectUrl);
        router.replace('/orders');
      } else {
        Alert.alert('Order placed', `Reference number: ${response.referenceNumber}`, [
          { text: 'View orders', onPress: () => router.replace('/orders') },
        ]);
      }
    } catch (error) {
      Alert.alert('Checkout failed', getCheckoutErrorMessage(error));
    } finally {
      setIsPlacingOrder(false);
      setShowConfirmModal(false);
    }
  };

  const fullName = `${draft.customer.firstName} ${draft.customer.lastName}`.trim();

  // Can place order — no validation errors, branch selected, cart not empty
  const hasCustomerErrors = Object.keys(errors.customer).length > 0;
  const hasShippingErrors = isDelivery && Object.keys(errors.shipping).length > 0;
  const hasReservationErrors = isDineIn && Object.keys(errors.reservation).length > 0;
  const hasPickupError = isPickup && !!errors.pickupTime;
  const deliveryBlocked = isDelivery && deliveryEstimate?.deliveryUnavailable === true;
  const deliveryLoading = isDelivery && isLoadingDeliveryFee;
  const deliveryNotFetched = isDelivery && !deliveryCoords;

  const canPlaceOrder =
    cartItems.length > 0 &&
    !!selectedBranch?._id &&
    !hasCustomerErrors &&
    !hasShippingErrors &&
    !hasReservationErrors &&
    !hasPickupError &&
    !deliveryBlocked &&
    !deliveryLoading &&
    !deliveryNotFetched;

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-sm text-gray-400">Loading review...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      contentContainerClassName="px-5 pt-5"
      showsVerticalScrollIndicator={false}>
      <CheckoutStepper currentStep={isDelivery ? 3 : 2} />

      <Text className="mb-1 text-xl font-bold text-gray-950">Review Order</Text>
      <Text className="mb-5 text-[13px] text-gray-500">
        Confirm your details before submitting.
      </Text>

      {/* Branch + Fulfillment type */}
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-gray-950">Branch</Text>
          <View className="rounded-full bg-orange-100 px-2.5 py-0.5">
            <Text className="text-[10px] font-bold text-orange-600">
              {formatFulfillment(draft.fulfillmentType)}
            </Text>
          </View>
        </View>
        <BranchSelector className="mt-0 px-0" />
        {!!selectedBranch?.address && (
          <Text className="mt-2 text-xs leading-4 text-gray-500">
            {selectedBranch.address?.city} {selectedBranch.address?.province}
          </Text>
        )}
      </View>

      {/* Summary card (editable) */}
      <TouchableOpacity
        className="mb-4 rounded-2xl bg-white p-4 shadow-sm"
        activeOpacity={0.86}
        onPress={() => router.push('/checkout')}>
        <View className="mb-2 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-extrabold text-gray-950">{display(fullName)}</Text>
            <Text className="mt-1 text-sm leading-5 text-gray-600">
              {display(draft.customer.customerEmail)} - {display(draft.customer.customerPhone)}
            </Text>

            {isDelivery && draft.shippingAddress.line1 && (
              <Text className="mt-2 text-sm leading-5 text-gray-800">
                {[
                  draft.shippingAddress.line1,
                  draft.shippingAddress.line2,
                  draft.shippingAddress.city,
                  draft.shippingAddress.province,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            )}

            {isDineIn && (
              <Text className="mt-2 text-sm text-gray-700">
                Reservation: {new Date(draft.reservation.scheduledAt).toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
                {' · '}{draft.reservation.partySize} guest{draft.reservation.partySize !== 1 ? 's' : ''}
              </Text>
            )}

            {isPickup && (
              <Text className="mt-2 text-sm text-gray-700">
                Pickup: {new Date(draft.pickupTime).toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-bold text-[#e13e00]">Edit</Text>
            <ChevronRight size={16} color="#e13e00" />
          </View>
        </View>

        {!!draft.shippingAddress.landmark?.trim() && (
          <Text className="mt-2 text-xs text-gray-500">Landmark: {draft.shippingAddress.landmark}</Text>
        )}
        {!!draft.customer.notes?.trim() && (
          <Text className="mt-2 text-xs text-gray-500">Note: {draft.customer.notes}</Text>
        )}
      </TouchableOpacity>

      {/* Items */}
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-gray-950">Items</Text>
          <Text className="text-xs font-semibold text-gray-500">{totalItems} total</Text>
        </View>

        <View className="gap-3">
          {cartItems.map((item) => (
            <View key={String(item._id)} className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-950" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  {item.quantity} x {formatMoney(item.price)}
                </Text>
                <TouchableOpacity
                  className="mt-2 self-start"
                  activeOpacity={0.8}
                  onPress={() => removeFromCart(item._id)}>
                  <Text className="text-xs font-bold text-red-600">Remove</Text>
                </TouchableOpacity>
              </View>
              <View className="items-end gap-2">
                <QuantityStepper
                  value={item.quantity}
                  onDecrement={() => updateQuantity(item._id, item.quantity - 1)}
                  onIncrement={() => updateQuantity(item._id, item.quantity + 1)}
                />
                <Text className="text-sm font-extrabold text-gray-950">
                  {formatMoney(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Payment method */}
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="mb-3 text-[15px] font-bold text-gray-950">Payment method</Text>

        <View className="flex-row gap-3">
          <PaymentOption
            method="cod"
            selected={paymentMethod === 'cod'}
            disabled={!effectiveCodAvailable}
            onPress={() => setPaymentMethod('cod')}
          />
          <PaymentOption
            method="maya"
            selected={paymentMethod === 'maya'}
            disabled={false}
            onPress={() => setPaymentMethod('maya')}
          />
        </View>

        {!effectiveCodAvailable && isDelivery && (
          <Text className="mt-2 text-xs text-gray-400">
            COD is not available for this branch. Maya payment only.
          </Text>
        )}
      </View>

      {/* Order total */}
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="mb-3 text-[15px] font-bold text-gray-950">Order total</Text>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">Vatable sales</Text>
            <Text className="text-sm font-semibold text-gray-800">{formatMoney(vatableSales)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">VAT 12%</Text>
            <Text className="text-sm font-semibold text-gray-800">{formatMoney(vatAmount)}</Text>
          </View>

          {isDelivery && (
            <>
              {isLoadingDeliveryFee ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-500">Delivery fee</Text>
                  <Text className="text-sm text-gray-400">Calculating...</Text>
                </View>
              ) : deliveryEstimate ? (
                <>
                  {/* Distance + billable km */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="location-outline" size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-500">Distance</Text>
                    </View>
                    <Text className="text-sm font-semibold text-gray-800">
                      {deliveryEstimate.distanceKm.toFixed(1)} km
                      {deliveryEstimate.billableKm !== Math.round(deliveryEstimate.distanceKm) && (
                        <Text className="text-xs text-gray-400">
                          {' '}({deliveryEstimate.billableKm} km billed)
                        </Text>
                      )}
                    </Text>
                  </View>

                  {/* Delivery fee */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-500">Delivery fee</Text>
                    {deliveryEstimate.freeDeliveryEligible ? (
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-gray-400 line-through">
                          {formatMoney(deliveryEstimate.deliveryFee)}
                        </Text>
                        <Text className="text-sm font-bold text-green-600">FREE</Text>
                      </View>
                    ) : (
                      <Text className="text-sm font-semibold text-gray-800">
                        {formatMoney(deliveryEstimate.effectiveDeliveryFee)}
                      </Text>
                    )}
                  </View>

                  {/* Free delivery reason */}
                  {deliveryEstimate.freeDeliveryEligible && deliveryEstimate.freeDeliveryReason && (
                    <View className="flex-row items-start gap-1.5 rounded-lg bg-green-50 px-3 py-2">
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                      <Text className="flex-1 text-xs text-green-700">
                        {deliveryEstimate.freeDeliveryReason}
                      </Text>
                    </View>
                  )}

                  {/* Free delivery not eligible — show upsell hint */}
                  {!deliveryEstimate.freeDeliveryEligible && deliveryEstimate.freeDeliveryReason && (
                    <View className="flex-row items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2">
                      <Ionicons name="information-circle" size={14} color="#d97706" />
                      <Text className="flex-1 text-xs text-amber-800">
                        {deliveryEstimate.freeDeliveryReason}
                      </Text>
                    </View>
                  )}

                  {/* Delivery unavailable warning */}
                  {deliveryEstimate.deliveryUnavailable && (
                    <View className="flex-row items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                      <Ionicons name="alert-circle" size={14} color="#dc2626" />
                      <Text className="flex-1 text-xs text-red-600">
                        Delivery is not available for this address.
                      </Text>
                    </View>
                  )}

                  {/* Recommended branch */}
                  {deliveryEstimate.recommendedBranch && (
                    <View className="flex-row items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2">
                      <Ionicons name="navigate" size={14} color="#d97706" />
                      <Text className="flex-1 text-xs text-amber-800">
                        Try {deliveryEstimate.recommendedBranch.name} —{' '}
                        {deliveryEstimate.recommendedBranch.distanceKm.toFixed(1)} km away
                      </Text>
                    </View>
                  )}
                </>
              ) : null}
            </>
          )}
        </View>

        <View className="my-3 h-px bg-gray-100" />

        <View className="flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-gray-950">Total</Text>
          <Text className="text-xl font-extrabold text-[#e13e00]">{formatMoney(totalPrice)}</Text>
        </View>
      </View>

      {/* Validation errors banner */}
      {!canPlaceOrder && (
        <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text className="text-sm font-bold text-red-700">Please fix the following:</Text>
          </View>
          <View className="gap-1">
            {Object.values(errors.customer).map((err, i) =>
              err ? <Text key={`c-${i}`} className="text-xs text-red-600">• {err}</Text> : null,
            )}
            {Object.values(errors.shipping).map((err, i) =>
              err ? <Text key={`s-${i}`} className="text-xs text-red-600">• {err}</Text> : null,
            )}
            {Object.values(errors.reservation).map((err, i) =>
              err ? <Text key={`r-${i}`} className="text-xs text-red-600">• {err}</Text> : null,
            )}
            {errors.pickupTime && (
              <Text className="text-xs text-red-600">• {errors.pickupTime}</Text>
            )}
            {!selectedBranch?._id && (
              <Text className="text-xs text-red-600">• Please select a branch</Text>
            )}
            {cartItems.length === 0 && (
              <Text className="text-xs text-red-600">• Your cart is empty</Text>
            )}
            {deliveryBlocked && (
              <Text className="text-xs text-red-600">• Delivery is not available for this address</Text>
            )}
            {deliveryLoading && isDelivery && (
              <Text className="text-xs text-red-600">• Calculating delivery fee...</Text>
            )}
            {deliveryNotFetched && isDelivery && (
              <Text className="text-xs text-red-600">• Please pin your delivery location first</Text>
            )}
          </View>
        </View>
      )}

      {/* Place Order button */}
      <Button
        className={canPlaceOrder ? '' : 'opacity-40'}
        text={
          deliveryNotFetched
            ? 'Pin delivery location first'
            : deliveryLoading
              ? 'Calculating delivery fee...'
              : deliveryBlocked
                ? 'Delivery not available'
                : !canPlaceOrder
                  ? 'Complete required fields'
                  : paymentMethod === 'maya'
                    ? 'Proceed to Maya'
                    : 'Place Order'
        }
        onPress={canPlaceOrder ? handleConfirmOrder : undefined}
        disabled={!canPlaceOrder}
        isLoading={isPlacingOrder}
        loadingText="Placing Order..."
      />

      {/* Confirmation modal */}
      <OrderConfirmationModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handlePlaceOrder}
        isPlacingOrder={isPlacingOrder}
        displayTotalPrice={totalPrice}
        selectedPayment={paymentMethod}
      />
    </ScrollView>
  );
};

export default ReviewOrder;
