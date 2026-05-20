import { useProducts } from '@/hooks/useProducts';
import { Heart } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cols, 16px side padding + 16px gap

type Product = {
  _id: string;
  name: string;
  price: number;
  image: { url: string; public_id: string };
};

// ─── Product Card ─────────────────────────────────────────────────────────
const ProductCard = ({ item }: { item: Product }) => {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    setLiked((prev) => !prev);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const handlePress = () => {
    if (router) {
      router.push(`/product/${item._id}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.93}
      onPress={handlePress}
      className="rounded-lg bg-white shadow-sm"
      style={{
        width: CARD_WIDTH,
      }}>
      {/* Image Block */}
      <View
        style={{
          height: CARD_WIDTH,
          backgroundColor: '#f5f0ed',
          position: 'relative',
        }}>
        <Image
          source={
            item.image?.url ? { uri: item.image.url } : require('assets/images/char-icon.jpg')
          }
          style={{ width: '100%', height: '100%' }}
          className="rounded-t-lg"
          resizeMode="cover"
        />
        {/* Heart button — top right, floating */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.8}
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
          style={{
            letterSpacing: -0.1,
          }}>
          {item.name}
        </Text>
        {/* Price pill */}
        <View>
          <Text
            className="text-lg font-bold"
            style={{
              color: '#e13e00',
              letterSpacing: -0.2,
            }}>
            ₱{item.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Product List ─────────────────────────────────────────────────────────
const ProductList = () => {
  const { data, isLoading, isError, refetch } = useProducts();
  const products: Product[] = data?.data ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator size="large" color="#e13e00" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="mb-3 text-sm text-gray-400">Failed to load products</Text>
        <TouchableOpacity onPress={() => refetch()} className="rounded-full bg-[#e13e00] px-5 py-2">
          <Text className="text-xs font-semibold text-white">Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      numColumns={2}
      scrollEnabled={false} // parent ScrollView handles scroll
      contentContainerStyle={{ padding: 16, gap: 16 }}
      columnWrapperStyle={{ gap: 16 }}
      ListHeaderComponent={
        <Text className="mb-1 text-base font-bold text-gray-900">All Products</Text>
      }
      ListEmptyComponent={
        <View className="items-center py-16">
          <Text className="text-sm text-gray-400">No products found</Text>
        </View>
      }
      renderItem={({ item }) => <ProductCard item={item} />}
    />
  );
};

export default ProductList;
