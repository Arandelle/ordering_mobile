import { useProducts } from "@/hooks/useProducts";
import { Heart } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
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

  return (
    <View
      className="overflow-hidden rounded-2xl bg-white"
      style={{ width: CARD_WIDTH }}
    >
      {/* Image area */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/product/${item._id}`)}
        className="relative"
      >
        <View className="items-center justify-center bg-orange-50" style={{ height: CARD_WIDTH }}>
          <Image
            source={
              item.image?.url
                ? { uri: item.image.url }
                : require("assets/images/char-icon.jpg")
            }
            style={{ width: CARD_WIDTH * 0.75, height: CARD_WIDTH * 0.75 }}
            resizeMode="contain"
          />
        </View>

        {/* Heart icon */}
        <TouchableOpacity
          onPress={() => setLiked((prev) => !prev)}
          className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white"
          style={{ elevation: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={15}
            color={liked ? "#e13e00" : "#d1d5db"}
            fill={liked ? "#e13e00" : "transparent"}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Info */}
      <View className="px-3 py-2.5">
        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-0.5 text-sm font-bold text-[#e13e00]">
          ₱{item.price}
        </Text>
      </View>
    </View>
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
        <TouchableOpacity
          onPress={() => refetch()}
          className="rounded-full bg-[#e13e00] px-5 py-2"
        >
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
      scrollEnabled={false}       // parent ScrollView handles scroll
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