import { useCart } from '@/context/CartContext';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Text, TouchableOpacity } from 'react-native';
import { useCustomerOrderSummary } from '@/hooks/useOrderSummary';
import { authClient } from '@/lib/auth-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_COLOR = '#e13e00';
const INACTIVE_COLOR = '#888';

const TAB_BAR_CONTENT_HEIGHT = 56; // icon + label area, excluding safe area

export default function TabLayout() {
  const { cartItems, totalItems, clearCart } = useCart();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  const insets = useSafeAreaInsets();

  const { data: orderSummary } = useCustomerOrderSummary();

  const activeOrdersCount =
    (orderSummary?.pending ?? 0) +
    (orderSummary?.preparing ?? 0) +
    (orderSummary?.dispatched ?? 0) +
    (orderSummary?.completed ?? 0);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

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
          backgroundColor: '#fff', // was 'green' — likely leftover debug color
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
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Ionicons name="notifications-outline" size={20} color="#e13e00" />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarBadge: isAuthenticated && activeOrdersCount > 0 ? activeOrdersCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bag-handle' : 'bag-handle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={() => ({
          title: 'My Cart',
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          headerRight: () =>
            cartItems.length > 0 ? (
              <TouchableOpacity onPress={() => clearCart()} style={{ marginRight: 16 }}>
                <Text
                  style={{
                    color: '#e13e00',
                    fontSize: 13,
                    fontWeight: '500',
                  }}>
                  Clear
                </Text>
              </TouchableOpacity>
            ) : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
        })}
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
          title: 'My Profile',
          href: isAuthenticated ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
