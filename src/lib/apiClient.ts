import { APP_URL } from '@/constant';
import * as SecureStore from 'expo-secure-store';
import { authClient } from './auth-client';

type ApiError = {
  message: string;
  details?: any;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const cookie = authClient.getCookie();

  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (cookie && !headers.has('cookie')) {
    headers.set('cookie', cookie);
  }

  const response = await fetch(APP_URL + '/api' + url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw {
      message: data?.error || 'Request failed',
      details: data,
    } as ApiError;
  }

  return data;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),

  post: <T, B = unknown>(url: string, body?: B) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
