import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MembershipBanner = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/membership')}
      className="mx-4 mt-8 overflow-hidden rounded-[28px] bg-gray-900 px-6 py-5 shadow-lg">
      {/* Decorative blobs */}
      <View className="absolute -right-10 -top-2 h-40 w-40 rounded-full bg-brand-500/20" />
      <View className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/5" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="star" size={14} color="#f3d78c" />
            <Text className="text-xs font-semibold uppercase tracking-widest text-[#f3d78c]">
              Harrison VIP
            </Text>
          </View>

          <Text className="mt-2 text-2xl font-extrabold leading-tight text-white">
            Unlock Exclusive{'\n'}Benefits
          </Text>

          <Text className="mt-2 text-sm leading-5 text-white/70">
            Discounts, special events, and more — become a member today.
          </Text>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MembershipBanner;
