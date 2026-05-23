import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import { CartProvider } from '@/context/CartContext';
import { BranchProvider } from '@/context/BranchContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" />
          </Stack>
        </CartProvider>
      </BranchProvider>
    </QueryClientProvider>
  );
}