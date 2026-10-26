import { useCart } from '@/context/CartContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from './ui/Icon';

const CountBadge = (count: number | string) => {
  return (
    <View className="absolute -right-1.5 -top-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e13e00] px-1">
      <Text className="text-[10px] font-bold text-white">{count}</Text>
    </View>
  );
};

export const CartHeaderButton = () => {
  const { totalItems } = useCart();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/pages/cart')}
      style={{ marginRight: 16 }}
      className="flex-row items-center gap-1">
      <View>
        <Icon name="ShoppingCart" size={22} color="#4b5563" />
        {totalItems > 0 && CountBadge(totalItems > 99 ? '99+' : totalItems)}
      </View>
    </TouchableOpacity>
  );
};

export const NotifHeaderButton = () => {
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => router.navigate('/pages/notifications')}
      style={{ marginRight: 16 }}
      className="flex-row items-center gap-1">
      <View>
        <Icon name="Bell" size={22} color="#4b5563" />
        {unreadCount > 0 && CountBadge(unreadCount > 99 ? '99+' : unreadCount)}
      </View>
    </TouchableOpacity>
  );
};
