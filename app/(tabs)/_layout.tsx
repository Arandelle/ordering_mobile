import { CartHeaderButton, NotifHeaderButton } from '@/components/HeaderButtons';
import { Icon } from '@/components/ui/Icon';
import { useCustomerOrderSummary } from '@/hooks/useOrderSummary';
import { authClient } from '@/lib/auth-client';
import { Tabs } from 'expo-router';
import { TabsScreenOptions } from 'expo-router/build/layouts/TabsClient.js';
import { ____ColorValue_Internal } from 'node_modules/react-native/types_generated/Libraries/StyleSheet/StyleSheetTypes';
import { Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_COLOR = '#e13e00';
const INACTIVE_COLOR = '#888';

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
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
  
  type TabConfig = {
    title: string;
    icon: string;
    showHeader?: boolean;
    badge?: number;
    href?: string | null | undefined;
  };

  const TAB_SCREEN_OPTIONS = (props: TabConfig): TabsScreenOptions => {
    return {
      title: props.title,
      tabBarBadge: props.badge,
      headerShown: props.showHeader,
      href: props.href,
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
      tabBarIcon: ({
        color,
        size,
        focused,
      }: {
        color: ____ColorValue_Internal;
        size: number;
        focused: boolean;
      }) => <Icon name={props.icon} size={size} color={color as string} />,
    };
  };

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
        name="pages/index"
        options={TAB_SCREEN_OPTIONS({
          title: 'Home',
          icon: 'Home',
        })}
      />

      <Tabs.Screen
        name="pages/menu"
        options={TAB_SCREEN_OPTIONS({
          title: 'Menu',
          icon: 'Utensils',
        })}
      />

      <Tabs.Screen
        name="pages/orders"
        options={TAB_SCREEN_OPTIONS({
          title: 'Orders',
          icon: 'ShoppingBag',
          badge: isAuthenticated && activeOrdersCount > 0 ? activeOrdersCount : undefined,
        })}
      />

      {/* Auth tab — shows sign-in when not authenticated */}
      <Tabs.Screen
        name="pages/auth"
        options={TAB_SCREEN_OPTIONS({
          title: 'Sign-in',
          icon: 'LogIn',
          href: isAuthenticated ? null : undefined,
        })}
      />

      {/* Profile tab — only visible when authenticated */}
      <Tabs.Screen
        name="pages/profile"
        options={TAB_SCREEN_OPTIONS({
          title: 'Profile',
          icon: 'User',
          href: isAuthenticated ? undefined : null,
        })}
      />
    </Tabs>
  );
}
