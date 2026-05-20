import { useCategories } from '@/hooks/useCategories';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const VISIBLE_COUNT = 3;

type CategoriesProps = {
  activeCategory: string | null;
  onCategoryPress: (name: string | null) => void;
};

const Categories = ({ activeCategory, onCategoryPress }: CategoriesProps) => {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();
  const [startIndex, setStartIndex] = useState(0);

  const hasCategories = categories.length > 0;
  const totalPages = Math.ceil(categories.length / VISIBLE_COUNT);
  const currentPage = Math.floor(startIndex / VISIBLE_COUNT);

  const visibleCategories = useMemo(() => {
    if (!hasCategories) return [];
    return Array.from({ length: Math.min(VISIBLE_COUNT, categories.length) }, (_, i) => {
      const index = (startIndex + i) % categories.length;
      return categories[index];
    });
  }, [categories, startIndex, hasCategories]);

  const next = () => {
    if (!hasCategories) return;
    setStartIndex((prev) => (prev + 1) % categories.length);
  };

  const prev = () => {
    if (!hasCategories) return;
    setStartIndex((prev) => (prev - 1 + categories.length) % categories.length);
  };

  if (isLoading) {
    return (
      <View className="mt-4 px-4 py-5">
        <View className="mb-3 px-2">
          <Text className="font-bold italic text-black">Loading food Categories</Text>
        </View>
        <View className="flex-row justify-between px-8">
          {Array.from({ length: VISIBLE_COUNT }).map((_, index) => (
            <View key={index} className="items-center" style={{ width: '25%' }}>
              <View className="mb-2 rounded-xl bg-gray-200" style={{ width: 70, height: 70 }} />
              <View className="h-3 w-16 rounded-full bg-gray-200" />
            </View>
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
    <View className="mt-2 px-4 py-5">
      {/* Header row — title + "All" toggle */}
      <View className="mb-3 flex-row items-center justify-between p-2">
        <View className="mb-3 px-2">
          <Text className="font-bold text-black">Food Categories</Text>
          <Text className="mt-0.5 text-xs text-[#e13e00]">{activeCategory ?? "All Categories"}</Text>
        </View>
        {activeCategory && (
          <TouchableOpacity onPress={() => onCategoryPress(null)}>
            <Text className="font-semibold text-[#e13e00]">Clear filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel Row */}
      <View className="flex-row items-center">
        {/* Prev button */}
        <TouchableOpacity
          onPress={prev}
          disabled={!hasCategories}
          className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft size={16} color="#6B7280" />
        </TouchableOpacity>

        {/* Category items */}
        <View className="flex-1 flex-row justify-between">
          {visibleCategories.map((category) => {
            const isActive = activeCategory === category.name;
            return (
              <TouchableOpacity
                key={category._id}
                onPress={() => onCategoryPress(isActive ? null : category.name)}
                className="items-center"
                style={{ width: '25%' }}
                activeOpacity={0.75}>
                {/* Image with active ring */}
                <View
                  className={`mb-2 h-20 w-20 overflow-hidden rounded-xl `}
                  style={{
                    borderWidth: isActive ? 1 : 0,
                    borderColor: '#e13e00',
                  }}>
                  <Image
                    source={
                      category?.image?.url
                        ? { uri: category.image.url }
                        : require('assets/images/char-icon-white.png')
                    }
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </View>

                {/* Label — active gets colored pill */}
                <View>
                  <Text numberOfLines={2} className="text-center text-xs font-semibold">
                    {category.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button */}
        <TouchableOpacity
          onPress={next}
          disabled={!hasCategories}
          className="ml-2 h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: hasCategories ? '#e13e00' : '#f3f4f6' }}>
          <ChevronRight size={16} color={hasCategories ? '#fff' : '#9ca3af'} />
        </TouchableOpacity>
      </View>

      {/* Dot indicator */}
      {totalPages > 1 && (
        <View className="mt-4 flex-row items-center justify-center">
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              className="mx-0.5 h-1 rounded-sm"
              style={{
                width: i === currentPage ? 20 : 6,
                backgroundColor: i === currentPage ? '#e13e00' : '#e5e7eb',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default Categories;
