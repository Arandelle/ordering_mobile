/**
 * Default deadline for any outbound HTTP call made by this app.
 *
 * A server that is down or unreachable can never report an error itself —
 * the connection just hangs — so the client owns this deadline and turns
 * "loading forever" into a user-facing error.
 */
export const DEFAULT_TIMEOUT_MS = 10_000;

export const TIMEOUT_MESSAGE =
  'The server took too long to respond. Please check your connection and try again.';

export class TimeoutError extends Error {
  readonly code = 'TIMEOUT' as const;
  readonly url: string;
  readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(TIMEOUT_MESSAGE);
    this.name = 'TimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * `fetch()` with a deadline. Aborting the signal truly cancels the native
 * request instead of leaving it running in the background.
 *
 * @param timeoutMs pass `0` to disable the timeout for a specific call.
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : undefined;

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (timedOut || err?.name === 'AbortError') {
      console.error(`[fetchWithTimeout] Timed out after ${timeoutMs}ms:`, url);
      throw new TimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
