import { Truck, Store, UtensilsCrossed } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { FULFILLMENT_TYPE, FulfillmentType } from '@/types/orders.type';

const options: { value: FulfillmentType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: FULFILLMENT_TYPE.DELIVERY,
    label: 'Delivery',
    description: 'Send the order to your pinned address.',
    icon: <Truck size={17} color="#fff" />,
  },
  {
    value: FULFILLMENT_TYPE.PICKUP,
    label: 'Pickup',
    description: 'Collect the order from the selected branch.',
    icon: <Store size={17} color="#fff" />,
  },
  {
    value: FULFILLMENT_TYPE.DINE_IN,
    label: 'Reserve a Table',
    description: 'Pre-order and book a table for your visit.',
    icon: <UtensilsCrossed size={17} color="#fff" />,
  },
];

export function FulfillmentSelector({
  value,
  onChange,
}: {
  value: FulfillmentType;
  onChange: (value: FulfillmentType) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.7}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center justify-center rounded-lg border py-3 ${
              isSelected ? 'border-[#e13e00] bg-[#e13e00]' : 'border-gray-200 bg-white'
            }`}>
            <View className="mb-1">
              {isSelected ? (
                option.value === FULFILLMENT_TYPE.DELIVERY ? <Truck size={18} color="#fff" /> :
                option.value === FULFILLMENT_TYPE.PICKUP ? <Store size={18} color="#fff" /> :
                <UtensilsCrossed size={18} color="#fff" />
              ) : (
                option.value === FULFILLMENT_TYPE.DELIVERY ? <Truck size={18} color="#6b7280" /> :
                option.value === FULFILLMENT_TYPE.PICKUP ? <Store size={18} color="#6b7280" /> :
                <UtensilsCrossed size={18} color="#6b7280" />
              )}
            </View>
            <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
