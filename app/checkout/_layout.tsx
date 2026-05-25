import { Stack } from 'expo-router';

export default function CheckoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
      }}>
      <Stack.Screen name="index" options={{ title: 'Personal Details' }} />
      <Stack.Screen name="address" options={{ title: 'Address Details' }} />
    </Stack>
  );
}
