import { Stack } from 'expo-router';

export default function ReviewLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111827',
      }}>
        <Stack.Screen name='[id]' options={{ title: "Review Order"}}/>
      </Stack>
  );
}
