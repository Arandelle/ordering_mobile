import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { CartProvider } from '@/context/CartContext';
import { BranchProvider } from '@/context/BranchContext';

const queryClient = new QueryClient();

// Register here all route
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <BranchProvider>
          <CartProvider>
            <Stack
              screenOptions={{
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: '#111827',
                headerShown: false
              }}>
              <Stack.Screen
                name="(tabs)"
              />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="orders/[id]" 
              options={{
                headerShown: true,
                title: "Order Details"
              }}
              />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="review/[id]" options={{
                headerShown: true,
                title: "Review"
              }} />
              <Stack.Screen
                name="wallet/index"
                options={{
                  headerShown: true,
                  title: 'My Wallet',
                }}
              />
            </Stack>
          </CartProvider>
        </BranchProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
