import {
  API_BASE_URL,
  API_REQUEST_TIMEOUT_MS,
  apiUrl,
} from '@/core/config/api';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function getAccessToken(): string | null {
  try {
    const { useAuthStore } = require('@/data/store/auth') as typeof import('@/data/store/auth');
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
}

function formatApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: string }).msg ?? '');
        }
        return '';
      })
      .filter(Boolean);
    if (parts.length) return parts.join('. ');
  }
  if (detail && typeof detail === 'object' && 'msg' in detail) {
    return String((detail as { msg?: string }).msg ?? fallback);
  }
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

function networkErrorMessage(err: unknown): string {
  const base = `Cannot reach server (${API_BASE_URL}).`;
  if (err instanceof TypeError) {
    return `${base} On a physical device, use your PC's LAN IP or an active dev tunnel — not localhost.`;
  }
  if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError') {
    return `${base} Request timed out after ${API_REQUEST_TIMEOUT_MS / 1000}s.`;
  }
  return `${base} Check your network and API URL.`;
}

async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchWithTimeout(
  path: string,
  init: RequestInit & { auth?: boolean }
): Promise<Response> {
  const { auth = true, headers, ...rest } = init;
  const token = auth ? getAccessToken() : null;
  const url = apiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  if (__DEV__) {
    console.log(`[api] ${rest.method ?? 'GET'} ${url}`);
  }

  try {
    return await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(rest.body ? { 'Content-Type': 'application/json' } : null),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
        ...(headers ?? null),
      },
    });
  } catch (err) {
    throw {
      status: 0,
      message: networkErrorMessage(err),
      details: err,
    } satisfies ApiError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const res = await fetchWithTimeout(path, init);
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message = formatApiErrorMessage(body, res.statusText || 'Request failed');
    throw { status: res.status, message, details: body } satisfies ApiError;
  }
  return body as T;
}

export type ApiFetchResult<T> = {
  status: number;
  data: T;
};

export async function apiFetchWithStatus<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<ApiFetchResult<T>> {
  const res = await fetchWithTimeout(path, init);
  const body = await parseJsonSafely(res);
  if (!res.ok) {
    const message = formatApiErrorMessage(body, res.statusText || 'Request failed');
    throw { status: res.status, message, details: body } satisfies ApiError;
  }
  return { status: res.status, data: body as T };
}
