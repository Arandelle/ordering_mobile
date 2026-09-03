import { useCart } from '@/context/CartContext';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomerOrderSummary } from '@/hooks/useOrderSummary';
import { authClient } from '@/lib/auth-client';

const ACTIVE_COLOR = '#e13e00';
const INACTIVE_COLOR = '#888';

export default function TabLayout() {
  const { cartItems, totalItems, clearCart } = useCart();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  const { data: orderSummary } = useCustomerOrderSummary();

  const activeOrdersCount =
    (orderSummary?.pending ?? 0) +
    (orderSummary?.preparing ?? 0) +
    (orderSummary?.dispatched ?? 0) +
    (orderSummary?.completed ?? 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '100',
          marginBottom: 2,
        },
        tabBarStyle: {
          paddingBottom: 8 + Math.max(insets.bottom, 8),
          paddingTop: 6,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 12,
        },
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
         headerShown: false
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
