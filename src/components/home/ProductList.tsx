import { Heart } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Product } from '@/types/products.type';
import Banner from './Banner';
import MembershipBanner from './MembershipBanner';
import VipCard from './VipCard';
import WalletBanner from './WalletBanner';
import Categories from './Categories';
import { BranchSelector } from './BranchSelector';
import { BranchProduct } from '@/hooks/useProducts';
import { STOCK_STATUSES } from '@/types/inventories.type';
import { StockBadge } from './StockBadge';
import { StoreClosedOverlay } from './StoreClosedOverLay';
import { DynamicImage } from '@/components/ui/DynamicImage';
import { authClient } from '@/lib/auth-client';
import { useMembershipStatus } from '@/hooks/useMembership';

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

    // Stock info — only checked when a branch is selected
    const quantity = hasBranch ? (item.quantity ?? 0) : null;
    const status = hasBranch ? (item.status ?? '') : '';
    const isOutOfStock = hasBranch && (status === STOCK_STATUSES.OUT_OF_STOCK || (quantity ?? 0) <= 0);

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
          <DynamicImage
            src={item.image?.url}
            variant="product"
            alt={item.name}
            containerStyle={{ width: '100%', height: '100%' }}
            imageClassName="rounded-t-lg"
          />

          {/* Stock overlay — only when branch is selected */}
          {hasBranch && <StockBadge status={status} quantity={quantity} />}
          {isStoreClosed && <StoreClosedOverlay message={storeClosedMessage} />}

          {/* Heart button */}
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation();
              handleLike();
            }}
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
        <View className="px-3 pb-4 pt-3">
          <Text
            numberOfLines={1}
            className="text-sm font-semibold text-slate-900"
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

// ─── Home Carousel (Banner + Membership) ─────────────────────────────────────

const CAROUSEL_PAGE_WIDTH = Dimensions.get('window').width;
const CAROUSEL_PAGE_COUNT = 3;
const AUTO_SCROLL_INTERVAL = 10000;

const HomeCarousel = () => {
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: membershipData } = useMembershipStatus({ enabled: isAuthenticated });
  const scrollRef = useRef<ScrollView>(null);
  const [activePage, setActivePage] = useState(0);

  const activeMembership = membershipData?.activeMembership;
  const hasActiveMembership = activeMembership?.status === 'paid';
  const tiers = membershipData?.tiers ?? [];
  const activeTier = tiers.find((t) => t._id === activeMembership?.tierId);

  const memberName =
    (session?.user?.name ?? '').trim() ||
    [activeMembership?.firstName, activeMembership?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Member';

  // Auto-scroll between pages
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActivePage((prev) => {
        const next = (prev + 1) % CAROUSEL_PAGE_COUNT;
        scrollRef.current?.scrollTo({ x: next * CAROUSEL_PAGE_WIDTH, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_PAGE_WIDTH);
    setActivePage(page);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}>
        {/* Page 1: Greeting banner */}
        <View style={{ width: CAROUSEL_PAGE_WIDTH }}>
          <Banner />
        </View>
        {/* Page 2: Membership card or promo banner */}
        <View style={{ width: CAROUSEL_PAGE_WIDTH }}>
          {hasActiveMembership && activeMembership ? (
            <VipCard
              membership={activeMembership}
              memberName={memberName}
              tierChannel={activeMembership.tierChannel}
              expiresAt={activeMembership.expiresAt ?? activeTier?.validityRule?.expiresAt}
            />
          ) : (
            <MembershipBanner />
          )}
        </View>
        {/* Page 3: Wallet banner */}
        <View style={{ width: CAROUSEL_PAGE_WIDTH }}>
          <WalletBanner />
        </View>
      </ScrollView>

      {/* Pagination dots */}
      <View className="mt-3 flex-row items-center justify-center gap-2">
        {Array.from({ length: CAROUSEL_PAGE_COUNT }).map((_, i) => (
          <View
            key={i}
            className="rounded-full"
            style={{
              width: activePage === i ? 16 : 6,
              height: 6,
              backgroundColor: activePage === i ? '#e13e00' : '#d1d5db',
            }}
          />
        ))}
      </View>
    </View>
  );
};

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
  const insets = useSafeAreaInsets();

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
        paddingBottom: insets.bottom + 80,
        backgroundColor: '#f9f5f2',
      }}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <>
          <HomeCarousel />
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
