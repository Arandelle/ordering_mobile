import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCart } from '@/context/CartContext';
import {
  CheckoutAddressDetails,
  CheckoutSubmitPayload,
  useCheckoutDraft,
  useSubmitCheckout,
} from '@/hooks/useCheckout';
import CheckoutStepper from './CheckoutStepper';

function formatMoney(value: number) {
  return `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function display(value?: string) {
  return value?.trim() ? value.trim() : 'Not provided';
}

function formatAddress(address?: CheckoutAddressDetails) {
  if (!address) return 'Address not provided';

  const streetAddress = [
    address.line1,
    address.line2,
    address.city,
    address.province,
  ]
    .filter((part) => part?.trim())
    .join(' ');

  const postalAddress = [address.zipCode, address.country]
    .filter((part) => part?.trim())
    .join(' ');

  return [streetAddress, postalAddress].filter(Boolean).join(', ');
}

function toSubmitAddress(address?: CheckoutAddressDetails): CheckoutSubmitPayload['shippingAddress'] {
  if (!address) return undefined;

  const lat = Number(address.coordinates.lat);
  const lng = Number(address.coordinates.lng);
  const hasCoordinates = !Number.isNaN(lat) && !Number.isNaN(lng);

  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    province: address.province,
    zipCode: address.zipCode,
    country: address.country || 'Philippines',
    landmark: address.landmark,
    ...(hasCoordinates ? { coordinates: { lat, lng } } : {}),
  };
}

const ReviewOrder = () => {
  const router = useRouter();
  const { draft } = useCheckoutDraft();
  const submitCheckout = useSubmitCheckout();
  const { cartItems, totalItems, vatableSales, vatAmount, totalPrice } = useCart();

  const personal = draft?.personalDetails;
  const address = draft?.shippingAddress;
  const fullName = personal ? `${personal.firstName} ${personal.lastName}`.trim() : '';

  const handleSubmit = async () => {
    const payload: CheckoutSubmitPayload = {
      personalDetails: personal,
      shippingAddress: toSubmitAddress(address),
      items: cartItems,
    };

    await submitCheckout.mutateAsync(payload);
    Alert.alert('Checkout payload ready', 'API submission is currently a placeholder.');
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="px-5 pt-5"
      showsVerticalScrollIndicator={false}>
      <CheckoutStepper currentStep={3} />

      <Text className="mb-1 text-xl font-bold text-gray-950">Review Order</Text>
      <Text className="mb-5 text-[13px] text-gray-500">Confirm your details before submitting.</Text>

      <TouchableOpacity
        className="mb-4 rounded-2xl bg-white p-4 shadow-sm"
        activeOpacity={0.86}
        onPress={() => router.push('/checkout')}>
        <View className="mb-2 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-extrabold text-gray-950">
              {display(fullName)}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-gray-600">
              {display(personal?.email)} - {display(personal?.phone)}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-gray-800">
              {formatAddress(address)}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-bold text-[#e13e00]">Edit</Text>
            <ChevronRight size={16} color="#e13e00" />
          </View>
        </View>

        {!!address?.landmark?.trim() && (
          <Text className="mt-2 text-xs text-gray-500">Landmark: {address.landmark}</Text>
        )}
        {!!personal?.note?.trim() && (
          <Text className="mt-2 text-xs text-gray-500">Note: {personal.note}</Text>
        )}
      </TouchableOpacity>

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
              </View>
              <Text className="text-sm font-extrabold text-gray-950">
                {formatMoney(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>
      </View>

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
        </View>

        <View className="my-3 h-px bg-gray-100" />

        <View className="flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-gray-950">Total</Text>
          <Text className="text-xl font-extrabold text-[#e13e00]">{formatMoney(totalPrice)}</Text>
        </View>
      </View>

      <TouchableOpacity
        className={`items-center rounded-2xl bg-[#e13e00] py-[15px] ${
          submitCheckout.isPending || cartItems.length === 0 ? 'opacity-[0.65]' : ''
        }`}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={submitCheckout.isPending || cartItems.length === 0}>
        <Text className="text-[15px] font-bold text-white">
          {submitCheckout.isPending ? 'Submitting...' : 'Submit Order'}
        </Text>
      </TouchableOpacity>

      <View className="h-8" />
    </ScrollView>
  );
};

export default ReviewOrder;
