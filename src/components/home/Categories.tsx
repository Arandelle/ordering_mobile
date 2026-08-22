import { useCategories } from '@/hooks/useCategories';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

type CategoriesProps = {
  activeCategory: string | null;
  onCategoryPress: (name: string | null) => void;
};

const Categories = ({ activeCategory, onCategoryPress }: CategoriesProps) => {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  if (isLoading) {
    return (
      <View className="mt-4 px-4 py-5">
        <View className="mb-3 px-2">
          <Text className="font-bold italic text-black">Loading food Categories</Text>
        </View>
        <View className="flex-row gap-2 px-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} className="h-9 w-20 rounded-full bg-gray-200" />
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="mb-3 text-sm text-gray-400">Failed to load food categories</Text>
        <TouchableOpacity onPress={() => refetch()} className="rounded-full bg-[#e13e00] px-5 py-2">
          <Text className="text-xs font-semibold text-white">Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mt-2 py-5">
      {/* Header row — title + "All" toggle */}
      <View className="mb-3 flex-row items-center justify-between px-4">
        <View>
          <Text className="font-bold text-black">Food Categories</Text>
          <Text className="mt-0.5 text-xs text-[#e13e00]">
            {activeCategory ?? 'All Categories'}
          </Text>
        </View>
        {activeCategory && (
          <TouchableOpacity onPress={() => onCategoryPress(null)}>
            <Text className="font-semibold text-[#e13e00]">Clear filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scrollable pills */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        data={categories}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isActive = activeCategory === item.name;
          return (
            <TouchableOpacity
              onPress={() => onCategoryPress(isActive ? null : item.name)}
              activeOpacity={0.75}
              className={`rounded-full px-4 py-2 ${
                isActive ? 'bg-brand-500' : 'bg-gray-100'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-white' : 'text-gray-700'
                }`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default Categories;
