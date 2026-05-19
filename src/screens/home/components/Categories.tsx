import { useCategories } from "@/hooks/useCategories";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const VISIBLE_COUNT = 3;

const Categories = () => {
  const { data: categories = [] } = useCategories();
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

  return (
    <View className=" px-4 py-5 mt-2">

        <View className="px-2">
            <Text className="text-black font-bold">Food Categories</Text>
        </View>

      {/* Carousel Row */}
      <View className="flex-row items-center">
        {/* Prev button */}
        <TouchableOpacity
          onPress={prev}
          disabled={!hasCategories}
          className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-gray-100"
        >
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
                activeOpacity={0.75}
              >
                <View
                  className="mb-2 overflow-hidden bg-orange-50"
                  style={{
                    width: 110,
                    height: 110
                  }}
                >
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
                  style={{ color: isActive ? '#e13e00' : '#374151', lineHeight: 14 }}
                >
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
          style={{ backgroundColor: hasCategories ? '#e13e00' : '#f3f4f6' }}
        >
          <ChevronRight size={16} color={hasCategories ? '#fff' : '#9ca3af'} />
        </TouchableOpacity>
      </View>

      {/* Dot indicator */}
      {totalPages > 1 && (
        <View className="mt-4 flex-row items-center justify-center">
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              className="mx-0.5 rounded"
              style={{
                height: 4,
                width: i === currentPage ? 18 : 6,
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