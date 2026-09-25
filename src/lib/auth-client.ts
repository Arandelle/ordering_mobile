import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { APP_URL } from '@/constant';
import { Platform } from 'react-native';
import { DEFAULT_TIMEOUT_MS } from './fetchWithTimeout';

const AUTH_BASE_URL = APP_URL;

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  // better-fetch built-in timeout (AbortController under the hood) so auth
  // calls fail with an error when the backend is unreachable instead of
  // leaving buttons stuck on loading forever.
  fetchOptions: {
    timeout: DEFAULT_TIMEOUT_MS,
  },
  plugins: [
    ...(Platform.OS !== 'web'
      ? [expoClient({ scheme: 'harrison', storagePrefix: 'harrison-auth', storage: SecureStore })]
      : []),
  ],
});


export function getAuthErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  if (typeof error === 'object' && 'statusText' in error && typeof error.statusText === 'string') {
    return error.statusText;
  }
  return fallback;
}
