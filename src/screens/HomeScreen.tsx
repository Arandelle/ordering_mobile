import React, { useState, useCallback } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useProductsInfinite } from '@/hooks/useProducts';
import ProductList from './home/components/ProductList';

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { refetch: refetchCategories } = useCategories();
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch: refetchProducts,
  } = useProductsInfinite({ limit: 20, enabled: true });

  const [refreshing, setRefreshing] = useState(false);
  const allProducts = infiniteData?.pages.flatMap((p) => p.data) ?? [];

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([refetchCategories(), refetchProducts()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchProducts]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <ProductList
      products={allProducts}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      isError={isError}
      refetch={refetchProducts}
      onEndReached={handleEndReached}
      onRefresh={onRefresh}     
      refreshing={refreshing}    
    />
  );
}