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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BranchProduct, useProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { SCREEN_HEIGHT } from '@/constant';
import { Badge } from '../../../src/components/products/Badge';
import { IncludedItemCard } from '../../../src/components/products/IncludedItemCard';
import { QuantityStepper } from '../../../src/components/ui/QuantityStepper';
import { useSettings } from '@/hooks/useSettings';
import { getStoreStatus } from '@/services/store-status.service';
import { useBranchContext } from '@/context/BranchContext';
import { STOCK_STATUSES } from '@/types/inventories.type';
import { StockBadge } from '@/components/home/StockBadge';
import { StoreClosedOverlay } from '@/components/home/StoreClosedOverLay';
import { BranchSelector } from '@/components/home/BranchSelector';
import { ModifierGroup, ModifierItem, IncludedItem } from '@/types/products.type';
import { ModifierSelection, ModifierSelectionItem } from '@/types/menu-types';
import { authClient } from '@/lib/auth-client';
import { useFavouriteToggle } from '@/hooks/useFavourites';
import BottomSheet from '@/components/BottomSheet';
import { DynamicImage } from '@/components/ui/DynamicImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_BORDER_RADIUS = 28;

// ─── Modifier helpers ─────────────────────────────────────────────────────────

function getModProductId(item: ModifierItem): string {
  return typeof item.product === 'object' && item.product !== null
    ? (item.product as any)._id
    : String(item.product ?? '');
}

function getModImage(item: ModifierItem): string {
  if (typeof item.product === 'object' && item.product !== null && 'image' in item.product) {
    return (item.product as any).image?.url || '';
  }
  return '';
}

function getModPrice(item: ModifierItem): number {
  if (item.price != null) return item.price;
  if (typeof item.product === 'object' && item.product !== null && 'price' in item.product) {
    return (item.product as any).price ?? 0;
  }
  return 0;
}

function getModName(item: ModifierItem): string {
  if (item.label) return item.label;
  if (typeof item.product === 'object' && item.product !== null && 'name' in item.product) {
    return (item.product as any).name || '';
  }
  if (typeof item.product === 'string') return item.product;
  return '';
}

// ─── Effective group settings (linked groups derive from main at runtime) ─────

interface EffectiveSettings {
  required: boolean;
  minSelect: number;
  maxSelect: number;
  maxQty: number;
  isLinked: boolean;
}

function buildEffectiveSettings(
  groups: ModifierGroup[],
  quantities: Map<string, Map<string, number>>
): Map<string, EffectiveSettings> {
  const map = new Map<string, EffectiveSettings>();
  const mainGroup = groups.find((g) => g.isMain);
  const mainGroupId = mainGroup?._id || mainGroup?.name || '';
  const mainQtyMap = quantities.get(mainGroupId);
  const mainTotalQty = mainQtyMap
    ? [...mainQtyMap.values()].reduce((sum, q) => sum + Math.max(0, q), 0)
    : 0;

  for (const group of groups) {
    const gid = group._id || group.name;
    if (group.linkedToGroupId && mainGroup) {
      map.set(gid, {
        required: mainTotalQty > 0,
        minSelect: mainTotalQty > 0 ? 1 : 0,
        maxSelect: mainTotalQty,
        maxQty: mainTotalQty,
        isLinked: true,
      });
    } else {
      map.set(gid, {
        required: group.required,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        maxQty: group.maxQty,
        isLinked: false,
      });
    }
  }
  return map;
}

// ─── Modifier Group Preview Row ──────────────────────────────────────────────

