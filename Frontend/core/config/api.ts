import Constants from 'expo-constants';

// ─── API Base URL ───────────────────────────────────────────────────────────
// Priority (highest → lowest):
//   1. app.config.ts extra.apiBaseUrl  (set via EXPO_PUBLIC_API_BASE_URL env var)
//   2. EXPO_PUBLIC_API_BASE_URL process.env  (Metro inlines this at bundle time)
//   3. Hard-coded DEFAULT below
//
// To switch environments without touching this file, set:
//   EXPO_PUBLIC_API_BASE_URL=https://your-tunnel.devtunnels.ms
// in a .env file at the project root before running `npx expo start`.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_API_BASE_URL = 'https://w5gkg0gj-8000.inc1.devtunnels.ms';

function normalizeBaseUrl(url: string | undefined | null): string {
  return (url?.trim() || '').replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  const fromExtra = normalizeBaseUrl(
    Constants.expoConfig?.extra?.apiBaseUrl as string | undefined
  );
  const fromEnv = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  return fromExtra || fromEnv || DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_V1_PREFIX = '/api/v1';

export const API_REQUEST_TIMEOUT_MS = 20_000;

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

/** Prefix path with `/api/v1` when not already present. */
export function apiV1Path(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith(API_V1_PREFIX)) return p;
  return `${API_V1_PREFIX}${p}`;
}
