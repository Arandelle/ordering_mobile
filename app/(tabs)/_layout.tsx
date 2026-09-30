import { useCart } from '@/context/CartContext';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useCustomerOrderSummary } from '@/hooks/useOrderSummary';
import { useUnreadCount } from '@/hooks/useNotifications';
import { authClient } from '@/lib/auth-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const ACTIVE_COLOR = '#e13e00';
const INACTIVE_COLOR = '#888';

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
  const { totalItems } = useCart();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: orderSummary } = useCustomerOrderSummary();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const activeOrdersCount =
    (orderSummary?.pending ?? 0) +
    (orderSummary?.preparing ?? 0) +
    (orderSummary?.dispatched ?? 0) +
    (orderSummary?.completed ?? 0);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  const CartHeaderButton = () => (
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

  const NotifHeaderButton = () => (
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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '100',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 12,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },
        tabBarHideOnKeyboard: true,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: { fontSize: 14 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => (
            <Image
              source={require('../../assets/images/harrison_logo_landscape.png')}
              className="h-full w-36"
              resizeMode="contain"
            />
          ),
          headerRight: () => (
            <>
              <NotifHeaderButton />
              <CartHeaderButton />
            </>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          headerTitle: () => (
            <Image
              source={require('../../assets/images/harrison_logo_landscape.png')}
              className="h-full w-36"
              resizeMode="contain"
            />
          ),
          headerRight: () => (
            <>
              <NotifHeaderButton />
              <CartHeaderButton />
            </>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarBadge: isAuthenticated && activeOrdersCount > 0 ? activeOrdersCount : undefined,
          headerRight: () => (
            <>
              <NotifHeaderButton />
              <CartHeaderButton />
            </>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bag-handle' : 'bag-handle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Auth tab — shows sign-in when not authenticated */}
      <Tabs.Screen
        name="auth"
        options={{
          title: 'Sign In',
          href: isAuthenticated ? null : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'log-in' : 'log-in-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      {/* Profile tab — only visible when authenticated */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: isAuthenticated ? undefined : null,
          headerRight: () => (
            <>
              <NotifHeaderButton />
              <CartHeaderButton />
            </>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />

      {/* Cart — hidden from tab bar, accessed via header icon */}
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
          headerShown: true,
          headerTitle: () => (
            <Image
              source={require('../../assets/images/harrison_logo_landscape.png')}
              className="h-full w-36"
              resizeMode="contain"
            />
          ),
          headerRight: () => <CartHeaderButton />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerShown: true,
          headerTitle: () => (
            <Image
              source={require('../../assets/images/harrison_logo_landscape.png')}
              className="h-full w-36"
              resizeMode="contain"
            />
          ),
          headerRight: () => <CartHeaderButton />,
        }}
      />

      {/* Membership — hidden from tab bar, accessed via navigation */}
      <Tabs.Screen
        name="membership"
        options={{
          title: 'Membership',
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontSize: 16, fontWeight: '700' },
        }}
      />

      {/* Wallet — hidden from tab bar, accessed via navigation */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'My Wallet',
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontSize: 16, fontWeight: '700' },
        }}
      />
    </Tabs>
  );
}
