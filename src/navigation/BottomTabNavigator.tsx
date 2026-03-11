import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import {
  House,
  ShoppingCart,
  Handbag,
  UserRound,
  Ham,
  LucideIcon,
  Bell,
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import Cart from '@/screens/Cart';
import Orders from '@/screens/Orders';
import Profile from '@/screens/Profile';
import Menu from '@/screens/Menu';
import { Image, TouchableOpacity } from 'react-native';

export type BottomTabParamList = {
  Home: undefined;
  Menu: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const icons: Record<keyof BottomTabParamList, LucideIcon> = {
  Home: House,
  Menu: Ham,
  Cart: ShoppingCart,
  Orders: Handbag,
  Profile: UserRound,
};

const ACTIVE_COLOR = '#e13e00';
const INACTIVE_COLOR = '#888';

const headerConfig: Record<
  keyof BottomTabParamList,
  {
    title?: string;
    showLogo?: boolean;
    showNotification?: boolean;
  }
> = {
  Home: { showLogo: true, showNotification: true },
  Menu: { title: 'Our Menu', showNotification: false },
  Orders: { title: 'My Orders', showNotification: false },
  Cart: { title: 'My Cart', showNotification: false },
  Profile: { title: 'My Profile', showNotification: false },
};

const leftHeader = () => (
  <Image
    source={require('../../assets/images/harrison_logo_landscape.png')}
    style={{ width: 100, height: 35 }}
    resizeMode="contain"
  />
);

const rightHeader = () => (
  <TouchableOpacity style={{ marginRight: 16 }}>
    <Bell size={18} color="#e13e00" />
  </TouchableOpacity>
);

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => {
        const config = headerConfig[route.name];

        return {
          tabBarIcon: ({ color, size, focused }) => {
            const Icon = icons[route.name];
            return <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />;
          },

          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,

          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '100',
            marginBottom: 2,
          },

          tabBarStyle: {
            height: 62,
            paddingTop: 6,
            paddingBottom: 8,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },

          // Header
          headerShown: true,
          headerStyle: {
            height: 70,
            backgroundColor: '#fff', // ✅ solid background
            elevation: 0, // ✅ no shadow Android
            shadowOpacity: 0, // ✅ no shadow iOS
            borderBottomWidth: 0, // ✅ no border line
          },
          headerTitle: config.showLogo ? leftHeader : config.title,
          headerTitleStyle: {
            fontSize: 14,
          },
          headerRight: config.showNotification ? rightHeader : undefined,
        };
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Menu" component={Menu} />
      <Tab.Screen name="Orders" component={Orders} />
      <Tab.Screen
        name="Cart"
        component={Cart}
        options={{
          tabBarBadge: 3,
        }}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
