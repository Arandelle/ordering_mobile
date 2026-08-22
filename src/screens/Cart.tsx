import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { CartItem, SelectedModifierItem } from '@/types/menu-types';
import { IncludedItem } from '@/types/products.type';
import { Utensils } from 'lucide-react-native';

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

// ─── Modifier Details ─────────────────────────────────────────────────────────

function ModifierDetails({ modifiers }: { modifiers: SelectedModifierItem[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!modifiers || modifiers.length === 0) return null;

  const totalModifierPrice = modifiers.reduce((sum, group) => {
    return sum + group.selectedItems.reduce((gSum, item) => gSum + item.price * item.quantity, 0);
  }, 0);

  return (
    <View className="mt-2 rounded-lg border border-orange-100 bg-orange-50/50">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between px-3 py-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="layers-outline" size={14} color="#e13e00" />
          <Text className="text-xs font-medium text-orange-700">
            Customizations ({modifiers.length})
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          {totalModifierPrice > 0 && (
            <Text className="text-xs text-orange-600">+₱{totalModifierPrice.toLocaleString('en-PH')}</Text>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#e13e00"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="border-t border-orange-100 px-3 pb-2 pt-1">
          {modifiers.map((group, idx) => (
            <View key={idx} className={idx > 0 ? 'mt-2 pt-2 border-t border-orange-100' : ''}>
              <Text className="mb-1 text-xs font-semibold text-gray-700">{group.modifierGroupName}</Text>
              {group.selectedItems.map((item, iIdx) => (
                <View key={iIdx} className="flex-row justify-between py-0.5">
                  <Text className="text-xs text-gray-600">
                    {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                  </Text>
                  {item.price > 0 && (
                    <Text className="text-xs text-gray-500">
                      ₱{(item.price * item.quantity).toLocaleString('en-PH')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Included Items Details ───────────────────────────────────────────────────

function IncludedItemsDetails({ items }: { items: IncludedItem[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <View className="mt-2 rounded-lg border border-green-100 bg-green-50/50">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between px-3 py-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="gift-outline" size={14} color="#16a34a" />
          <Text className="text-xs font-medium text-green-700">
            What's Included ({items.length})
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#16a34a"
        />
      </TouchableOpacity>

      {expanded && (
        <View className="border-t border-green-100 px-3 pb-2 pt-1">
          {items.map((item, idx) => {
            const productName = typeof item.product === 'object' && item.product !== null
              ? item.product.name
              : String(item.product);
            const qty = item.quantity ?? 1;

            return (
              <View
                key={item._id ?? idx}
                className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-700">
                  {productName}{qty > 1 ? ` ×${qty}` : ''}
                </Text>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              </View>
            );
          })}
        </View>
      )}
    </View>
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
      <Image
        source={{ uri: item.image }}
        className="rounded-xl"
        style={styles.itemImage}
        resizeMode="cover"
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
        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
          <ModifierDetails modifiers={item.selectedModifiers} />
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
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: Math.max(insets.bottom, 48) + 100 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<OrderSummary />}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          renderItem={({ item }) => <CartItemCard item={item} />}
        />
      )}

      {/* ── Place Order CTA ── */}
      {!isEmpty && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 48) + 12 }}
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