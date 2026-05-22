import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProduct } from '@/hooks/useProducts';
import { IncludedItem, Product } from '@/types/products';
import { useCart } from '@/context/CartContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 420;
const SHEET_BORDER_RADIUS = 28;

// ─── Badge ────────────────────────────────────────────────────────────────────

const variantMap = {
  default: {
    container: 'bg-gray-200 rounded-2xl px-3 py-1',
    text: 'text-xs font-medium text-gray-600',
  },
  category: {
    container: 'bg-gray-200 rounded-2xl px-3 py-1',
    text: 'text-xs font-medium text-gray-600',
  },
  subcategory: {
    container: 'bg-amber-200 rounded-2xl px-3 py-1',
    text: 'text-xs font-medium text-amber-600',
  },
  popular: {
    container: 'bg-orange-200 rounded-2xl px-3 py-1 border border-orange-500',
    text: 'text-xs font-medium text-orange-600',
  },
  signature: {
    container: 'bg-orange-200 rounded-2xl px-3 py-1 border border-orange-500',
    text: 'text-xs font-medium text-orange-600',
  },
};

function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: keyof typeof variantMap;
}) {
  const { container, text } = variantMap[variant];
  return (
    <View className={container}>
      <Text className={text}>{label}</Text>
    </View>
  );
}

// ─── IncludedItemCard ─────────────────────────────────────────────────────────

function IncludedItemCard({ item }: { item: IncludedItem }) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-gray-50 p-3">
      <View className="h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <Ionicons name="checkmark" size={16} color="#e13e00" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium text-gray-900" numberOfLines={1}>
          {item.product.name}
        </Text>
      </View>
      {item.quantity != null && item.quantity > 0 && (
        <View className="rounded-2xl bg-orange-50 px-2 py-1">
          <Text className="text-xs font-medium text-orange-600">x{item.quantity}</Text>
        </View>
      )}
    </View>
  );
}

// ─── QuantityStepper ──────────────────────────────────────────────────────────

function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View className="flex-row items-center overflow-hidden rounded-xl border border-gray-200">
      <TouchableOpacity
        onPress={onDecrement}
        className="h-12 w-10 items-center justify-center"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="remove" size={16} color="#111827" />
      </TouchableOpacity>

      <View className="h-12 w-px bg-gray-200" />

      <View className="h-12 w-10 items-center justify-center">
        <Text className="text-sm font-medium text-gray-900">{value}</Text>
      </View>

      <View className="h-12 w-px bg-gray-200" />

      <TouchableOpacity
        onPress={onIncrement}
        className="h-12 w-10 items-center justify-center"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="add" size={16} color="#e13e00" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const { cartItems, addToCart } = useCart();

  console.log(cartItems);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: response, isLoading } = useProduct(id);
  const product = response?.data as Product | undefined;

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [quantity, setQuantity] = useState(1);

  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (product) {
      Animated.parallel([
        Animated.spring(sheetAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [product]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white">
        <ActivityIndicator size="large" color="#e13e00" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#e13e00" />
        <Text className="text-base font-medium text-gray-900">Product not found</Text>
      </View>
    );
  }

  const formattedPrice =
    product.price != null ? `₱${product.price.toLocaleString('en-PH')}` : 'Price unavailable';

  const totalPrice =
    product.price != null ? `₱${(product.price * quantity).toLocaleString('en-PH')}` : '—';

  const handleAddToCart = () => {
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price ?? 0,
      image: product.image.url,
      category: {
        _id: product.category._id,
        name: product.category.name,
      },
      quantity: quantity,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Added to cart', ToastAndroid.SHORT);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}>
        {/* ── Hero Image ── */}
        <View className="" style={styles.hero}>
          <Image source={{ uri: product.image.url }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          <View style={[styles.heroControls, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="heart-outline" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Content Sheet ── */}
        <Animated.View
          style={[styles.sheet, { opacity: fadeAnim, transform: [{ translateY: sheetAnim }] }]}>
          {/* Drag handle */}
          <View className="mb-5 h-1 w-9 self-center rounded-full bg-gray-200" />

          {/* Badges */}
          <View className="mb-3 flex-row flex-wrap gap-1.5">
            <Badge label={product.productType} variant="category" />
            <Badge label={product.category.name} variant="category" />
            {product.subcategory && (
              <Badge label={product.subcategory.name} variant="subcategory" />
            )}
            {product.isPopular && <Badge label="🔥 Popular" variant="popular" />}
            {product.isSignature && <Badge label="✦ Signature" variant="signature" />}
          </View>

          {/* Name + Price */}
          <View className="mb-2 flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="text-2xl font-semibold leading-tight text-gray-900">
                {product.name}
              </Text>
              <Text className="mt-1 text-sm leading-snug text-gray-400" numberOfLines={2}>
                {product.info}
              </Text>
            </View>
            <Text className="shrink-0 text-2xl font-semibold text-orange-600">
              {formattedPrice}
            </Text>
          </View>

          {/* Pax count */}
          {product.paxCount != null && (
            <View className="mb-4 flex-row items-center gap-1.5 self-start rounded-xl bg-gray-50 px-3 py-2">
              <Ionicons name="people-outline" size={15} color="#e13e00" />
              <Text className="text-sm font-medium text-gray-700">
                Good for <Text className="text-orange-600">{product.paxCount}</Text> pax
              </Text>
            </View>
          )}

          {/* Divider */}
          <View className="my-4 h-px bg-gray-100" />

          {/* Description */}
          <Text className="mb-2 text-sm font-semibold text-gray-900">Description</Text>
          <Text className="text-sm leading-relaxed text-gray-500">
            {product.description || 'No description available.'}
          </Text>

          {/* Included Items */}
          {product.includedItems.length > 0 && (
            <>
              <View className="my-4 h-px bg-gray-100" />
              <View className="mb-2.5 flex-row items-center gap-1.5">
                <Ionicons name="checkmark-circle-outline" size={16} color="#e13e00" />
                <Text className="text-sm font-semibold text-gray-900">What's Included</Text>
              </View>
              <View className="gap-2">
                {product.includedItems.map((item, idx) => (
                  <IncludedItemCard key={item._id ?? idx} item={item} />
                ))}
              </View>
            </>
          )}

          <View className="h-24" />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Bottom CTA ── */}
      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-gray-100 bg-white px-5 pt-3">
        <QuantityStepper
          value={quantity}
          onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
          onIncrement={() => setQuantity(quantity + 1)}
        />
        <TouchableOpacity
          onPress={handleAddToCart}
          className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl ${isAdded ? 'bg-orange-200' : 'bg-orange-600'}`}
          activeOpacity={0.85}
          disabled={isAdded}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text className="text-sm font-semibold text-white">Add to Cart · {totalPrice}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles (only for things Tailwind can't do) ───────────────────────────────

const styles = StyleSheet.create({
  // Fixed pixel dimensions for the hero
  hero: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: '#fff3ee',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  // Platform.select shadow + rgba background can't be done in Tailwind
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  // Negative marginTop + dynamic border radius stay in StyleSheet
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    marginTop: -SHEET_BORDER_RADIUS,
    paddingHorizontal: 22,
    paddingTop: 20,
    minHeight: 500,
  },
});
