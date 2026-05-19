import React, { useState, useCallback } from 'react';
import {
  Text,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Categories from './home/components/Categories';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import Banner from './home/components/Banner';
import ProductList from './home/components/ProductList';

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { refetch: refetchCategories } = useCategories();
  const { refetch: refetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProducts()]); // refetch both at once
    setRefreshing(false);
  }, [refetchCategories, refetchProducts]);

  return (
    <ScrollView
      className="flex-1 bg-[#f9f5f2]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#e13e00"
          colors={['#e13e00']}
        />
      }>

      {/** Welcome banner */}
      <Banner />
      {/** Product Categories */}
      <Categories />
      <ProductList />
    </ScrollView>
  );
}
