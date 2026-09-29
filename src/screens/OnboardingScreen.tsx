import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDES = [
  {
    animation: require('../../assets/lottie/Order.json'),
    title: 'Order Your Favorites',
    subtitle:
      'Browse our full menu of freshly grilled Inasal & BBQ meals. Customize combos, pick your sides, and add to cart in seconds.',
  },
  {
    animation: require('../../assets/lottie/Order Complete.json'),
    title: 'Delivery, Pickup & Dine-In',
    subtitle:
      'Get food delivered to your door, schedule a pickup, or reserve a table for dine-in — all from one app.',
  },
  {
    animation: require('../../assets/lottie/members.json'),
    title: 'Membership & Wallet',
    subtitle:
      'Unlock VIP discounts, earn cashback, and pay instantly with your in-app wallet. Top up anytime via Maya.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const goToNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_WIDTH, animated: true });
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('has_completed_onboarding', 'true');
    router.replace('/(tabs)');
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-[#f9f5f2]" style={{ paddingTop: insets.top }}>
      {/* Skip button */}
      <TouchableOpacity
        onPress={handleGetStarted}
        className="absolute right-4 z-10 px-3 py-2"
        style={{ top: insets.top + 8 }}>
        <Text className="text-sm font-semibold text-gray-400">Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}>
        {SLIDES.map((slide, index) => (
          <View
            key={index}
            style={{ width: SCREEN_WIDTH }}
            className="items-center justify-center px-8">
            {/* Lottie animation */}
            <LottieView
              source={slide.animation}
              autoPlay
              loop
              style={{ width: 240, height: 240, marginBottom: 24 }}
            />

            {/* Title */}
            <Text className="mb-4 text-center text-2xl font-bold text-gray-900">
              {slide.title}
            </Text>

            {/* Subtitle */}
            <Text className="text-center text-base leading-relaxed text-gray-500">
              {slide.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom section */}
      <View className="px-6 pb-8 space-y-4 gap-4" style={{ paddingBottom: insets.bottom + 32 }}>
        {/* Pagination dots */}
        <View className="mb-8 flex-row items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className="rounded-full"
              style={{
                width: activeIndex === i ? 20 : 8,
                height: 8,
                backgroundColor: activeIndex === i ? '#e13e00' : '#d1d5db',
              }}
            />
          ))}
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={isLastSlide ? handleGetStarted : goToNext}
          activeOpacity={0.85}
          className="items-center rounded-2xl bg-[#e13e00] py-4 shadow-md">
          <Text className="text-base font-bold text-white">
            {isLastSlide ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
