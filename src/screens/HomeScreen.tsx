import React, { useRef, useState, useEffect } from 'react';
import {
  Text,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { Tag, Clock, ChevronRight, Flame, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

// ─── Data ─────────────────────────────────────────────────────────────────

const banners = [
  {
    id: '1',
    label: '🔥 Flash Sale',
    title: '50% Off\nChicken Inasal',
    subtitle: 'Today only • Limited slots',
    cta: 'Grab Deal',
    bg: ['#b91c1c', '#e13e00'],
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
  },
  {
    id: '2',
    label: '🎉 Bundle Deal',
    title: 'Family Feast\nFor ₱599',
    subtitle: '4 pcs chicken + 4 rice + drinks',
    cta: 'Order Now',
    bg: ['#92400e', '#b45309'],
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
  },
  {
    id: '3',
    label: '⭐ New Item',
    title: 'Try Our\nKansi Soup',
    subtitle: 'Rich bone broth • Filipino classic',
    cta: 'Try Now!',
    bg: ['#065f46', '#047857'],
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
  },
];

const promos = [
  {
    id: '1',
    icon: '🍗',
    title: 'Buy 2 Get 1',
    desc: 'Chicken Inasal Paa',
    badge: 'HOT',
    badgeColor: '#e13e00',
  },
  {
    id: '2',
    icon: '🥤',
    title: 'Free Drinks',
    desc: 'On orders ₱300+',
    badge: 'NEW',
    badgeColor: '#059669',
  },
  {
    id: '3',
    icon: '🍚',
    title: 'Unli Rice',
    desc: 'Every combo meal',
    badge: 'ALWAYS',
    badgeColor: '#b45309',
  },
  {
    id: '4',
    icon: '🎂',
    title: 'Birthday Treat',
    desc: 'Free dessert on bday',
    badge: 'SPECIAL',
    badgeColor: '#7c3aed',
  },
];

const topPicks = [
  {
    id: '1',
    name: 'Chicken Inasal Paa',
    price: 129,
    originalPrice: 159,
    rating: 4.9,
    orders: '2.3k',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400',
  },
  {
    id: '2',
    name: 'BBQ Liempo',
    price: 179,
    originalPrice: null,
    rating: 4.8,
    orders: '1.8k',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
  },
  {
    id: '3',
    name: 'Kansi Soup',
    price: 119,
    originalPrice: null,
    rating: 4.6,
    orders: '980',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
  },
];

// ─── Banner Carousel ──────────────────────────────────────────────────────
function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const onScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="h-54 ml-2 overflow-hidden rounded-xl" style={{ width: BANNER_WIDTH }}>
            {/* BG Image */}
            <Image source={{ uri: item.image }} className="absolute inset-0" resizeMode="cover" />

            {/* Content */}
            <View className="flex-1 justify-end p-5">
              <View className="max-w-3/4">
                {/* Label */}
                <View className="flex flex-row items-center gap-2">
                  <Text className="mb-1.5 flex flex-row items-center gap-2 rounded-xl bg-gray-50 px-2 py-1 text-xs font-semibold">
                    {item.label}
                  </Text>
                </View>

                {/* Title */}
                <Text className="mb-1 text-2xl font-bold leading-8 text-[#e13e00]">
                  {item.title}
                </Text>
                <Text className="mb-2 text-sm font-bold text-white">{item.subtitle}</Text>

                {/* CTA */}
                <TouchableOpacity className="flex-row items-center gap-1 self-start rounded-xl bg-[#e13e00] px-4 py-2">
                  <Text className="text-sm font-semibold text-white">{item.cta}</Text>
                  <ChevronRight size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Dots */}
      <View className="mt-2.5 flex flex-row justify-center gap-1.5">
        {banners.map((_, i) => (
          <View
            key={i}
            className={`h-1.5 rounded-lg ${i === activeIndex ? 'w-5 bg-[#e13e00]' : 'w-2 bg-gray-400'}`}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Promo Pills ──────────────────────────────────────────────────────────
function PromoPills() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.promoRow}>
      {promos.map((p) => (
        <TouchableOpacity
          key={p.id}
          className="elevation-sm flex w-52 flex-row items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm shadow-black">
          <Text className="text-2xl">{p.icon}</Text>
          <View className="flex-1">
            <View className="mb-1 flex flex-row items-center gap-1.5">
              <Text className="text-sm font-semibold text-gray-700">{p.title}</Text>
              <View className="rounded-sm px-1.5 py-1">
                <Text
                  className={`text-xs font-bold tracking-tighter`}
                  style={{ color: p.badgeColor }}>
                  {p.badge}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-500">{p.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Top Picks ────────────────────────────────────────────────────────────
function TopPicks() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.picksRow}>
      {topPicks.map((item) => (
        <TouchableOpacity
          key={item.id}
          className="elevation w-36 overflow-hidden rounded-xl bg-white shadow-sm ">
          <Image source={{ uri: item.image }} className="h-28 w-full" resizeMode="cover" />

          {item.originalPrice && (
            <View className="bg[#e13e00] absolute left-2 top-2 flex flex-row items-center gap-1.5 rounded-md px-2 py-1">
              <Tag size={9} color="#fff" />
              <Text className="text-sm font-bold text-white">SALE</Text>
            </View>
          )}
          <View className="p-2.5">
            <Text className="mb-1 text-sm font-semibold text-gray-800 " numberOfLines={1}>
              {item.name}
            </Text>
            <View className="mb-1.5 flex flex-row gap-1.5">
              <Star size={10} color="#facc15" fill="#facc15" />
              <Text className="text-sm text-[#6b7280]">{item.rating}</Text>
              <Text className="text-sm text-[#9ca3af]">• {item.orders} orders</Text>
            </View>
            <View className="flex flex-row items-center gap-1.5">
              <Text className="text-lg font-semibold text-[#e13e00]">₱{item.price}</Text>
              {item.originalPrice && (
                <Text className="text-lg text-[#9ca3af] line-through">₱{item.originalPrice}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────
function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View className="mb-3 flex flex-row items-center justify-between px-4">
      <Text className="text-lg font-semibold text-gray-700">{title}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress} className="flex flex-row items-center gap-0.5">
          <Text className="text-sm font-semibold text-[#e13e00]">See all</Text>
          <ChevronRight size={14} color="#e13e00" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-[#f9f5f2]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Greeting */}
      <View className="px-4 pb-8 pt-4">
        <View>
          <Text className="text-sm text-gray-500">Good afternoon 👋</Text>
          <Text className="text-xl font-bold text-gray-800">What are you craving?</Text>
        </View>
      </View>

      {/* Banner Carousel */}
      <View className="px-4">
        <BannerCarousel />
      </View>

      {/* Promos */}
      <View className="mt-6">
        <SectionHeader title="🎁 Ongoing Promos" />
        <PromoPills />
      </View>

      {/* Top Picks */}
      <View className="mt-6">
        <SectionHeader title="⭐ Top Picks" onPress={() => {}} />
        <TopPicks />
      </View>
      {/* Wide sale banner */}
      <View className="mx-4 mt-6">
        <TouchableOpacity className="h-40 overflow-hidden rounded-2xl">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' }}
            className="absolute h-full w-full"
            resizeMode="cover"
          />
          <View className="absolute h-full w-full bg-black/20" />
          <View className="flex-1 justify-center p-4">
            <Text className="mb-1 text-sm font-semibold tracking-widest text-[#e13e00]">
              LIMITED TIME OFFER
            </Text>
            <Text className="mb-1 text-lg font-bold text-white">Family Feast Bundle</Text>
            <Text className="mb-2.5 text-sm text-white">4 chicken + 4 rice + 2 drinks</Text>
            <View className="flex flex-row items-center gap-2">
              <Text className="text-lg font-bold text-white">₱599</Text>
              <Text className="text-lg line-through">₱780</Text>
              <View className="rounded-sm bg-[#facc15] px-2 py-1">
                <Text className="text-sm font-bold text-[#7c2d12]">-23%</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Promo pills
  promoRow: {
    paddingHorizontal: 16,
    gap: 10,
  },

  // Top picks
  picksRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
