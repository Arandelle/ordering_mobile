import { Tabs } from 'expo-router';
import { House, ShoppingCart, Handbag, UserRound, Utensils, Bell } from 'lucide-react-native';
import { Image, TouchableOpacity } from 'react-native';

const ACTIVE_COLOR = '#e13e00';
const INACTIVE_COLOR = '#888';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '100', marginBottom: 2 },
        tabBarStyle: {
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 12,
        },
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontSize: 14 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => (
            <Image
              source={require('../../assets/images/harrison_logo_landscape.png')}
              style={{ width: 100, height: 35 }}
              resizeMode="contain"
            />
          ),
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Bell size={18} color="#e13e00" />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <House size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Our Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <Utensils size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <Handbag size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'My Cart',
          tabBarBadge: 3,
          tabBarIcon: ({ color, size, focused }) => (
            <ShoppingCart size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <UserRound size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
