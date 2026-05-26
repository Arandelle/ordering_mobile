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

function formatMoney(value: number) {
  return `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function display(value?: string) {
  return value?.trim() ? value : 'Not provided';
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-[7px]">
      <Text className="w-[104px] text-[13px] text-gray-500">{label}</Text>
      <Text className="flex-1 text-right text-[13px] font-semibold text-gray-800">{value}</Text>
    </View>
  );
}

const ReviewOrder = () => {
  const router = useRouter();
  const { draft } = useCheckoutDraft();
  const submitCheckout = useSubmitCheckout();
  const { cartItems, totalItems, vatableSales, vatAmount, totalPrice } = useCart();

  const personal = draft?.personalDetails;
  const address = draft?.shippingAddress;

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
      className="flex-1 bg-white"
      contentContainerClassName="px-5 pt-6"
      showsVerticalScrollIndicator={false}>
      <View className="mb-7 flex-row items-center">
        {['Details', 'Address', 'Review'].map((step, i) => (
          <View key={step} className="flex-1 flex-row items-center">
            <View className="items-center gap-1">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-[#e13e00]">
                <Text className="text-xs font-semibold text-white">{i + 1}</Text>
              </View>
              <Text className="text-[11px] font-semibold text-[#e13e00]">{step}</Text>
            </View>
            {i < 2 && <View className="mb-3.5 h-[1.5px] flex-1 bg-[#e13e00]" />}
          </View>
        ))}
      </View>

      <Text className="mb-1 text-xl font-bold text-gray-950">Final Review</Text>
      <Text className="mb-6 text-[13px] text-gray-500">
        Check the details before submitting your order
      </Text>

      <View className="mb-3.5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <View className="mb-2.5 flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-gray-950">Personal Details</Text>
          <TouchableOpacity onPress={() => router.push('/checkout')}>
            <Text className="text-[13px] font-bold text-[#e13e00]">Edit</Text>
          </TouchableOpacity>
        </View>

        <ReviewRow
          label="Name"
          value={display(
            personal ? `${personal.firstName} ${personal.lastName}`.trim() : undefined
          )}
        />
        <ReviewRow label="Email" value={display(personal?.email)} />
        <ReviewRow label="Phone" value={display(personal?.phone)} />
        <ReviewRow label="Note" value={display(personal?.note)} />
      </View>

      <View className="mb-3.5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <View className="mb-2.5 flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-gray-950">Shipping Address</Text>
          <TouchableOpacity onPress={() => router.push('/checkout/address')}>
            <Text className="text-[13px] font-bold text-[#e13e00]">Edit</Text>
          </TouchableOpacity>
        </View>

        <ReviewRow label="Line 1" value={display(address?.line1)} />
        <ReviewRow label="Line 2" value={display(address?.line2)} />
        <ReviewRow label="City" value={display(address?.city)} />
        <ReviewRow label="Province" value={display(address?.province)} />
        <ReviewRow label="ZIP Code" value={display(address?.zipCode)} />
        <ReviewRow label="Country" value={display(address?.country)} />
        <ReviewRow label="Landmark" value={display(address?.landmark)} />
        <ReviewRow
          label="Coordinates"
          value={
            address?.coordinates.lat || address?.coordinates.lng
              ? `${display(address.coordinates.lat)}, ${display(address.coordinates.lng)}`
              : 'Not provided'
          }
        />
      </View>

      <View className="mb-3.5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Text className="text-[15px] font-bold text-gray-950">Items Summary</Text>

        <View className="mt-2.5 gap-3">
          {cartItems.map((item) => (
            <View key={String(item._id)} className="flex-row justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-950" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  {item.quantity} x {formatMoney(item.price)}
                </Text>
              </View>
              <Text className="text-sm font-bold text-gray-950">
                {formatMoney(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View className="my-3.5 h-px bg-gray-100" />

        <ReviewRow label="Items" value={String(totalItems)} />
        <ReviewRow label="Vatable Sales" value={formatMoney(vatableSales)} />
        <ReviewRow label="VAT (12%)" value={formatMoney(vatAmount)} />
        <View className="flex-row items-center justify-between pt-2">
          <Text className="text-base font-extrabold text-gray-950">Total</Text>
          <Text className="text-lg font-extrabold text-[#e13e00]">{formatMoney(totalPrice)}</Text>
        </View>
      </View>

      <TouchableOpacity
        className={`mt-1 items-center rounded-xl bg-[#e13e00] py-[15px] ${
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
