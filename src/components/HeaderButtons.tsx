import { useCart } from '@/context/CartContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export const CartHeaderButton = () => {
  const { totalItems } = useCart();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/cart')}
      style={{ marginRight: 16 }}
      className="flex-row items-center gap-1">
      <View>
        <Ionicons name="cart-outline" size={24} color="#333" />
        {totalItems > 0 && (
          <View className="absolute -right-1.5 -top-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e13e00] px-1">
            <Text className="text-[10px] font-bold text-white">{totalItems}</Text>
          </View>
        )}
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
      onPress={() => router.push('/notifications')}
      style={{ marginRight: 16 }}
      className="flex-row items-center gap-1">
      <View>
        <Ionicons name="notifications-outline" size={24} color="#333" />
        {unreadCount > 0 && (
          <View className="absolute -right-1.5 -top-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e13e00] px-1">
            <Text className="text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
