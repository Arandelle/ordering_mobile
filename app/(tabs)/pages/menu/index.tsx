import React, { useState, useCallback, useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useBranchProductInfinite, useProductsInfinite } from '@/hooks/useProducts';
import ProductList from '@/components/home/ProductList';
import { useBranchContext } from '@/context/BranchContext';
import { useSettings } from '@/hooks/useSettings';
import { getStoreStatus } from '@/services/store-status.service';
import { authClient } from '@/lib/auth-client';
import { useFavouriteToggle, useFavourites, useGuestFavourites } from '@/hooks/useFavourites';

export default function MenuScreen() {
  const { refetch: refetchCategories } = useCategories();

  const { data: operatingSched, refetch: refetchSettings } = useSettings();
  const storeStatus = operatingSched ? getStoreStatus(operatingSched.operatingHours) : null;

  const isStoreClosed = storeStatus ? !storeStatus.isOpen : false;
  const storeClosedMessage = storeStatus && !storeStatus.isOpen ? storeStatus.message : '';

  const { selectedBranch } = useBranchContext();
  const branchId = selectedBranch?._id;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavourites, setShowFavourites] = useState(false);
  const hasBranch = !!branchId;

  // ── Auth & Favourites ────────────────────────────────────────────────────
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);
  const guestFavs = useGuestFavourites();
  const { isFavourited, toggle } = useFavouriteToggle(isLoggedIn);

  // Logged-in: fetch favourite products from server when in favourites view
  const { data: serverFavData, isLoading: isServerFavLoading } =
    useFavourites(isLoggedIn && showFavourites);

  // Guest: filter already-loaded products by AsyncStorage IDs
  const guestFavouriteIds = guestFavs.ids;

  const handleCategoryPress = useCallback((name: string | null) => {
    if (name === '__favourites__') {
      setShowFavourites(true);
      setActiveCategory(null);
    } else {
      setShowFavourites(false);
      setActiveCategory(name);
    }
  }, []);

  // Only pass real categories to the API (exclude pseudo-categories)
  const apiCategoryName = !showFavourites && activeCategory ? activeCategory : undefined;

  const {
    data: infiniteData,
    fetchNextPage: fetchAllBranchPage,
    hasNextPage: hasAllNextPage,
    isFetchingNextPage: isAllFetchingNextPage,
    isLoading: isAllLoading,
    isError: isAllError,
    refetch: refetchAll,
  } = useProductsInfinite({
    limit: 20,
    enabled: !showFavourites || !isLoggedIn,
    categoryName: apiCategoryName,
  });

  const {
    data: branchInfiniteData,
    fetchNextPage: fetchNextBranchPage,
    hasNextPage: hasBranchNextPage,
    isFetchingNextPage: isBranchFetchingNextPage,
    isLoading: isBranchLoading,
    isError: isBranchError,
    refetch: refetchBranch,
  } = useBranchProductInfinite(branchId ?? '', {
    limit: 20,
    categoryName: apiCategoryName,
    enabled: !!branchId && (!showFavourites || !isLoggedIn),
  });

  const [refreshing, setRefreshing] = useState(false);

  const allProducts = infiniteData?.pages.flatMap((p) => p.data) ?? [];
  const branchProducts = branchInfiniteData?.pages.flatMap((p) => p.data) ?? [];

  // Filter products for favourites view
  const favouriteProducts = useMemo(() => {
    if (!showFavourites) return [];
    if (isLoggedIn) {
      return serverFavData?.data ?? [];
    }
    // Guest: filter loaded products by guest favourite IDs
    const allLoaded = [...allProducts, ...branchProducts];
    return allLoaded.filter((p) => guestFavouriteIds.includes(p._id));
  }, [showFavourites, isLoggedIn, serverFavData, allProducts, branchProducts, guestFavouriteIds]);

  // All favourite IDs for heart icon rendering
  const allFavouriteIds = useMemo(() => {
    if (isLoggedIn) {
      return serverFavData?.data?.map((p) => p._id) ?? [];
    }
    return guestFavouriteIds;
  }, [isLoggedIn, serverFavData, guestFavouriteIds]);

  const { products, hasNextPage, isFetchingNextPage, isLoading, isError, refetch, fetchNextPage } =
    showFavourites
      ? {
          products: favouriteProducts,
          hasNextPage: false,
          isFetchingNextPage: false,
          isLoading: isLoggedIn ? isServerFavLoading : false,
          isError: false,
          refetch: refetchAll,
          fetchNextPage: () => {},
        }
      : hasBranch
        ? {
            products: branchProducts,
            hasNextPage: hasBranchNextPage,
            isFetchingNextPage: isBranchFetchingNextPage,
            isLoading: isBranchLoading,
            isError: isBranchError,
            refetch: refetchBranch,
            fetchNextPage: fetchNextBranchPage,
          }
        : {
            products: allProducts,
            hasNextPage: hasAllNextPage,
            isFetchingNextPage: isAllFetchingNextPage,
            isLoading: isAllLoading,
            isError: isAllError,
            refetch: refetchAll,
            fetchNextPage: fetchAllBranchPage,
          };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([refetchCategories(), refetch(), refetchSettings()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetch, refetchSettings]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <ProductList
      products={products}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      onEndReached={handleEndReached}
      onRefresh={onRefresh}
      refreshing={refreshing}
      activeCategory={showFavourites ? '__favourites__' : activeCategory}
      setActiveCategory={handleCategoryPress}
      hasBranch={hasBranch}
      isStoreClosed={isStoreClosed}
      storeClosedMessage={storeClosedMessage}
      showFavourites={showFavourites}
      favouriteIds={allFavouriteIds}
      onToggleFavourite={toggle}
      isLoggedIn={isLoggedIn}
    />
  );
}
