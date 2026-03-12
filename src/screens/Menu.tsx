import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { ShoppingCart, Plus, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 2 columns with padding

// ─── Types ────────────────────────────────────────────────────────────────
type FoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: { uri: string };
  rating: number;
  isFeatured?: boolean;
  tag?: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────
const categories = ['All', 'Inasal', 'Grills', 'Soups', 'Sides', 'Drinks'];

const foodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Chicken Inasal Paa',
    description: 'Juicy grilled chicken leg marinated in native spices',
    price: 129,
    category: 'Inasal',
    image: { uri: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600' },
    rating: 4.9,
    isFeatured: true,
    tag: 'Bestseller',
  },
  {
    id: '2',
    name: 'Chicken Inasal Pecho',
    description: 'Tender breast fillet with signature bacolod marinade',
    price: 149,
    category: 'Inasal',
    image: { uri: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600' },
    rating: 4.7,
    tag: 'New',
  },
  {
    id: '3',
    name: 'BBQ Liempo',
    description: 'Slow-grilled pork belly glazed in sweet BBQ sauce',
    price: 179,
    category: 'Grills',
    image: { uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600' },
    rating: 4.8,
  },
  {
    id: '4',
    name: 'Kansi Soup',
    description: 'Rich bone broth soup with tender beef and banana blossom',
    price: 119,
    category: 'Soups',
    image: { uri: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600' },
    rating: 4.6,
    tag: 'Hot Pick',
  },
  {
    id: '5',
    name: 'Java Rice',
    description: 'Fragrant orange rice fried in chicken oil',
    price: 39,
    category: 'Sides',
    image: { uri: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600' },
    rating: 4.5,
  },
  {
    id: '6',
    name: 'Halo-Halo',
    description: 'Classic Filipino shaved ice dessert with ube and leche flan',
    price: 89,
    category: 'Drinks',
    image: { uri: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600' },
    rating: 4.7,
  },
  {
    id: '7',
    name: 'Pork BBQ Skewer',
    description: 'Sweet and smoky marinated pork on bamboo skewer',
    price: 49,
    category: 'Grills',
    image: { uri: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600' },
    rating: 4.4,
  },
  {
    id: '8',
    name: 'Sinigang na Baboy',
    description: 'Sour tamarind broth with tender pork and vegetables',
    price: 139,
    category: 'Soups',
    image: { uri: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600' },
    rating: 4.6,
  },
];

// ─── Tag color helper ─────────────────────────────────────────────────────
function tagStyle(tag: string) {
  switch (tag) {
    case 'Bestseller':
      return { bg: '#fff1ec', text: '#e13e00' };
    case 'New':
      return { bg: '#ecfdf5', text: '#059669' };
    case 'Hot Pick':
      return { bg: '#fffbeb', text: '#b45309' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

// ─── Featured Card ────────────────────────────────────────────────────────
function FeaturedCard({ item, onAdd }: { item: FoodItem; onAdd: () => void }) {
  return (
    <View className="h-56 overflow-hidden rounded-xl bg-gray-200">
      <Image source={item.image} className="absolute h-full w-full" resizeMode="cover" />

      {/* Dark overlay for readability */}
      <View className="absolute h-full w-full bg-black/30" />

      {/* Tag */}
      {item.tag && (
        <View className="absolute left-3 top-3 rounded-md bg-[#e13e00] px-3 py-1">
          <Text className="text-sm font-semibold text-white">{item.tag}</Text>
        </View>
      )}

      {/* Bottom info */}
      <View className="flex-1 justify-end p-4">
        <View className="flex-row items-end gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-white ">{item.name}</Text>
            <Text className="text-sm text-gray-200" numberOfLines={1}>
              {item.description}
            </Text>

            <View className="mt-1 flex-row items-center gap-1">
              <Star size={12} color="#facc15" fill="#facc15" />
              <Text className="mr-2 text-sm font-semibold text-[#facc15]">{item.rating}</Text>
              <Text className="text-sm font-bold text-white">₱{item.price}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-xl bg-[#e13e00]"
            onPress={onAdd}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────
function GridCard({ item, onAdd }: { item: FoodItem; onAdd: () => void }) {
  const colors = item.tag ? tagStyle(item.tag) : null;

  return (
    <View
      className="elevation overflow-hidden rounded-2xl bg-white shadow-md"
      style={{ width: CARD_WIDTH }}>
      <View className="relative">
        <Image source={item.image} className="h-32 w-full" resizeMode="cover" />
        {item.tag && colors && (
          <View className="absolute left-2 top-2 px-2 py-1" style={{ backgroundColor: colors.bg }}>
            <Text
              className="text-xs font-bold uppercase tracking-tighter"
              style={{ color: colors.text }}>
              {item.tag}
            </Text>
          </View>
        )}
      </View>

      <View className="p-2.5">
        <Text className="mb-1 text-sm font-bold text-gray-500" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mb-2 text-sm leading-4 text-[#9ca3af]" numberOfLines={2}>
          {item.description}
        </Text>
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-[#e13e00]">₱{item.price}</Text>
            <View className="mt-0.5 flex flex-row items-center gap-1">
              <Star size={10} color="#facc15" fill="#facc15" />
              <Text className="text-sm text-[#9ca3af]">{item.rating}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-xl bg-[#e13e00]"
            onPress={onAdd}>
            <Plus size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function MenuScreen() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered =
    activeCategory === 'All' ? foodItems : foodItems.filter((i) => i.category === activeCategory);

  const featured = filtered.find((i) => i.isFeatured) ?? filtered[0];
  const gridItems = filtered.filter((i) => i.id !== featured?.id);

  return (
    <ScrollView className="flex-1 bg-[#f9f5f2]" showsVerticalScrollIndicator={false}>
      {/* ── Category Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3.5"
        contentContainerStyle={styles.tabsContent}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={`rounded-3xl border px-4 py-2 ${isActive ? 'border-[#e13e00] bg-[#e13e00]/80' : 'border-[#e5e7eb] bg-white'}`}>
              <Text className={`text-sm font-semibold text-gray-500 ${isActive && 'text-white'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Featured Banner ── */}
      {featured && (
        <View className="mt-5 px-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">Featured</Text>
          <FeaturedCard item={featured} onAdd={() => console.log('add', featured.id)} />
        </View>
      )}
      {/* ── Grid ── */}
      {gridItems.length > 0 && (
        <View className="mt-5 px-4">
          <Text className="mb-3 text-[16px] font-bold text-gray-700">All Items</Text>
          <View className="flex flex-row flex-wrap gap-4">
            {gridItems.map((item) => (
              <GridCard key={item.id} item={item} onAdd={() => console.log('add', item.id)} />
            ))}
          </View>
        </View>
      )}

      <View className="h-6" />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
});
