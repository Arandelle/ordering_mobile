import { Heart } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '@/types/products';
import Banner from './Banner';
import Categories from './Categories';
import { BranchSelector } from './BranchSelector';
import { BranchProduct } from '@/hooks/useProducts';
import { STOCK_STATUSES } from '@/types/inventories';
import { StockBadge } from './StockBadge';
import { StoreClosedOverlay } from './StoreClosedOverLay';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductListProps = {
  products: (Product | BranchProduct)[];
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  hasBranch: boolean;
  refetch: () => void;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  activeCategory: string | null;
  setActiveCategory: (name: string | null) => void;
  isStoreClosed: boolean;
  storeClosedMessage: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = React.memo(
  ({
    item,
    hasBranch,
    isStoreClosed,
    storeClosedMessage,
  }: {
    item: BranchProduct;
    hasBranch: boolean;
    isStoreClosed: boolean;
    storeClosedMessage: string;
  }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    // Stock info — only relevant when a branch is selected
    const quantity = hasBranch ? (item.quantity ?? 0) : null;
    const status = hasBranch ? (item.status ?? '') : '';
    const isOutOfStock =
      hasBranch && (status === STOCK_STATUSES.OUT_OF_STOCK || (quantity ?? 1) <= 0);

    const isBlocked = isOutOfStock || isStoreClosed;

    const handleLike = () => {
      setLiked((prev) => !prev);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
      ]).start();
    };

    const handlePress = () => {
      router.push(`/product/${item._id}`);
    };

    return (
      <TouchableOpacity
        activeOpacity={isOutOfStock ? 1 : 0.93}
        onPress={handlePress}
        className="rounded-lg bg-white shadow-sm"
        style={{ width: CARD_WIDTH }}>
        {/* Image block */}
        <View style={{ height: CARD_WIDTH, backgroundColor: '#f5f0ed', position: 'relative' }}>
          <Image
            source={
              item.image?.url ? { uri: item.image.url } : require('assets/images/char-icon.jpg')
            }
            style={{ width: '100%', height: '100%' }}
            className="rounded-t-lg"
            resizeMode="cover"
          />

          {/* Stock overlay — only renders when hasBranch */}
          {hasBranch && <StockBadge status={status} quantity={quantity} />}
          {isStoreClosed && <StoreClosedOverlay message={storeClosedMessage} />}

          {/* Heart button */}
          <TouchableOpacity
            onPress={handleLike}
            activeOpacity={0.8}
            style={{ zIndex: 30 }}
            className="elevation absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-gray-200 shadow-md">
            <Animated.View style={{ transform: [{ scale }] }}>
              <Heart
                size={15}
                color={liked ? '#e13e00' : '#aaa'}
                fill={liked ? '#e13e00' : 'transparent'}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Info row */}
        <View className="flex flex-row items-center justify-between gap-2 px-3 pb-4 pt-3">
          <Text
            numberOfLines={1}
            className="flex-1 text-sm font-semibold text-slate-900"
            style={{ letterSpacing: -0.1, opacity: isBlocked ? 0.4 : 1 }}>
            {item.name}
          </Text>
          <Text
            className="text-lg font-bold"
            style={{ color: isBlocked ? '#9ca3af' : '#e13e00', letterSpacing: -0.2 }}>
            ₱{item.price}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

// ─── Product List ─────────────────────────────────────────────────────────────

const ProductList = ({
  products,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  hasBranch,
  isStoreClosed,
  storeClosedMessage,
  refetch,
  onEndReached,
  onRefresh,
  refreshing,
  activeCategory,
  setActiveCategory,
}: ProductListProps) => {
  const renderItem = useCallback(
    ({ item }: { item: BranchProduct }) => (
      <ProductCard
        item={item}
        hasBranch={hasBranch}
        isStoreClosed={isStoreClosed}
        storeClosedMessage={storeClosedMessage}
      />
    ),
    [hasBranch, isStoreClosed, storeClosedMessage]
  );

  const keyExtractor = useCallback((item: Product) => item._id, []);

  return (
    <FlatList
      data={products as BranchProduct[]}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{
        gap: 12,
        paddingTop: 8,
        paddingBottom: 32,
        backgroundColor: '#f9f5f2',
      }}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <>
          <Banner />
          <BranchSelector />
          <Categories activeCategory={activeCategory} onCategoryPress={setActiveCategory} />
          <Text className="px-4 pb-1 pt-2 text-base font-bold text-gray-900">
            {hasBranch ? 'Available at this Branch' : 'All Products'}
          </Text>
        </>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#e13e00"
          colors={['#e13e00']}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator size="small" color="#e13e00" className="py-4" />
        ) : !hasNextPage && products.length > 0 ? (
          <Text className="py-4 text-center text-xs text-gray-400">All products loaded</Text>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#e13e00" />
          </View>
        ) : isError ? (
          <View className="items-center py-16">
            <Text className="mb-3 text-sm text-gray-400">Failed to load products</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text className="text-xs font-semibold text-[#e13e00]">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center py-10">
            <Text className="text-gray-400">No products found.</Text>
          </View>
        )
      }
    />
  );
};

export default ProductList;
