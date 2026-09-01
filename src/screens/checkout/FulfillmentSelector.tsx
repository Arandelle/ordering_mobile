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
    <View className="gap-3">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.85}
            onPress={() => onChange(option.value)}
            className={`flex-row items-start gap-3 rounded-xl border px-4 py-3 ${
              isSelected ? 'border-[#e13e00] bg-orange-50' : 'border-gray-200 bg-white'
            }`}>
            <View
              className={`mt-0.5 h-9 w-9 items-center justify-center rounded-full ${
                isSelected ? 'bg-[#e13e00]' : 'bg-gray-100'
              }`}>
              {isSelected ? option.icon : (
                option.value === FULFILLMENT_TYPE.DELIVERY ? <Truck size={17} color="#6b7280" /> :
                option.value === FULFILLMENT_TYPE.PICKUP ? <Store size={17} color="#6b7280" /> :
                <UtensilsCrossed size={17} color="#6b7280" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900">{option.label}</Text>
              <Text className="mt-0.5 text-xs leading-5 text-gray-500">{option.description}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
