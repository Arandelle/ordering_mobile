import React, { useState, useCallback } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useBranchProductInfinite, useProductsInfinite } from '@/hooks/useProducts';
import ProductList from './home/components/ProductList';
import { useBranchContext } from '@/context/BranchContext';

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { refetch: refetchCategories } = useCategories();

  // Selected branch
  const { selectedBranch } = useBranchContext();
  const branchId = selectedBranch?._id;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const hasBranch = !!branchId;

  // Hooks for all product ( when user didnt select branch)
  const {
    data: infiniteData,
    fetchNextPage: fetchAllBranchPage,
    hasNextPage: hasAllNextPage,
    isFetchingNextPage: isAllFetchingNextPage,
    isLoading: isAllLoading,
    isError: isAllError,
    refetch: refetchAll,
  } = useProductsInfinite({ limit: 20, enabled: true, categoryName: activeCategory ?? undefined });

  // Hooks to show products based on selected branch
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
    enabled: !!branchId, // only fires when branch selected
  });

  const [refreshing, setRefreshing] = useState(false);

  // products for non/selected branch
  const allProducts = infiniteData?.pages.flatMap((p) => p.data) ?? [];
  const branchProducts = branchInfiniteData?.pages.flatMap((p) => p.data) ?? [];

  // Dynamic ternary object swap
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
      await Promise.all([refetchCategories(), refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetch]);

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
    />
  );
}
