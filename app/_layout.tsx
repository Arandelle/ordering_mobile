import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import '../global.css';
import { CartProvider } from '@/context/CartContext';
import { BranchProvider } from '@/context/BranchContext';
import { isApiError } from '@/lib/apiClient';
import { isTimeoutError } from '@/lib/fetchWithTimeout';

/**
 * TanStack Query's default retries failed queries 3 times with exponential
 * backoff, which keeps screens "loading" for a very long time when the
 * backend is unreachable. Fail fast instead: timeouts never retry (the
 * backend is likely down), network errors retry once (flaky connections),
 * and 4xx responses won't change on retry either.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (isTimeoutError(error)) return false;
        if (isApiError(error)) {
          if (error.code === 'TIMEOUT') return false;
          if (error.code === 'NETWORK') return failureCount < 1;
          if (error.status !== undefined && error.status < 500) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Set to true during development to reset onboarding and see it again
const RESET_ONBOARDING = false;

// Register here all route
export default function RootLayout() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      if (__DEV__ && RESET_ONBOARDING) {
        await AsyncStorage.removeItem('has_completed_onboarding');
      }
      const value = await AsyncStorage.getItem('has_completed_onboarding');
      setHasOnboarded(value === 'true');
    })();
  }, []);

  if (hasOnboarded === null) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <BranchProvider>
          <CartProvider>
            <StatusBar barStyle="dark-content" />
            {!hasOnboarded ? (
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="onboarding" />
              </Stack>
            ) : (
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
              </Stack>
            )}
          </CartProvider>
        </BranchProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
