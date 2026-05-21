import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProduct } from '@/hooks/useProducts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 420;
const SHEET_BORDER_RADIUS = 28;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  _id: string;
  name: string;
}

export interface SubCategory {
  _id: string;
  name: string;
}

export type ProductType = string;


// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'default' | 'category' | 'subcategory' | 'popular' | 'signature';
}) {
  const styles = {
    default: { bg: '#f3f4f6', text: '#6b7280' },
    category: { bg: '#f3f4f6', text: '#6b7280' },
    subcategory: { bg: '#fef3c7', text: '#92400e' },
    popular: { bg: '#fff3ee', text: '#c13500' },
    signature: { bg: '#fff3ee', text: '#c13500' },
  }[variant];

  return (
    <View
      style={[
        badgeStyles.container,
        { backgroundColor: styles.bg },
        (variant === 'popular' || variant === 'signature') && badgeStyles.accentBorder,
      ]}>
      <Text style={[badgeStyles.text, { color: styles.text }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  accentBorder: {
    borderWidth: 0.5,
    borderColor: 'rgba(225,62,0,0.2)',
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
});

function IncludedItemCard({ item }: { item: IncludedItem }) {
  return (
    <View style={includedStyles.card}>
      <View style={includedStyles.iconBox}>
        <Ionicons name="checkmark" size={16} color="#e13e00" />
      </View>
      <View style={includedStyles.textBlock}>
        <Text style={includedStyles.name} numberOfLines={1}>
          {item.product.name}
        </Text>
      </View>
      {item.quantity != null && item.quantity > 0 && (
        <View style={includedStyles.qtyPill}>
          <Text style={includedStyles.qtyText}>x{item.quantity}</Text>
        </View>
      )}
    </View>
  );
}

const includedStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff3ee',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  desc: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  qtyPill: {
    backgroundColor: '#fff3ee',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qtyText: {
    fontSize: 11,
    color: '#e13e00',
    fontWeight: '500',
  },
});

// ─── Quantity Stepper ──────────────────────────────────────────────────────────

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
    <View style={stepperStyles.container}>
      <TouchableOpacity
        onPress={onDecrement}
        style={stepperStyles.btn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="remove" size={16} color="#111827" />
      </TouchableOpacity>
      <View style={stepperStyles.divider} />
      <View style={stepperStyles.countBox}>
        <Text style={stepperStyles.count}>{value}</Text>
      </View>
      <View style={stepperStyles.divider} />
      <TouchableOpacity
        onPress={onIncrement}
        style={stepperStyles.btn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="add" size={16} color="#e13e00" />
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    overflow: 'hidden',
  },
  btn: {
    width: 38,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBox: {
    width: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    width: 0.5,
    height: 48,
    backgroundColor: '#e5e7eb',
  },
});

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: response, isLoading } = useProduct(id);
  const product = response?.data as Product | undefined;

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const qtyRef = useRef(1);
  const [qty, setQty] = [
    useRef(1).current,
    (n: number) => {
      qtyRef.current = n;
    },
  ];

  // Re-render qty via state
  const [quantity, setQuantity] = useStateShim(1);

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

  // Header opacity based on scroll
  const headerBg = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 60],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e13e00" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#e13e00" />
        <Text style={styles.notFoundText}>Product not found</Text>
      </View>
    );
  }

  const formattedPrice =
    product.price != null
      ? `₱${product.price.toLocaleString('en-PH')}`
      : 'Price unavailable';

  const totalPrice =
    product.price != null
      ? `₱${(product.price * quantity).toLocaleString('en-PH')}`
      : '—';

  return (
    <View style={styles.root}>
      {/* ── Floating header (appears on scroll) ── */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { paddingTop: insets.top, backgroundColor: headerBg },
        ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Animated.Text
          style={[styles.headerTitle, { opacity: headerTitleOpacity }]}
          numberOfLines={1}>
          {product.name}
        </Animated.Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="heart-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}>

        {/* ── Hero Image ── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: product.image.url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Gradient overlay at bottom of hero */}
          <View style={styles.heroOverlay} />

          {/* Controls pinned over hero (before scroll) */}
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
          style={[
            styles.sheet,
            {
              opacity: fadeAnim,
              transform: [{ translateY: sheetAnim }],
            },
          ]}>

          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Badges */}
          <View style={styles.badgeRow}>
            <Badge label={product.productType} variant="category" />
            <Badge label={product.category.name} variant="category" />
            {product.subcategory && (
              <Badge label={product.subcategory.name} variant="subcategory" />
            )}
            {product.isPopular && <Badge label="🔥 Popular" variant="popular" />}
            {product.isSignature && <Badge label="✦ Signature" variant="signature" />}
          </View>

          {/* Name + Price */}
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productInfo} numberOfLines={2}>
                {product.info}
              </Text>
            </View>
            <Text style={styles.productPrice}>{formattedPrice}</Text>
          </View>

          {/* Pax count */}
          {product.paxCount != null && (
            <View style={styles.paxChip}>
              <Ionicons name="people-outline" size={15} color="#e13e00" />
              <Text style={styles.paxText}>
                Good for <Text style={styles.paxCount}>{product.paxCount}</Text> pax
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>
            {product.description || 'No description available.'}
          </Text>

          {/* Included Items */}
          {product.includedItems.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#e13e00" />
                <Text style={styles.sectionLabel}>What's Included</Text>
              </View>
              <View style={styles.includedList}>
                {product.includedItems.map((item, idx) => (
                  <IncludedItemCard key={item._id ?? idx} item={item} />
                ))}
              </View>
            </>
          )}

          {/* Spacer for bottom bar */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <QuantityStepper
          value={quantity}
          onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
          onIncrement={() => setQuantity(quantity + 1)}
        />
        <TouchableOpacity style={styles.addToCartBtn} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart · {totalPrice}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── tiny useState shim so we avoid importing React explicitly ─────────────────
import { useState } from 'react';
import { IncludedItem, Product } from '@/types/products';
function useStateShim<T>(initial: T): [T, (v: T) => void] {
  return useState<T>(initial);
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },

  // Floating header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginHorizontal: 8,
  },

  // Hero
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
    // subtle fade from transparent to white at the bottom of the hero
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

  // Sheet
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    marginTop: -SHEET_BORDER_RADIUS,
    paddingHorizontal: 22,
    paddingTop: 20,
    minHeight: 500,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },

  // Name / price
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
  },
  productName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
  },
  productInfo: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e13e00',
    flexShrink: 0,
  },

  // Pax
  paxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  paxText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  paxCount: {
    color: '#e13e00',
  },

  // Section
  divider: {
    height: 0.5,
    backgroundColor: '#f3f4f6',
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  includedList: {
    gap: 8,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#f3f4f6',
  },
  addToCartBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#e13e00',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});