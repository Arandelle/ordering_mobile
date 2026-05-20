import { useCategories } from '@/hooks/useCategories';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';

const VISIBLE_COUNT = 3;

const Categories = () => {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();
  const [startIndex, setStartIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      <View className="mt-12">
        <View className="px-6 mb-4">
          <Text className="font-bold text-black">Food Categories</Text>
        </View>
        <View className=" flex-row justify-between px-8">
          {Array.from({ length: VISIBLE_COUNT }).map((_, index) => (
            <View key={index} className="animate-pulse items-center" style={{ width: '25%' }}>
              <View className="mb-2 rounded-xl bg-gray-300" style={{ width: 110, height: 110 }} />
              <View className="h-3 w-20 rounded-full bg-gray-300" />
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
    <View className=" mt-2 px-4 py-5">
      <View className="px-2">
        <Text className="font-bold text-black">Food Categories</Text>
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
            const isActive = activeId === category._id;
            return (
              <TouchableOpacity
                key={category._id}
                onPress={() => setActiveId(isActive ? null : category._id)}
                className="items-center"
                style={{ width: '25%' }}
                activeOpacity={0.75}>
                <View
                  className="mb-2 overflow-hidden"
                  style={{
                    width: 110,
                    height: 110,
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
                  {isActive && (
                    <View
                      className="absolute bottom-0 left-0 right-0 bg-[#e13e00]"
                      style={{ height: 3 }}
                    />
                  )}
                </View>

                <Text
                  numberOfLines={2}
                  className="text-center text-xs font-semibold"
                  style={{ color: isActive ? '#e13e00' : '#374151', lineHeight: 14 }}>
                  {category.name}
                </Text>
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
              className={`mx-0.5 rounded-sm h-1 ${i === currentPage ? "w-5 bg-[#e13e00]" : "w-2 bg-gray-300"}`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default Categories;
