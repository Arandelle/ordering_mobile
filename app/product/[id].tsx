import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BranchProduct, useProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { SCREEN_HEIGHT } from '@/constant';
import { Badge } from '../../src/components/products/Badge';
import { IncludedItemCard } from '../../src/components/products/IncludedItemCard';
import { QuantityStepper } from '../../src/components/products/QuantityStepper';
import { useSettings } from '@/hooks/useSettings';
import { getStoreStatus } from '@/services/store-status.service';
import { useBranchContext } from '@/context/BranchContext';
import { STOCK_STATUSES } from '@/types/inventories.type';
import { StockBadge } from '@/components/home/StockBadge';
import { StoreClosedOverlay } from '@/components/home/StoreClosedOverLay';
import { BranchSelector } from '@/components/home/BranchSelector';
import { ModifierGroup, ModifierItem, IncludedItem } from '@/types/products.type';
import { SelectedModifierItem } from '@/types/menu-types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_BORDER_RADIUS = 28;

// ─── Modifier Selection Section ───────────────────────────────────────────────

interface ModifierSelectionState {
  [groupId: string]: {
    selected: Map<string, { item: ModifierItem; qty: number }>; // itemId -> {item, qty}
  };
}

function ModifierSection({
  groups,
  selection,
  onToggle,
  onQtyChange,
}: {
  groups: ModifierGroup[];
  selection: ModifierSelectionState;
  onToggle: (groupId: string, itemId: string) => void;
  onQtyChange: (groupId: string, itemId: string, qty: number) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.isMain || g.required).map((g) => g._id || g.name))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const getProductImage = (item: ModifierItem): string => {
    if (typeof item.product === 'object' && item.product !== null && 'image' in item.product) {
      return (item.product as any).image?.url || '';
    }
    return '';
  };

  const getProductPrice = (item: ModifierItem): number => {
    if (item.price != null) return item.price;
    if (typeof item.product === 'object' && item.product !== null && 'price' in item.product) {
      return (item.product as any).price ?? 0;
    }
    return 0;
  };

  const getProductName = (item: ModifierItem): string => {
    if (item.label) return item.label;
    if (typeof item.product === 'object' && item.product !== null && 'name' in item.product) {
      return (item.product as any).name || '';
    }
    if (typeof item.product === 'string') return item.product;
    return '';
  };

  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-semibold text-gray-900">Customize Your Order</Text>
      {groups.map((group) => {
        const groupId = group._id || group.name;
        const isExpanded = expandedGroups.has(groupId);
        const groupSelection = selection[groupId]?.selected || new Map();
        const isRequired = group.required === true;
        const selectedCount = groupSelection.size;
        const minSelect = isRequired ? (group.minSelect ?? 1) : 0;
        const remaining = isRequired ? Math.max(0, minSelect - selectedCount) : 0;

        return (
          <View key={groupId} className="mb-3 rounded-xl border border-gray-100 bg-gray-50">
            {/* Group header */}
            <TouchableOpacity
              onPress={() => toggleGroup(groupId)}
              className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-semibold text-gray-900">{group.name}</Text>
                  {isRequired && remaining > 0 && (
                    <View className="rounded-full bg-orange-100 px-2 py-0.5">
                      <Text className="text-xs font-semibold text-orange-600">
                        {remaining} more required
                      </Text>
                    </View>
                  )}
                  {isRequired && remaining === 0 && selectedCount > 0 && (
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  )}
                </View>
                <Text className="text-xs text-gray-400">
                  {isRequired
                    ? `Select ${minSelect}–${group.maxSelect}`
                    : `Up to ${group.maxSelect}`}
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#6b7280"
              />
            </TouchableOpacity>

            {/* Group items */}
            {isExpanded && (
              <View className="border-t border-gray-100 px-4 pb-3 pt-2">
                {group.items.map((item, idx) => {
                  const productId = typeof item.product === 'object' && item.product !== null
                    ? (item.product as any)._id
                    : item.product;
                  const itemId = String(productId ?? idx);
                  const isSelected = groupSelection.has(itemId);
                  const selectedEntry = groupSelection.get(itemId);
                  const itemPrice = getProductPrice(item);
                  const itemName = getProductName(item);
                  const itemImage = getProductImage(item);

                  return (
                    <View key={idx} className="mb-2 last:mb-0">
                      <TouchableOpacity
                        onPress={() => onToggle(groupId, itemId)}
                        className={`flex-row items-center gap-3 rounded-lg px-3 py-2.5 ${
                          isSelected ? 'bg-orange-50' : 'bg-white'
                        }`}>
                        {/* Checkbox */}
                        <View
                          className={`h-5 w-5 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300 bg-white'
                          }`}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>

                        {/* Image (small) */}
                        {itemImage ? (
                          <Image
                            source={{ uri: itemImage }}
                            className="h-10 w-10 rounded-lg"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="h-10 w-10 rounded-lg bg-gray-100" />
                        )}

                        {/* Name + price */}
                        <View className="flex-1">
                          <Text
                            className="text-sm font-medium text-gray-900"
                            numberOfLines={1}>
                            {itemName}
                          </Text>
                          {itemPrice > 0 && (
                            <Text className="text-xs text-orange-600">
                              +₱{itemPrice.toLocaleString('en-PH')}
                            </Text>
                          )}
                        </View>

                        {/* Qty controls (only when selected and maxQty > 1) */}
                        {isSelected && group.maxQty > 1 && (
                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                              onPress={() =>
                                onQtyChange(
                                  groupId,
                                  itemId,
                                  Math.max(1, (selectedEntry?.qty ?? 1) - 1)
                                )
                              }
                              className="h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white">
                              <Ionicons name="remove" size={14} color="#111827" />
                            </TouchableOpacity>
                            <Text className="w-4 text-center text-sm font-semibold">
                              {selectedEntry?.qty ?? 1}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                onQtyChange(
                                  groupId,
                                  itemId,
                                  Math.min(group.maxQty, (selectedEntry?.qty ?? 1) + 1)
                                )
                              }
                              className="h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white">
                              <Ionicons name="add" size={14} color="#e13e00" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  // Selected branch
  const { selectedBranch } = useBranchContext();
  const branchId = selectedBranch?._id;
  const hasBranch = !!branchId;

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: response, isLoading } = useProduct(id, branchId);
  const product = response?.data as BranchProduct | undefined;

  const { data: operatingSched } = useSettings();
  const storeStatus = operatingSched ? getStoreStatus(operatingSched.operatingHours) : null;

  const isStoreClosed = storeStatus ? !storeStatus.isOpen : false;
  const storeClosedMessage = storeStatus && !storeStatus.isOpen ? storeStatus.message : '';

  const { addToCart, totalItems } = useCart();

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const panY = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // ─── Modifier state ─────────────────────────────────────────────────────────

  const hasModifiers =
    product && Array.isArray(product.modifierGroups) && product.modifierGroups.length > 0;

  // Build stable initial selection state from product modifier groups
  const initialModifierSelection = useMemo<ModifierSelectionState>(() => {
    const initial: ModifierSelectionState = {};
    if (product?.modifierGroups) {
      for (const g of product.modifierGroups) {
        const gid = g._id || g.name;
        initial[gid] = { selected: new Map() };
      }
    }
    return initial;
  }, [product?.modifierGroups]);

  const [modifierSelection, setModifierSelection] = useState<ModifierSelectionState>(initialModifierSelection);

  // Re-initialize when product changes (e.g. branch switch loads different product data)
  useEffect(() => {
    setModifierSelection(initialModifierSelection);
  }, [initialModifierSelection]);

  const handleModifierToggle = useCallback(
    (groupId: string, itemId: string) => {
      setModifierSelection((prev) => {
        const group = prev[groupId];
        if (!group) return prev;

        const modGroup = product?.modifierGroups?.find(
          (g) => (g._id || g.name) === groupId
        );

        const newSelected = new Map(group.selected);
        if (newSelected.has(itemId)) {
          // Prevent deselecting if it would drop below minSelect on a required group
          if (modGroup && modGroup.required && modGroup.minSelect > 0 && newSelected.size <= modGroup.minSelect) {
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                `At least ${modGroup.minSelect} item(s) required for "${modGroup.name}"`,
                ToastAndroid.SHORT
              );
            }
            return prev;
          }
          newSelected.delete(itemId);
        } else {
          // Find the modifier item and add it
          const modItem = modGroup?.items.find((mi) => {
            const miProductId = typeof mi.product === 'object' && mi.product !== null
              ? (mi.product as any)._id
              : mi.product;
            return String(miProductId ?? '') === itemId;
          });
          if (modItem) {
            // Prevent selecting more than maxSelect
            if (modGroup && modGroup.maxSelect > 0 && newSelected.size >= modGroup.maxSelect) {
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  `Maximum ${modGroup.maxSelect} item(s) allowed for "${modGroup.name}"`,
                  ToastAndroid.SHORT
                );
              }
              return prev;
            }
            newSelected.set(itemId, { item: modItem, qty: 1 });
          }
        }

        return { ...prev, [groupId]: { selected: newSelected } };
      });
    },
    [product]
  );

  const handleModifierQtyChange = useCallback(
    (groupId: string, itemId: string, qty: number) => {
      setModifierSelection((prev) => {
        const group = prev[groupId];
        if (!group) return prev;

        const newSelected = new Map(group.selected);
        const entry = newSelected.get(itemId);
        if (entry) {
          newSelected.set(itemId, { ...entry, qty });
        }

        return { ...prev, [groupId]: { selected: newSelected } };
      });
    },
    []
  );

  // Compute modifier total
  const modifierTotal = useMemo(() => {
    let total = 0;
    for (const group of Object.values(modifierSelection)) {
      for (const { item, qty } of group.selected.values()) {
        const price =
          item.price ??
          (typeof item.product === 'object' && item.product !== null && 'price' in item.product
            ? (item.product as any).price ?? 0
            : 0);
        total += price * qty;
      }
    }
    return total;
  }, [modifierSelection]);

  const unitPrice = (product?.price ?? 0) + modifierTotal;
  const totalPrice = unitPrice * quantity;

  const formattedPrice =
    product?.price != null ? `₱${product.price.toLocaleString('en-PH')}` : 'Price unavailable';

  const productStocks = hasBranch && product ? (product.quantity ?? 0) : null;
  const status = hasBranch && product ? (product.status ?? '') : '';

  const isOutOfStock =
    hasBranch && (status === STOCK_STATUSES.OUT_OF_STOCK || (productStocks ?? 0) <= 0);

  const isLowStock = hasBranch && status === STOCK_STATUSES.LOW_STOCK;

  // Validate modifier selection
  const getModifierValidationState = (): { valid: boolean; message?: string } => {
    if (!hasModifiers || !product?.modifierGroups) return { valid: true };

    for (const group of product.modifierGroups) {
      if (!group.required) continue;

      const gid = group._id || group.name;
      const sel = modifierSelection[gid]?.selected;
      const count = sel ? sel.size : 0;
      const minSelect = group.minSelect ?? 1;

      if (count < minSelect) {
        return {
          valid: false,
          message: `Complete Selection`,
        };
      }
    }
    return { valid: true };
  };

  // Build selected modifiers for cart
  const buildSelectedModifiers = (): SelectedModifierItem[] => {
    if (!product?.modifierGroups) return [];

    const result: SelectedModifierItem[] = [];
    for (const group of product.modifierGroups) {
      const gid = group._id || group.name;
      const sel = modifierSelection[gid]?.selected;
      if (!sel || sel.size === 0) continue;

      const selectedItems: SelectedModifierItem['selectedItems'][number][] = [];
      for (const { item, qty } of sel.values()) {
        const name =
          item.label ??
          (typeof item.product === 'object' && item.product !== null && 'name' in item.product
            ? (item.product as any).name
            : String(item.product));
        const price =
          item.price ??
          (typeof item.product === 'object' && item.product !== null && 'price' in item.product
            ? (item.product as any).price ?? 0
            : 0);
        selectedItems.push({ name: name || '', price, quantity: qty });
      }

      result.push({
        modifierGroupName: group.name,
        selectedItems,
      });
    }
    return result;
  };

  const getCtaState = () => {
    if (isOutOfStock) return { label: 'Out of Stock', style: 'bg-gray-200', disabled: true };
    if (isStoreClosed) return { label: 'Store is Closed', style: 'bg-gray-200', disabled: true };

    const validation = getModifierValidationState();
    if (!validation.valid) {
      return {
        label: validation.message || 'Complete selection',
        style: 'bg-gray-400',
        disabled: true,
      };
    }

    const priceStr = totalPrice.toLocaleString('en-PH');
    return {
      label: `Add to Cart · ₱${priceStr}`,
      style: isAdded ? 'bg-orange-200' : 'bg-orange-600',
    };
  };

  const handleAddToCart = () => {
    if (!product) return;

    const validation = getModifierValidationState();
    if (!validation.valid) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(validation.message || 'Please complete your selection', ToastAndroid.SHORT);
      }
      return;
    }

    const selectedModifiers = buildSelectedModifiers();

    addToCart({
      _id: product._id,
      name: product.name,
      price: unitPrice,
      image: product.image.url,
      category: {
        _id: product.category._id,
        name: product.category.name,
      },
      quantity: quantity,
      selectedModifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
      includedItems: product.includedItems && product.includedItems.length > 0 ? product.includedItems : undefined,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Added to cart', ToastAndroid.SHORT);
    }
  };

  const closeWithSwipe = () => {
    Animated.parallel([
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(pageOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) panY.setValue(gesture.dy); // only drag down
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 1.2) {
          closeWithSwipe();
        } else {
          // Snap back
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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

  return (
    <View className="flex-1 bg-white">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        style={{ transform: [{ translateY: panY }], opacity: pageOpacity }}
        {...panResponder.panHandlers}>


        {/* ── Hero Image ── */}
        <View style={{ height: 420, width: SCREEN_WIDTH }} className="overflow-hidden bg-[#fff3ee]">

          {/** out/low stock product overlay */}
          {(isOutOfStock || isLowStock) && (
            <View className="absolute inset-0 z-10 flex flex-row items-center justify-center bg-black/40">
              <StockBadge status={status} quantity={productStocks} className="static" />
            </View>
          )}

          {/** Store closed overlat message */}
          {isStoreClosed && <StoreClosedOverlay message={storeClosedMessage} />}

          <Image source={{ uri: product.image.url }} className="h-full w-full" resizeMode="cover" />

          {/** Header */}
          <View
            className="absolute left-0 right-0 z-10 flex flex-row justify-between px-5"
            style={{ top: insets.top + 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>

            <View className="flex flex-row gap-2">
              <TouchableOpacity style={styles.circleBtn}>
                <Ionicons name="heart-outline" size={20} color="#111827" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/cart')}
                style={styles.circleBtn}
                className="relative">
                <Ionicons name="cart-outline" size={20} color="#111827" />
                {totalItems > 0 && (
                  <View className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#e13e00] text-white">
                    <Text className="text-white">{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Content Sheet ── */}
        <Animated.View
          style={[styles.sheet, { opacity: fadeAnim, transform: [{ translateY: sheetAnim }] }]}>
          {/* Drag handle */}
          <View className="mb-5 h-1 w-9 self-center rounded-full bg-gray-200" />

          {/** Branch selector */}
          <BranchSelector className="mt-0 px-1 py-4" />

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
          {product.includedItems && product.includedItems.length > 0 && (
            <>
              <View className="my-4 h-px bg-gray-100" />
              <View className="mb-2.5 flex-row items-center gap-1.5">
                <Ionicons name="checkmark-circle-outline" size={16} color="#e13e00" />
                <Text className="text-sm font-semibold text-gray-900">What's Included</Text>
              </View>
              <View className="gap-2">
                {product.includedItems.map((item: IncludedItem, idx: number) => (
                  <IncludedItemCard key={item._id ?? idx} item={item} />
                ))}
              </View>
            </>
          )}

          {/* Modifier Selection */}
          {hasModifiers && product.modifierGroups && (
            <ModifierSection
              groups={product.modifierGroups}
              selection={modifierSelection}
              onToggle={handleModifierToggle}
              onQtyChange={handleModifierQtyChange}
            />
          )}

          <View className="h-24" />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Bottom CTA ── */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 48) + 12 }}
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-gray-100 bg-white px-5 pt-3">
        <QuantityStepper
          value={quantity}
          onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
          onIncrement={() => setQuantity(quantity + 1)}
        />

        <TouchableOpacity
          onPress={handleAddToCart}
          className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl ${getCtaState().style}`}
          activeOpacity={0.85}
          disabled={getCtaState().disabled}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text className="text-sm font-semibold text-white">{getCtaState().label}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles (only for things Tailwind can't do) ───────────────────────────────

const styles = StyleSheet.create({
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
