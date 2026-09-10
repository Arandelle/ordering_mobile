import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

  const totalExtras = modifiers.reduce((sum, group) => {
    return sum + group.items.reduce((g, item) => g + item.upgradePrice * item.quantity, 0);
  }, 0);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
        className="self-start flex-row items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1"
      >
        <Ionicons name="layers-outline" size={12} color="#ef4501" />
        <Text className="text-[11px] font-medium text-brand-500">
          {modifiers.length} option{modifiers.length !== 1 ? 's' : ''}
          {totalExtras > 0 ? ` · +${formatMoney(totalExtras)}` : ''}
        </Text>
        <Ionicons name="chevron-forward" size={10} color="#ef4501" />
      </TouchableOpacity>

      <ModifierDetailsSheet
        visible={showModal}
        modifiers={modifiers}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

// ─── Cart Item Card ───────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;

function CartItemCard({
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
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightAction = () => {
    return (
      <View
        className="ml-2 flex-row items-center justify-center rounded-2xl bg-red-500"
        style={{ width: SWIPE_THRESHOLD }}
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-red-600">
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </View>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: isLast ? 0 : 8 }}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderRightAction}
        onSwipeableOpen={() => {
          onSwipeOpen(() => swipeableRef.current?.close());
        }}
        onSwipeableRightOpen={() => {
          swipeableRef.current?.close();
          onRemove(item);
        }}
      >
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
                <Text className="mt-0.5 text-xs text-gray-400">
                  {formatMoney(item.price)} each
                </Text>
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
      </Swipeable>
    </View>
  );
}

// ─── Undo Banner ─────────────────────────────────────────────────────────────

const UNDO_DURATION = 5;

function UndoBanner({
  itemName,
  secondsLeft,
  onUndo,
}: {
  itemName: string;
  secondsLeft: number;
  onUndo: () => void;
}) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 250 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const progressWidth = (secondsLeft / UNDO_DURATION) * 100;

  return (
    <Animated.View
      style={animatedStyle}
      className="mx-3 mb-2 overflow-hidden rounded-2xl bg-gray-900 shadow-lg"
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
          <Ionicons name="trash-outline" size={16} color="#f87171" />
        </View>
        <View className="flex-1">
          <Text className="text-sm text-white" numberOfLines={1}>
            Removed <Text className="font-semibold">{itemName}</Text>
          </Text>
          <Text className="mt-0.5 text-[11px] text-gray-400">
            Undo within {secondsLeft}s
          </Text>
        </View>
        <Button
          onPress={onUndo}
          text="Undo"
          variant='outline'
        />
      </View>

      {/* Progress bar at bottom */}
      <View className="h-1 w-full bg-gray-800">
        <Animated.View
          style={{
            width: `${progressWidth}%`,
            height: '100%',
            backgroundColor: '#f97316',
          }}
        />
      </View>
    </Animated.View>
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

  const [pendingRemoval, setPendingRemoval] = useState<CartItem | null>(null);
  const [undoSeconds, setUndoSeconds] = useState(UNDO_DURATION);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearInterval(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const handleRemove = useCallback(
    (item: CartItem) => {
      clearUndoTimer();
      removeFromCart(item._id);
      setPendingRemoval(item);
      setUndoSeconds(UNDO_DURATION);

      undoTimerRef.current = setInterval(() => {
        setUndoSeconds((prev) => {
          if (prev <= 1) {
            clearUndoTimer();
            setPendingRemoval(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [removeFromCart, clearUndoTimer],
  );

  const handleUndo = useCallback(() => {
    if (pendingRemoval) {
      addToCart(pendingRemoval);
      clearUndoTimer();
      setPendingRemoval(null);
      setUndoSeconds(0);
    }
  }, [pendingRemoval, addToCart, clearUndoTimer]);

  useEffect(() => {
    return () => clearUndoTimer();
  }, [clearUndoTimer]);

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
      {isEmpty && !pendingRemoval ? (
        <EmptyCart />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 80 }}
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
                  <Text className="text-base font-bold text-gray-900">
                    {section.categoryName}
                  </Text>
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
          itemName={pendingRemoval.name}
          secondsLeft={undoSeconds}
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
