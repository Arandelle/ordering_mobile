import { Button } from '@/components/ui/Button';
import DynamicImage from '@/components/ui/DynamicImage';
import { Icon } from '@/components/ui/Icon';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/menu-types';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { ModifierSummary } from './ModifierSummary';
import { formatMoney } from '@/helper/formatter';
import { QuantityStepper } from '@/components/ui/QuantityStepper';

const SWIPE_THRESHOLD = 80;

export function CartItemCard({
  item,
  isSelected,
  onToggleSelect,
  onSwipeOpen,
  onRemove,
  isLast,
}: {
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSwipeOpen: (close: () => void) => void;
  onRemove: (item: CartItem) => void;
  isLast: boolean;
}) {
  const { updateQuantity } = useCart();
  const swipeableRef = useRef<SwipeableMethods>(null);

  const renderRightAction = () => {
    return (
      <View
        className="ml-2 flex-row items-center justify-center rounded-2xl bg-red-500"
        style={{ width: SWIPE_THRESHOLD }}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-red-600">
          <Icon name="Trash" size={20} color="#fff" />
        </View>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: isLast ? 0 : 8 }}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderRightAction}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            onSwipeOpen(() => swipeableRef.current?.close());
            onRemove(item);
          }
        }}>
        <View className="mx-3 overflow-hidden rounded-2xl bg-white shadow-sm">
          <View className="flex-row p-3">
            {/* Checkbox */}
            <View className="mr-2.5 pt-0.5">
              <Button
                onPress={onToggleSelect}
                variant={isSelected ? 'primary' : 'outline'}
                className="h-6 w-6 rounded-lg p-0"
                icon={{ name: isSelected ? 'Check' : '', size: 12 }}
              />
            </View>

            {/* Image */}
            <DynamicImage
              src={item.image}
              variant="product"
              alt={item.name}
              containerClassName="h-20 w-20 rounded-xl"
            />

            {/* Details */}
            <View className="ml-3 flex-1 justify-between">
              <View>
                <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-400">{formatMoney(item.price)} each</Text>
              </View>

              {item.modifierSelections && item.modifierSelections.length > 0 && (
                <View className="mt-1.5">
                  <ModifierSummary modifiers={item.modifierSelections} />
                </View>
              )}

              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-base font-bold text-brand-500">
                  {formatMoney(item.price * item.quantity)}
                </Text>
                <QuantityStepper
                  value={item.quantity}
                  min={1}
                  variant="compact"
                  onDecrement={() => updateQuantity(item._id, item.quantity - 1)}
                  onIncrement={() => updateQuantity(item._id, item.quantity + 1)}
                />
              </View>
            </View>
          </View>
        </View>
      </ReanimatedSwipeable>
    </View>
  );
}
