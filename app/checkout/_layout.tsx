import { Stack } from 'expo-router';
import { useBranchContext } from '@/context/BranchContext';
import { CheckoutProvider } from '@/context/CheckoutContext';

export default function CheckoutLayout() {
  const { selectedBranch } = useBranchContext();

  return (
    <CheckoutProvider selectedBranch={selectedBranch}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
        }}>
        <Stack.Screen name="index" options={{ title: 'Checkout' }} />
        <Stack.Screen name="address" options={{ title: 'Delivery Address' }} />
        <Stack.Screen name="review" options={{ title: 'Review Order' }} />
      </Stack>
    </CheckoutProvider>
  );
}
