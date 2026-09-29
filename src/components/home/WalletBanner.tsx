import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/helper/formatter';
import { authClient } from '@/lib/auth-client';

const WalletBanner = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: wallet } = useWallet({ enabled: isAuthenticated });
  const balance = wallet?.balance ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/wallet')}
      className="mx-4 overflow-hidden rounded-xl bg-emerald-700 px-6 py-5 shadow-lg">
      {/* Decorative blobs */}
      <View className="absolute -right-10 -top-2 h-40 w-40 rounded-full bg-white/10" />
      <View className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-emerald-500/20" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="wallet-outline" size={14} color="#a7f3d0" />
            <Text className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
              My Wallet
            </Text>
          </View>

          <Text className="mt-2 text-2xl font-extrabold leading-tight text-white">
            {isAuthenticated ? formatMoney(balance) : 'Top Up & Pay'}
          </Text>

          <Text className="mt-2 text-sm leading-5 text-white/70">
            {isAuthenticated
              ? 'Use your wallet balance for faster checkout.'
              : 'Load your wallet and pay instantly at checkout.'}
          </Text>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default WalletBanner;
