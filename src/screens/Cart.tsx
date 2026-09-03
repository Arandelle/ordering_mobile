import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { CartItem, ModifierSelection } from '@/types/menu-types';
import { IncludedItem } from '@/types/products.type';
import { Utensils, X } from 'lucide-react-native';
import BottomSheet from '@/components/BottomSheet';
import { DynamicImage } from '@/components/ui/DynamicImage';

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
      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-2 rounded-2xl bg-orange-600 px-6 py-3">
        <Text className="text-sm font-semibold text-white">Browse Menu</Text>
      </TouchableOpacity>
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
        <TouchableOpacity
          onPress={onClose}
          className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <X size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="py-4" nestedScrollEnabled>
        {modifiers.map((group, idx) => (
          <View
            key={idx}
            className={idx > 0 ? 'mt-4 border-t border-gray-100 pt-4' : ''}>
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
                    {item.quantity > 1 && (
                      <Text className="text-gray-400"> ×{item.quantity}</Text>
                    )}
                  </Text>
                  {item.label && (
                    <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
                      {item.label}
                    </Text>
                  )}
                </View>
                {item.upgradePrice > 0 && (
                  <Text className="text-sm font-semibold text-gray-900">
                    ₱{(item.upgradePrice * item.quantity).toLocaleString('en-PH')}
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
                +₱{totalModifierPrice.toLocaleString('en-PH')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

// ─── Modifier Summary Row ─────────────────────────────────────────────────────

function ModifierSummary({
  modifiers,
}: {
  modifiers: ModifierSelection[];
}) {
  const [showModal, setShowModal] = useState(false);

  if (!modifiers || modifiers.length === 0) return null;

  const totalItems = modifiers.reduce((sum, g) => sum + g.items.length, 0);
  const totalModifierPrice = modifiers.reduce((sum, group) => {
    return sum + group.items.reduce((gSum, item) => gSum + item.upgradePrice * item.quantity, 0);
  }, 0);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="mt-2 flex-row items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2">
        <Ionicons name="layers-outline" size={14} color="#e13e00" />
        <Text className="flex-1 text-xs font-medium text-orange-700">
          {totalItems} item{totalItems > 1 ? 's' : ''} customized
        </Text>
        {totalModifierPrice > 0 && (
          <Text className="text-xs text-orange-600">+₱{totalModifierPrice.toLocaleString('en-PH')}</Text>
        )}
        <Ionicons name="chevron-forward" size={12} color="#e13e00" />
      </TouchableOpacity>

      <ModifierDetailsSheet
        visible={showModal}
        modifiers={modifiers}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

// ─── Included Items Details ───────────────────────────────────────────────────

function IncludedItemsDetails({ items }: { items: IncludedItem[] }) {
  const [showModal, setShowModal] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="mt-2 flex-row items-center gap-2 rounded-lg border border-green-100 bg-green-50/50 px-3 py-2">
        <Ionicons name="gift-outline" size={14} color="#16a34a" />
        <Text className="flex-1 text-xs font-medium text-green-700">
          {items.length} item{items.length > 1 ? 's' : ''} included
        </Text>
        <Ionicons name="chevron-forward" size={12} color="#16a34a" />
      </TouchableOpacity>

      <BottomSheet visible={showModal} onClose={() => setShowModal(false)}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
          <Text className="text-base font-bold text-gray-900">What&apos;s Included</Text>
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="py-4" nestedScrollEnabled>
          {items.map((item, idx) => {
            const productName = typeof item.product === 'object' && item.product !== null
              ? item.product.name
              : String(item.product);
            const qty = item.quantity ?? 1;

            return (
              <View
                key={item._id ?? idx}
                className={idx > 0 ? 'mt-2 border-t border-gray-100 pt-2' : ''}>
                <View className="flex-row items-center justify-between py-2">
                  <Text className="flex-1 text-sm text-gray-700">
                    {productName}
                    {qty > 1 && <Text className="text-gray-400"> ×{qty}</Text>}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                </View>
              </View>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

// ─── Cart Item Card ───────────────────────────────────────────────────────────

function CartItemCard({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCart();

  const subtotal = `₱${(item.price * item.quantity).toLocaleString('en-PH')}`;
  const unitPrice = `₱${item.price.toLocaleString('en-PH')}`;

  return (
    <View className="flex-row gap-3 rounded-2xl bg-white p-3" style={styles.card}>
      {/* Image */}
      <DynamicImage
        src={item.image}
        variant="product"
        alt={item.name}
        containerStyle={styles.itemImage}
        containerClassName="rounded-xl"
      />

      {/* Details */}
      <View className="flex-1 gap-1">
        {/* Category badge */}
        <View className="self-start rounded-lg bg-orange-50 px-2 py-0.5">
          <Text className="text-xs font-medium text-orange-500">{item.category?.name}</Text>
        </View>

        {/* Name */}
        <Text className="text-sm font-semibold leading-snug text-gray-900" numberOfLines={2}>
          {item.name}
        </Text>

        {/* Unit price */}
        <Text className="text-xs text-gray-400">{unitPrice} each</Text>

        {/* Modifier details */}
        {item.modifierSelections && item.modifierSelections.length > 0 && (
          <ModifierSummary modifiers={item.modifierSelections} />
        )}

        {/* Included items */}
        {item.includedItems && item.includedItems.length > 0 && (
          <IncludedItemsDetails items={item.includedItems} />
        )}


        {/* Bottom row: stepper + subtotal */}
        <View className="mt-1 flex-row items-center justify-between">
          {/* Quantity stepper */}
          <View className="flex-row items-center overflow-hidden rounded-xl border border-gray-200">
            <TouchableOpacity
              onPress={() => updateQuantity(item._id, item.quantity - 1)}
              className="h-9 w-9 items-center justify-center"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons
                name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                size={14}
                color={item.quantity === 1 ? '#e13e00' : '#111827'}
              />
            </TouchableOpacity>

            <View className="h-9 w-px bg-gray-200" />

            <View className="h-9 w-8 items-center justify-center">
              <Text className="text-sm font-semibold text-gray-900">{item.quantity}</Text>
            </View>

            <View className="h-9 w-px bg-gray-200" />

            <TouchableOpacity
              onPress={() => updateQuantity(item._id, item.quantity + 1)}
              className="h-9 w-9 items-center justify-center"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="add" size={14} color="#e13e00" />
            </TouchableOpacity>
          </View>

          {/* Subtotal */}
          <Text className="text-base font-bold text-orange-600">{subtotal}</Text>
        </View>
      </View>

      {/* Remove button */}
      <TouchableOpacity
        onPress={() => removeFromCart(item._id)}
        className="absolute right-3 top-3 h-7 w-7 items-center justify-center rounded-full bg-gray-100"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name="close" size={14} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary() {
  const { vatableSales, vatAmount, totalPrice } = useCart();

  const rows = [
    { label: 'Vatable Sales', value: `₱${vatableSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'VAT (12%)', value: `₱${vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  ];

  return (
    <View className="rounded-2xl bg-white p-4" style={styles.card}>
      <Text className="mb-3 text-sm font-semibold text-gray-900">Order Summary</Text>

      <View className="gap-2">
        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">{row.label}</Text>
            <Text className="text-sm text-gray-700">{row.value}</Text>
          </View>
        ))}
      </View>

      <View className="my-3 h-px bg-gray-100" />

      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-gray-900">Total</Text>
        <Text className="text-lg font-bold text-orange-600">
          ₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CartScreen() {
  const { cartItems, totalItems, clearCart } = useCart();
  const insets = useSafeAreaInsets();

  const isEmpty = cartItems.length === 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* ── Header ── */}


      {/* ── Content ── */}
      {isEmpty ? (
        <EmptyCart />
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<OrderSummary />}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          renderItem={({ item }) => <CartItemCard item={item} />}
        />
      )}

      {/* ── Place Order CTA ── */}
      {!isEmpty && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 8) + 12 }}
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pt-3">
          <TouchableOpacity
            onPress={() => router.push('/checkout')}
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-orange-600"
            activeOpacity={0.85}>
            <Utensils size={16} color="#fff" />
            <Text className="text-base font-bold text-white">Place Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  itemImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#fff3ee',
  },
});