function ModifierGroupPreview({
  group,
  eff,
  groupQtyMap,
  onOpen,
}: {
  group: ModifierGroup;
  eff: EffectiveSettings;
  groupQtyMap: Map<string, number> | undefined;
  onOpen: () => void;
}) {
  const selectedItems = group.items.filter((item) => {
    const pid = getModProductId(item);
    return (groupQtyMap?.get(pid) ?? 0) > 0;
  });

  const hasIncluded = group.items.some((item) => item.isIncluded);
  const currentTotalQty = groupQtyMap ? [...groupQtyMap.values()].reduce((s, q) => s + q, 0) : 0;

  const previewItem =
    selectedItems[0] ?? group.items.find((item) => item.isIncluded) ?? group.items[0];
  const previewImage = previewItem ? getModImage(previewItem) : '';

  const getPreviewText = () => {
    if (selectedItems.length === 0) {
      return `Choose ${eff.maxSelect === 1 ? '1' : `up to ${eff.maxSelect}`}`;
    }
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      const name = getModName(item);
      const qty = groupQtyMap?.get(getModProductId(item)) ?? 1;
      return qty > 1 ? `${qty}× ${name}` : name;
    }
    return `${selectedItems.length} items selected`;
  };

  return (
    <TouchableOpacity
      onPress={onOpen}
      className="flex-row items-center gap-3 border-b border-gray-100 py-3"
      activeOpacity={0.7}>
      {/* Preview image */}
      <DynamicImage
        src={previewImage || undefined}
        variant="product"
        containerStyle={{ width: 56, height: 56 }}
        containerClassName="rounded-lg"
        resizeMode="cover"
      />

      {/* Group info */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
            {group.name}
          </Text>
          {eff.required && (
            <Text className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
              Required
            </Text>
          )}
        </View>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {getPreviewText()}
        </Text>
        {currentTotalQty > 0 && (
          <Text className="text-[10px] text-gray-400">
            Qty: {currentTotalQty} / {eff.maxQty}
          </Text>
        )}
      </View>

      {/* Action button */}
      <View className="rounded-full border border-gray-200 px-4 py-2">
        <Text className="text-xs font-bold text-gray-900">
          {selectedItems.length > 0 || hasIncluded ? 'Customize' : 'Choose'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Modifier Selection Bottom Sheet Content ─────────────────────────────────

function ModifierSheetContent({
  group,
  eff,
  groupQtyMap,
  onSetQty,
  onClose,
}: {
  group: ModifierGroup;
  eff: EffectiveSettings;
  groupQtyMap: Map<string, number> | undefined;
  onSetQty: (productId: string, qty: number) => void;
  onClose: () => void;
}) {
  const currentTotalQty = groupQtyMap ? [...groupQtyMap.values()].reduce((s, q) => s + q, 0) : 0;
  const isRadio = eff.maxSelect === 1;

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 px-1 pb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-gray-900">{group.name}</Text>
          {group.isMain && (
            <View className="rounded bg-amber-50 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Main
              </Text>
            </View>
          )}
          {eff.isLinked && (
            <View className="rounded bg-purple-50 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Side
              </Text>
            </View>
          )}
          {eff.required && (
            <Text className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
              Required
            </Text>
          )}
        </View>
        <Text className="text-xs font-medium text-gray-500">
          Qty: {currentTotalQty} / {eff.maxQty}
        </Text>
      </View>

      <Text className="mb-3 mt-2 text-xs text-gray-400">
        {isRadio ? 'Choose 1' : `Choose up to ${eff.maxSelect} item${eff.maxSelect > 1 ? 's' : ''}`}
      </Text>

      {/* Items list */}
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {group.items.map((modItem, idx) => {
          const pid = getModProductId(modItem);
          const itemQty = groupQtyMap?.get(pid) ?? 0;
          const isSelected = itemQty > 0;
          const upgradePrice = getModPrice(modItem);
          const itemName = getModName(modItem);
          const itemImage = getModImage(modItem);
          const isIncluded = modItem.isIncluded === true;

          return (
            <TouchableOpacity
              key={pid || idx}
              onPress={() => onSetQty(pid, isSelected ? 0 : 1)}
              className={`flex-row items-center gap-3 rounded-lg px-2 py-3 ${
                isSelected ? 'bg-brand-50' : ''
              }`}
              activeOpacity={0.7}>
              {/* Image */}
              <DynamicImage
                src={itemImage || undefined}
                variant="product"
                containerStyle={{ width: 48, height: 48 }}
                containerClassName="rounded-md"
                resizeMode="cover"
              />

              {/* Name + price */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                  {itemName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {isIncluded
                    ? '(Default)'
                    : upgradePrice === 0
                      ? 'Free'
                      : `+ ₱${upgradePrice.toLocaleString('en-PH')}`}
                </Text>
              </View>

              {/* Checkbox indicator */}
              <View
                className={`h-5 w-5 items-center justify-center rounded border ${
                  isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300 bg-white'
                }`}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>

              {/* Qty stepper — only when selected, not included, and multi-qty allowed */}
              {isSelected && !isIncluded && (eff.maxSelect > 1 || eff.maxQty > 1) && (
                <View className="ml-1">
                  <QuantityStepper
                    value={itemQty}
                    min={1}
                    max={Math.max(1, eff.maxQty - currentTotalQty + itemQty)}
                    onDecrement={() => onSetQty(pid, Math.max(1, itemQty - 1))}
                    onIncrement={() => onSetQty(pid, itemQty + 1)}
                    variant="compact"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Apply button */}
      <TouchableOpacity
        onPress={onClose}
        className="mb-8 mt-4 items-center rounded-xl bg-[#e13e00] py-3.5"
        activeOpacity={0.85}>
        <Text className="text-sm font-bold text-white">Apply</Text>
      </TouchableOpacity>
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

  // ── Favourites ──────────────────────────────────────────────────────────
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);
  const { isFavourited, toggle } = useFavouriteToggle(isLoggedIn);
  const productIsFav = id ? isFavourited(id) : false;

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

  // Maps groupId → (productId → quantity). Quantity 0 means "not selected".
  const [modifierQuantities, setModifierQuantities] = useState<Map<string, Map<string, number>>>(
    () => new Map()
  );

  // Track which modifier group bottom sheet is open
  const [openModifierGroupId, setOpenModifierGroupId] = useState<string | null>(null);

  // Reset quantities when product changes
  useEffect(() => {
    setModifierQuantities(new Map());
  }, [product?._id]);

  // Pre-select isIncluded items when product loads
  useEffect(() => {
    if (!product?.modifierGroups) return;
    setModifierQuantities((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const group of product.modifierGroups!) {
        const gid = group._id || group.name;
        const groupMap = new Map(next.get(gid) ?? new Map<string, number>());
        for (const item of group.items) {
          if (!item.isIncluded) continue;
          const pid = getModProductId(item);
          if (pid && !groupMap.has(pid)) {
            groupMap.set(pid, 1);
            changed = true;
          }
        }
        if (changed) next.set(gid, groupMap);
      }
      return changed ? next : prev;
    });
  }, [product?._id]);

  // Effective settings (linked groups derive from main at runtime)
  const effectiveSettings = useMemo(
    () => buildEffectiveSettings(product?.modifierGroups ?? [], modifierQuantities),
    [product?.modifierGroups, modifierQuantities]
  );

  // Set modifier item quantity (handles toggle, radio-style, max constraints)
  const setModifierItemQty = useCallback(
    (groupId: string, productId: string, newQty: number) => {
      setModifierQuantities((prev) => {
        const next = new Map(prev);
        const groupMap = new Map(next.get(groupId) ?? new Map<string, number>());

        if (newQty <= 0) {
          groupMap.delete(productId);
        } else {
          const eff = effectiveSettings.get(groupId);
          const maxSelect = eff?.maxSelect ?? 999;
          const maxQty = eff?.maxQty ?? 999;

          // Check maxSelect constraint
          const currentSelectedCount = [...groupMap.values()].filter((q) => q > 0).length;
          if ((groupMap.get(productId) ?? 0) === 0 && currentSelectedCount >= maxSelect) {
            if (maxSelect === 1) {
              groupMap.clear(); // radio-style: switch selection
            } else {
              if (Platform.OS === 'android') {
                ToastAndroid.show(`Maximum ${maxSelect} items allowed`, ToastAndroid.SHORT);
              }
              return prev;
            }
          }

          // Enforce maxQty
          const currentTotalQty = [...groupMap.values()].reduce((sum, q) => sum + q, 0);
          const currentQtyForThisItem = groupMap.get(productId) ?? 0;
          const newTotalQty = currentTotalQty - currentQtyForThisItem + newQty;
          if (newTotalQty > maxQty) {
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Maximum total quantity is ${maxQty}`, ToastAndroid.SHORT);
            }
            return prev;
          }

          groupMap.set(productId, newQty);
        }

        next.set(groupId, groupMap);
        return next;
      });
    },
    [effectiveSettings]
  );

  // Compute upgrade total (skip isIncluded items — they're part of base price)
  const upgradeTotal = useMemo(() => {
    if (!hasModifiers || !product?.modifierGroups) return 0;
    let sum = 0;
    for (const group of product.modifierGroups) {
      const gid = group._id || group.name;
      const groupQtyMap = modifierQuantities.get(gid);
      if (!groupQtyMap) continue;
      for (const modItem of group.items) {
        if (modItem.isIncluded) continue;
        const pid = getModProductId(modItem);
        const qty = groupQtyMap.get(pid) ?? 0;
        if (qty > 0) {
          const upgradePrice = getModPrice(modItem);
          sum += upgradePrice * qty;
        }
      }
    }
    return sum;
  }, [hasModifiers, product?.modifierGroups, modifierQuantities]);

  const unitPrice = (product?.price ?? 0) + upgradeTotal;
  const totalPrice = unitPrice * quantity;

  const formattedPrice =
    product?.price != null ? `₱${product.price.toLocaleString('en-PH')}` : 'Price unavailable';

  const productStocks = hasBranch && product ? (product.quantity ?? 0) : null;
  const status = hasBranch && product ? (product.status ?? '') : '';

  const isOutOfStock =
    hasBranch && (status === STOCK_STATUSES.OUT_OF_STOCK || (productStocks ?? 0) <= 0);

  const isLowStock = hasBranch && status === STOCK_STATUSES.LOW_STOCK;

  // Validate modifier selection using effective settings
  const modifierValidationErrors = useMemo(() => {
    if (!hasModifiers || !product?.modifierGroups) return [];
    const errors: string[] = [];
    for (const group of product.modifierGroups) {
      const gid = group._id || group.name;
      const eff = effectiveSettings.get(gid);
      if (!eff) continue;

      const groupQtyMap = modifierQuantities.get(gid);
      const selectedCount = groupQtyMap ? [...groupQtyMap.values()].filter((q) => q > 0).length : 0;
      const totalQty = groupQtyMap ? [...groupQtyMap.values()].reduce((sum, q) => sum + q, 0) : 0;

      if (eff.required && selectedCount < eff.minSelect) {
        errors.push(`${group.name}: select at least ${eff.minSelect}`);
      }
      if (eff.required && eff.isLinked && totalQty < eff.maxQty) {
        errors.push(`${group.name}: total quantity must be ${eff.maxQty}`);
      }
    }
    return errors;
  }, [hasModifiers, product?.modifierGroups, modifierQuantities, effectiveSettings]);

  const canAddToCart = modifierValidationErrors.length === 0;

  // Build selected modifiers for cart
  const buildSelectedModifiers = (): ModifierSelection[] => {
    if (!product?.modifierGroups) return [];

    const result: ModifierSelection[] = [];
    for (const group of product.modifierGroups) {
      const gid = group._id || group.name;
      const groupQtyMap = modifierQuantities.get(gid);
      if (!groupQtyMap) continue;

      const items: ModifierSelectionItem[] = [];
      for (const modItem of group.items) {
        const pid = getModProductId(modItem);
        const qty = groupQtyMap.get(pid) ?? 0;
        if (qty <= 0) continue;

        items.push({
          productId: pid,
          name: getModName(modItem),
          label: modItem.label ?? null,
          upgradePrice: getModPrice(modItem),
          quantity: qty,
        });
      }

      if (items.length === 0) continue;

      result.push({
        groupId: gid,
        groupName: group.name,
        isMain: group.isMain ?? false,
        linkedToGroupId: group.linkedToGroupId ?? null,
        required: group.required ?? false,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        maxQty: group.maxQty,
        items,
      });
    }
    return result;
  };

  const getCtaState = () => {
    if (isOutOfStock) return { label: 'Out of Stock', style: 'bg-gray-200', disabled: true };
    if (isStoreClosed) return { label: 'Store is Closed', style: 'bg-gray-200', disabled: true };

    if (!canAddToCart) {
      return {
        label: 'Complete Selection',
        style: 'bg-gray-400',
        disabled: true,
      };
    }

    const priceStr = totalPrice.toLocaleString('en-PH');
    return {
      label: isAdded ? 'Added!' : `Add to Cart · ₱${priceStr}`,
      style: isAdded ? 'bg-green-500' : 'bg-[#e13e00]',
    };
  };

  const handleAddToCart = () => {
    if (!product || !canAddToCart) {
      if (!canAddToCart && Platform.OS === 'android') {
        ToastAndroid.show('Please complete your selection', ToastAndroid.SHORT);
      }
      return;
    }

    const modifierSelections = buildSelectedModifiers();

    addToCart({
      _id: product._id,
      name: product.name,
      price: unitPrice,
      image: product.image.url,
      category:
        typeof product.category === 'string'
          ? { _id: product.category, name: '' }
          : { _id: product.category?._id ?? '', name: product.category?.name ?? '' },
      quantity: quantity,
      modifierSelections: modifierSelections.length > 0 ? modifierSelections : undefined,
      includedItems:
        product.includedItems && product.includedItems.length > 0
          ? product.includedItems
          : undefined,
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
              <TouchableOpacity onPress={() => id && toggle(id)} style={styles.circleBtn}>
                <Ionicons
                  name={productIsFav ? 'heart' : 'heart-outline'}
                  size={20}
                  color={productIsFav ? '#e13e00' : '#111827'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/pages/cart')}
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
            <Badge
              label={
                typeof product.category === 'string'
                  ? product.category
                  : (product.category?.name ?? '')
              }
              variant="category"
            />
            {product.subcategory && (
              <Badge
                label={
                  typeof product.subcategory === 'string'
                    ? product.subcategory
                    : (product.subcategory?.name ?? '')
                }
                variant="subcategory"
              />
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

          {/* Modifier Groups — Compact Preview Rows */}
          {hasModifiers && product.modifierGroups && (
            <>
              <View className="my-4 h-px bg-gray-100" />
              <Text className="mb-2 text-sm font-semibold text-gray-900">Customize Your Order</Text>

              {/* Validation errors */}
              {modifierValidationErrors.length > 0 && (
                <View className="mb-3 rounded-lg border border-red-100 bg-red-50 p-3">
                  {modifierValidationErrors.map((err, i) => (
                    <Text key={i} className="text-xs text-red-700">
                      • {err}
                    </Text>
                  ))}
                </View>
              )}

              <View className="border-t border-gray-100">
                {product.modifierGroups.map((group) => {
                  const gid = group._id || group.name;
                  const eff = effectiveSettings.get(gid) ?? {
                    required: group.required,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    maxQty: group.maxQty,
                    isLinked: false,
                  };
                  const groupQtyMap = modifierQuantities.get(gid);

                  return (
                    <ModifierGroupPreview
                      key={gid}
                      group={group}
                      eff={eff}
                      groupQtyMap={groupQtyMap}
                      onOpen={() => setOpenModifierGroupId(gid)}
                    />
                  );
                })}
              </View>
            </>
          )}

          {/* Bottom spacer to prevent content overlapping the fixed CTA bar */}
          <View style={{ height: Math.max(insets.bottom, 48) + 72 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Modifier Selection Bottom Sheet ── */}
      {openModifierGroupId &&
        (() => {
          const group = product?.modifierGroups?.find(
            (g) => (g._id || g.name) === openModifierGroupId
          );
          if (!group) return null;

          const gid = openModifierGroupId;
          const eff = effectiveSettings.get(gid) ?? {
            required: group.required,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            maxQty: group.maxQty,
            isLinked: false,
          };
          const groupQtyMap = modifierQuantities.get(gid);

          return (
            <BottomSheet
              visible={!!openModifierGroupId}
              onClose={() => setOpenModifierGroupId(null)}>
              <ModifierSheetContent
                group={group}
                eff={eff}
                groupQtyMap={groupQtyMap}
                onSetQty={(productId, qty) => setModifierItemQty(gid, productId, qty)}
                onClose={() => setOpenModifierGroupId(null)}
              />
            </BottomSheet>
          );
        })()}

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
