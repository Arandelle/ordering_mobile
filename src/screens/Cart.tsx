import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { CartItem, ModifierSelection } from '@/types/menu-types';
import BottomSheet from '@/components/BottomSheet';
import { DynamicImage } from '@/components/ui/DynamicImage';
import { formatMoney } from '@/helper/formatter';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';

// Bottom tab bar height — matches tabBarStyle padding in app/(tabs)/_layout.tsx
// tabBarStyle paddingBottom: 8 + Math.max(insets.bottom, 8), paddingTop: 6
// Plus icon size (~24) + label (~10) + marginBottom (2) ≈ 56-64 range
const TAB_BAR_HEIGHT = 72;

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-orange-50">
        <Ionicons name="cart-outline" size={44} color="#e13e00" />
      </View>
      <View className="items-center gap-1">
        <Text className="text-xl font-semibold text-gray-900">Your cart is empty</Text>
        <Text className="text-center text-sm leading-relaxed text-gray-400">
          Add some delicious items to get started!
        </Text>
      </View>
      <Button text="Browse Menu" onPress={() => router.back()} className="mt-2 rounded-2xl px-6" />
    </View>
  );
}

// ─── Modifier Details Bottom Sheet ────────────────────────────────────────────

function ModifierDetailsSheet({
  visible,
  modifiers,
  onClose,
}: {
  visible: boolean;
  modifiers: ModifierSelection[];
  onClose: () => void;
}) {
  const totalModifierPrice = modifiers.reduce((sum, group) => {
    return sum + group.items.reduce((gSum, item) => gSum + item.upgradePrice * item.quantity, 0);
  }, 0);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
        <Text className="text-base font-bold text-gray-900">Customizations</Text>
        <Button
          onPress={onClose}
          variant="ghost"
          className="h-8 w-8 rounded-full bg-gray-100 p-0"
          icon={{ name: 'X', size: 16, color: '#6b7280' }}
        />
      </View>

      <ScrollView className="py-4" nestedScrollEnabled>
        {modifiers.map((group, idx) => (
          <View key={idx} className={idx > 0 ? 'mt-4 border-t border-gray-100 pt-4' : ''}>
            <View className="mb-2 flex-row items-center gap-2">
              <Text className="text-sm font-bold text-gray-900">{group.groupName}</Text>
              {group.required && (
                <View className="rounded-full bg-orange-100 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-orange-600">Required</Text>
                </View>
              )}
            </View>
            {group.items.map((item, iIdx) => (
              <View key={iIdx} className="flex-row items-center justify-between py-2">
                <View className="flex-1 pr-2">
                  <Text className="text-sm text-gray-700">
                    {item.name}
                    {item.quantity > 1 && <Text className="text-gray-400"> ×{item.quantity}</Text>}
                  </Text>
                  {item.label && (
                    <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
                      {item.label}
                    </Text>
                  )}
                </View>
                {item.upgradePrice > 0 && (
                  <Text className="text-sm font-semibold text-gray-900">
                    {formatMoney(item.upgradePrice * item.quantity)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {totalModifierPrice > 0 && (
          <View className="mt-4 border-t border-gray-100 pt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-900">Extra total</Text>
              <Text className="text-sm font-bold text-orange-600">
                +{formatMoney(totalModifierPrice)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

// ─── Modifier Summary Row ─────────────────────────────────────────────────────

function ModifierSummary({ modifiers }: { modifiers: ModifierSelection[] }) {
  const [showModal, setShowModal] = useState(false);

  if (!modifiers || modifiers.length === 0) return null;

  return (
    <>
      <Button
        onPress={() => setShowModal(true)}
        variant="ghost"
        text="See details"
        icon={{ name: 'ChevronRight', position: 'right' }}
        className="flex justify-start px-0 text-brand-500"
        textClassName="text-[#ef4501]"
      />

      <ModifierDetailsSheet
        visible={showModal}
        modifiers={modifiers}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

// ─── Cart Item Card ───────────────────────────────────────────────────────────

function CartItemCard({
  item,
  isSelected,
  onToggleSelect,
}: {
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <View className="bg-white p-3">
      <View className="flex-row gap-4 p-3">
        <View className='flex flex-row items-center gap-4'>
          <Button
            onPress={onToggleSelect}
            variant={isSelected ? 'primary' : 'outline'}
            className="h-5 w-5 rounded-full p-0"
            icon={{ name: isSelected ? 'Check' : '', size: 12 }}
          />
          {/* Image */}
          <DynamicImage
            src={item.image}
            variant="product"
            alt={item.name}
            containerClassName="h-32 w-32 rounded-lg border border-gray-200"
          />
        </View>
        {/* Details */}
        <View className="flex-1 justify-between gap-1">
          <View>
            {/* Name */}
            <Text className="text-2xl font-light leading-snug text-gray-900" numberOfLines={2}>
              {item.name}
            </Text>
            {/* Unit price */}
            <Text className="text-xs text-gray-400">{formatMoney(item.price)} each</Text>
          </View>

          {/* Modifier details */}
          {item.modifierSelections && item.modifierSelections.length > 0 && (
            <ModifierSummary modifiers={item.modifierSelections} />
          )}
          {/* Bottom row: stepper + subtotal */}
          <View className="mt-1 flex-row items-center justify-between">
            {/* Subtotal */}
            <Text className="text-2xl font-semibold text-gray-600">
              {formatMoney(item.price * item.quantity)}
            </Text>

            {/* Quantity stepper */}
            <QuantityStepper
              value={item.quantity}
              min={1}
              variant="compact"
              onDecrement={() => updateQuantity(item._id, item.quantity - 1)}
              onIncrement={() => updateQuantity(item._id, item.quantity + 1)}
            />
          </View>
        </View>
        {/* Remove button */}
        <Button
          onPress={() => removeFromCart(item._id)}
          variant="ghost"
          className="absolute right-3 top-3 h-7 w-7 rounded-full bg-gray-100 p-0"
          icon={{ name: 'X', size: 14, color: '#6b7280' }}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CartScreen() {
  const {
    cartItems,
    selectedItemIds,
    selectedTotal,
    selectedCount,
    isAllSelected,
    toggleItemSelection,
    toggleCategorySelection,
    isCategorySelected,
    selectAll,
    deselectAll,
  } = useCart();
  const insets = useSafeAreaInsets();

  const sections = useMemo(() => {
    const grouped = new Map<
      string,
      { categoryId: string; categoryName: string; data: CartItem[] }
    >();
    for (const item of cartItems) {
      const categoryId = item.category?._id ?? 'uncategorized';
      const categoryName = item.category?.name ?? 'Other';
      let group = grouped.get(categoryId);
      if (!group) {
        group = { categoryId, categoryName, data: [] };
        grouped.set(categoryId, group);
      }
      group.data.push(item);
    }
    return Array.from(grouped.values());
  }, [cartItems]);

  const isEmpty = cartItems.length === 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* ── Content ── */}
      {isEmpty ? (
        <EmptyCart />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => {
            const selected = isCategorySelected(section.categoryId);
            return (
              <View className="flex-row items-center gap-2 bg-white px-3 py-2">
                <Button
                  onPress={() => toggleCategorySelection(section.categoryId)}
                  variant={selected ? 'primary' : 'outline'}
                  className="h-5 w-5 rounded p-0"
                  icon={{ name: selected ? 'Check' : '', size: 12 }}
                />
                <Text className="text-base font-bold">{section.categoryName}</Text>
              </View>
            );
          }}
          renderItem={({ item }) => (
            <CartItemCard
              item={item}
              isSelected={selectedItemIds.has(String(item._id))}
              onToggleSelect={() => toggleItemSelection(String(item._id))}
            />
          )}
          renderSectionFooter={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* ── Bottom bar: Select All + Total + Checkout ── */}
      {!isEmpty && (
        <View className=" border-gray-100 bg-white p-5">
          <View className="flex-row items-center justify-between gap-3">
            {/* Select All */}
            <View className="flex flex-row items-center gap-2">
              <Button
                onPress={isAllSelected ? deselectAll : selectAll}
                variant={isAllSelected ? 'primary' : 'outline'}
                className="h-8 w-8 rounded-full p-0"
                icon={{ name: isAllSelected ? 'Check' : '', size: 14 }}
              />
              <Text className="text-xs font-medium text-gray-500">All</Text>
            </View>

            <View className="flex flex-row items-center justify-between gap-4">
              {/* Total */}
              <View className="items-end">
                <Text className="text-xs text-gray-400">
                  {selectedCount} item{selectedCount !== 1 ? 's' : ''}
                </Text>
                <Text className="text-lg font-bold text-gray-900">
                  {formatMoney(selectedTotal)}
                </Text>
              </View>
              <Button
                onPress={() => router.push('/checkout')}
                disabled={selectedCount === 0}
                text="Checkout"
                className="rounded-xl px-8"
                textClassName="text-xl"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
