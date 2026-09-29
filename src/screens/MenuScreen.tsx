import React, { useState, useCallback } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useBranchProductInfinite, useProductsInfinite } from '@/hooks/useProducts';
import ProductList from '@/components/home/ProductList';
import { useBranchContext } from '@/context/BranchContext';
import { useSettings } from '@/hooks/useSettings';
import { getStoreStatus } from '@/services/store-status.service';

export default function MenuScreen() {
  const { refetch: refetchCategories } = useCategories();

  const { data: operatingSched, refetch: refetchSettings } = useSettings();
  const storeStatus = operatingSched ? getStoreStatus(operatingSched.operatingHours) : null;

  const isStoreClosed = storeStatus ? !storeStatus.isOpen : false;
  const storeClosedMessage = storeStatus && !storeStatus.isOpen ? storeStatus.message : '';

  const { selectedBranch } = useBranchContext();
  const branchId = selectedBranch?._id;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const hasBranch = !!branchId;

  const {
    data: infiniteData,
    fetchNextPage: fetchAllBranchPage,
    hasNextPage: hasAllNextPage,
    isFetchingNextPage: isAllFetchingNextPage,
    isLoading: isAllLoading,
    isError: isAllError,
    refetch: refetchAll,
  } = useProductsInfinite({ limit: 20, enabled: true, categoryName: activeCategory ?? undefined });

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
    categoryName: activeCategory ?? undefined,
    enabled: !!branchId,
  });

  const [refreshing, setRefreshing] = useState(false);

  const allProducts = infiniteData?.pages.flatMap((p) => p.data) ?? [];
  const branchProducts = branchInfiniteData?.pages.flatMap((p) => p.data) ?? [];

  const { products, hasNextPage, isFetchingNextPage, isLoading, isError, refetch, fetchNextPage } =
    hasBranch
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
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      hasBranch={hasBranch}
      isStoreClosed={isStoreClosed}
      storeClosedMessage={storeClosedMessage}
    />
  );
}
