import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/menu-types';
import { formatMoney } from '@/helper/formatter';
import { Button } from '@/components/ui/Button';
import { UndoBanner } from '@/components/UndoBanner';
import { useUndo } from '@/hooks/useUndo';
import { CartItemCard } from './CartItemCard';

// Bottom tab bar height — matches tabBarStyle padding in app/(tabs)/_layout.tsx
const TAB_BAR_HEIGHT = 72;
const UNDO_DURATION = 5;

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
    addToCart,
    removeFromCart,
  } = useCart();
  const insets = useSafeAreaInsets();
  const openCloseRef = useRef<(() => void) | null>(null);

  const { pendingItem: pendingRemoval, secondsLeft, trigger, undo, isActive } = useUndo<CartItem>({
    duration: UNDO_DURATION,
  });

  const handleRemove = (item: CartItem) => {
    removeFromCart(item._id);
    trigger(item);
  };

  const handleUndo = () => {
    if (pendingRemoval) {
      addToCart(pendingRemoval);
    }
    undo();
  };

  const handleSwipeOpen = (close: () => void) => {
    if (openCloseRef.current) {
      openCloseRef.current();
    }
    openCloseRef.current = close;
  };

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
      {isEmpty && !isActive ? (
        <EmptyCart />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 80,
          }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          onScrollBeginDrag={() => {
            if (openCloseRef.current) {
              openCloseRef.current();
              openCloseRef.current = null;
            }
          }}
          renderSectionHeader={({ section }) => {
            const selected = isCategorySelected(section.categoryId);
            const itemCount = section.data.length;
            return (
              <View className="flex-row items-center justify-between px-4 pb-1 pt-3">
                <View className="flex-row items-center gap-2.5">
                  <Button
                    onPress={() => toggleCategorySelection(section.categoryId)}
                    variant={selected ? 'primary' : 'outline'}
                    className="h-5 w-5 rounded-md p-0"
                    icon={{ name: selected ? 'Check' : '', size: 11 }}
                  />
                  <Text className="text-base font-bold text-gray-900">{section.categoryName}</Text>
                </View>
                <View className="rounded-full bg-gray-100 px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-gray-500">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            );
          }}
          renderItem={({ item, section, index }) => (
            <CartItemCard
              item={item}
              isSelected={selectedItemIds.has(String(item._id))}
              onToggleSelect={() => toggleItemSelection(String(item._id))}
              onSwipeOpen={handleSwipeOpen}
              onRemove={handleRemove}
              isLast={index === section.data.length - 1}
            />
          )}
          renderSectionFooter={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* ── Undo Banner ── */}
      {pendingRemoval && (
        <UndoBanner
          message={<>Removed <Text className="font-semibold text-white">{pendingRemoval.name}</Text></>}
          secondsLeft={secondsLeft}
          duration={UNDO_DURATION}
          onUndo={handleUndo}
        />
      )}

      {/* ── Bottom bar: Select All + Total + Checkout ── */}
      {!isEmpty && (
        <View className="mx-3 mb-2 overflow-hidden rounded-2xl bg-white shadow-md">
          <View className="flex-row items-center justify-between px-4 py-3.5">
            {/* Select All */}
            <View className="flex-row items-center gap-2">
              <Button
                onPress={isAllSelected ? deselectAll : selectAll}
                variant={isAllSelected ? 'primary' : 'outline'}
                className="h-7 w-7 rounded-lg p-0"
                icon={{ name: isAllSelected ? 'Check' : '', size: 13 }}
              />
              <View>
                <Text className="text-xs font-medium text-gray-500">Select</Text>
                <Text className="text-xs font-bold text-gray-800">All</Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-8 w-px bg-gray-200" />

            {/* Total + Checkout */}
            <View className="flex-row items-center gap-4">
              <View className="items-end">
                <Text className="text-[11px] text-gray-400">
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
                className="rounded-xl px-6 py-3.5"
                textClassName="text-base font-bold"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
