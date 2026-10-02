import { Heart } from 'lucide-react-native';
import { useCategories } from '@/hooks/useCategories';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Category } from '@/types/categories.type';

type CategoriesProps = {
  activeCategory: string | null;
  onCategoryPress: (name: string | null) => void;
};

const FAVOURITES_PILL_KEY = '__favourites__';

type PillItem = { _id: string; name: string; isFavPill?: boolean };

const Categories = ({ activeCategory, onCategoryPress }: CategoriesProps) => {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  const isFavouritesActive = activeCategory === FAVOURITES_PILL_KEY;

  const pills: PillItem[] = [
    { _id: FAVOURITES_PILL_KEY, name: 'Favourites', isFavPill: true },
    ...categories.map((c: Category) => ({ _id: c._id, name: c.name })),
  ];

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
            {isFavouritesActive ? 'My Favourites' : (activeCategory ?? 'All Categories')}
          </Text>
        </View>
        {(activeCategory || isFavouritesActive) && (
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
        data={pills}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isActive = item.isFavPill ? isFavouritesActive : activeCategory === item.name;

          return (
            <TouchableOpacity
              onPress={() => onCategoryPress(isActive ? null : (item.isFavPill ? item._id : item.name))}
              activeOpacity={0.75}
              className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                isActive ? 'bg-brand-500' : 'bg-gray-100'
              }`}>
              {item.isFavPill && (
                <Heart
                  size={14}
                  color={isActive ? '#fff' : '#ef4501'}
                  fill={isActive ? '#fff' : 'transparent'}
                />
              )}
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
