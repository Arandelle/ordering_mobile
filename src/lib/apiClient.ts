import { APP_URL } from '@/constant';
import * as SecureStore from 'expo-secure-store';

type ApiError = {
  message: string;
  details?: any;
};

const STORAGE_PREFIX = 'harrison-auth';

async function getCookieHeader(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(`${STORAGE_PREFIX}_cookie`);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Record<string, { value: string; expires: string | null }>;

    const cookieHeader = Object.entries(parsed)
      .filter(([, v]) => !v.expires || new Date(v.expires) > new Date())
      .map(([k, v]) => `${k}=${v.value}`)
      .join('; ');

    return cookieHeader || null;
  } catch {
    return null;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const cookie = await getCookieHeader();

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
