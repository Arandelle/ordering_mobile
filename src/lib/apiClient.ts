import { APP_URL } from '@/constant';
import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_TIMEOUT_MS,
  TIMEOUT_MESSAGE,
  fetchWithTimeout,
  isTimeoutError,
} from './fetchWithTimeout';

type ApiErrorCode = 'TIMEOUT' | 'NETWORK' | 'INVALID_JSON' | 'HTTP';

export type ApiError = {
  message: string;
  code?: ApiErrorCode;
  status?: number;
  details?: any;
};

/** Per-call options accepted by every apiClient method. */
export type RequestOptions = {
  /** Timeout override in milliseconds (`0` disables, e.g. for known-slow endpoints). */
  timeoutMs?: number;
};

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

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

async function request<T>(
  url: string,
  options?: RequestInit,
  requestOptions?: RequestOptions,
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = requestOptions ?? {};
  const headers = new Headers(options?.headers);
  const cookie = await getCookieHeader();

  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (cookie && !headers.has('cookie')) {
    headers.set('cookie', cookie);
  }

  const fullUrl = APP_URL + '/api' + url;

  let response;
  try {
    response = await fetchWithTimeout(fullUrl, { ...options, headers }, timeoutMs);
  } catch (err: any) {
    if (isTimeoutError(err)) {
      throw {
        message: TIMEOUT_MESSAGE,
        code: 'TIMEOUT',
        details: { url: fullUrl, timeoutMs },
      } as ApiError;
    }
    throw {
      message:
        'Network error — unable to reach the server. Please check your connection and try again.',
      code: 'NETWORK',
      details: { url: fullUrl, error: err?.message },
    } as ApiError;
  }

  let data: any;
  try {
    const raw = await response.text();
    data = JSON.parse(raw);
  } catch (err: any) {
    throw {
      message: 'Invalid JSON from server',
      code: 'INVALID_JSON',
      details: { url: fullUrl, status: response.status },
    } as ApiError;
  }

  if (!response.ok) {
    throw {
      message: data?.error || 'Request failed',
      code: 'HTTP',
      status: response.status,
      details: data,
    } as ApiError;
  }

  return data;
}

export const apiClient = {
  get: <T>(url: string, requestOptions?: RequestOptions) =>
    request<T>(url, { method: 'GET' }, requestOptions),

  post: <T, B = unknown>(url: string, body?: B, requestOptions?: RequestOptions) =>
    request<T>(
      url,
      { method: 'POST', body: body ? JSON.stringify(body) : undefined },
      requestOptions,
    ),

  put: <T>(url: string, body?: unknown, requestOptions?: RequestOptions) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }, requestOptions),

  patch: <T>(url: string, body?: unknown, requestOptions?: RequestOptions) =>
    request<T>(
      url,
      { method: 'PATCH', body: body ? JSON.stringify(body) : undefined },
      requestOptions,
    ),

  delete: <T>(url: string, requestOptions?: RequestOptions) =>
    request<T>(url, { method: 'DELETE' }, requestOptions),
};
