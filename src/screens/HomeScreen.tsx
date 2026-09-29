import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Banner from '@/components/home/Banner';
import MembershipBanner from '@/components/home/MembershipBanner';
import VipCard from '@/components/home/VipCard';
import WalletBanner from '@/components/home/WalletBanner';
import { authClient } from '@/lib/auth-client';
import { useMembershipStatus } from '@/hooks/useMembership';
import type { ActiveMembership, MembershipTier } from '@/types/membership.type';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BANNER_HORIZONTAL_PADDING = 16;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_HORIZONTAL_PADDING * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH / 2.4);

const DELIVERY_PROMOS = [
  { source: require('../../assets/promos/Slider Banner 1.png') },
  { source: require('../../assets/promos/Slider Banner 2.png') },
  { source: require('../../assets/promos/FreeDeliveryBanner1.png') },
  { source: require('../../assets/promos/DeliveryBanner2.png') },
];

const MENU_PROMOS = [
  { source: require('../../assets/promos/BANNER V1.png') },
  { source: require('../../assets/promos/BANNER V2.png') },
  { source: require('../../assets/promos/BANNER V3.png') },
  { source: require('../../assets/promos/BANNER V4.png') },
];

function PromoCard({ source, onPress }: { source: number; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <Image
          source={source}
          style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
          resizeMode="cover"
        />
        <View className="absolute inset-0 rounded-2xl bg-black/5" />
      </View>
    </TouchableOpacity>
  );
}

const CAROUSEL_WIDTH = Dimensions.get('window').width;
const MEMBERSHIP_WALLET_PAGES = 2;

function MembershipWalletCarousel({
  hasActiveMembership,
  activeMembership,
  memberName,
  activeTier,
}: {
  hasActiveMembership: boolean;
  activeMembership: ActiveMembership | null | undefined;
  memberName: string;
  activeTier: MembershipTier | undefined;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [activePage, setActivePage] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActivePage((prev) => {
        const next = (prev + 1) % MEMBERSHIP_WALLET_PAGES;
        scrollRef.current?.scrollTo({ x: next * CAROUSEL_WIDTH, animated: true });
        return next;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    setActivePage(page);
  };

  return (
    <View className="mt-8">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}>
        {/* Page 1: Membership */}
        <View style={{ width: CAROUSEL_WIDTH }}>
          {hasActiveMembership && activeMembership ? (
            <VipCard
              membership={activeMembership}
              memberName={memberName}
              tierChannel={activeMembership.tierChannel}
              expiresAt={activeMembership.expiresAt ?? activeTier?.validityRule?.expiresAt}
            />
          ) : (
            <MembershipBanner />
          )}
        </View>
        {/* Page 2: Wallet */}
        <View style={{ width: CAROUSEL_WIDTH }}>
          <WalletBanner />
        </View>
      </ScrollView>

      {/* Pagination dots */}
      <View className="mt-3 flex-row items-center justify-center gap-2">
        {Array.from({ length: MEMBERSHIP_WALLET_PAGES }).map((_, i) => (
          <View
            key={i}
            className="rounded-full"
            style={{
              width: activePage === i ? 16 : 6,
              height: 6,
              backgroundColor: activePage === i ? '#e13e00' : '#d1d5db',
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: membershipData } = useMembershipStatus({ enabled: isAuthenticated });

  const activeMembership = membershipData?.activeMembership;
  const hasActiveMembership = activeMembership?.status === 'paid';
  const tiers = membershipData?.tiers ?? [];
  const activeTier = tiers.find((t) => t._id === activeMembership?.tierId);

  const memberName =
    (session?.user?.name ?? '').trim() ||
    [activeMembership?.firstName, activeMembership?.lastName].filter(Boolean).join(' ').trim() ||
    'Member';

  return (
    <ScrollView
      className="flex-1 bg-[#f9f5f2]"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}>
      {/* Section 1: Craving Banner */}
      <Banner />

      {/* Section 2: Membership + Wallet Carousel */}
      <MembershipWalletCarousel
        hasActiveMembership={hasActiveMembership}
        activeMembership={activeMembership}
        memberName={memberName}
        activeTier={activeTier}
      />

      {/* Section 4: Delivery & Deals */}
      <View className="mt-8">
        <View className="mb-3 flex-row items-center justify-between px-4">
          <Text className="text-base font-bold text-gray-900">Delivery & Deals</Text>
          <TouchableOpacity onPress={() => router.push('/menu')}>
            <Text className="text-xs font-semibold text-[#e13e00]">See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={BANNER_WIDTH + 12}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: BANNER_HORIZONTAL_PADDING, gap: 12 }}>
          {DELIVERY_PROMOS.map((promo, index) => (
            <PromoCard
              key={`delivery-${index}`}
              source={promo.source}
              onPress={() => router.push('/menu')}
            />
          ))}
        </ScrollView>
      </View>

      {/* Section 5: Menu Favorites */}
      <View className="mt-8">
        <View className="mb-3 flex-row items-center justify-between px-4">
          <Text className="text-base font-bold text-gray-900">Menu Favorites</Text>
          <TouchableOpacity onPress={() => router.push('/menu')}>
            <Text className="text-xs font-semibold text-[#e13e00]">See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={BANNER_WIDTH + 12}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: BANNER_HORIZONTAL_PADDING, gap: 12 }}>
          {MENU_PROMOS.map((promo, index) => (
            <PromoCard
              key={`menu-${index}`}
              source={promo.source}
              onPress={() => router.push('/menu')}
            />
          ))}
        </ScrollView>
      </View>

      {/* CTA to menu */}
      <View className="mt-10 px-4">
        <TouchableOpacity
          onPress={() => router.push('/menu')}
          activeOpacity={0.85}
          className="items-center rounded-2xl bg-[#e13e00] py-4 shadow-sm">
          <Text className="text-base font-bold text-white">Browse Full Menu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
