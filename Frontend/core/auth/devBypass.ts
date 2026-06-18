import type { Router } from 'expo-router';
/** Demo bypass removed — always use backend auth. */
export function isDevLoginBypassEnabled(): boolean {
  return false;
}

export async function performDevBypassLogin(_phone: string, _router: Router) {
  throw new Error('Dev bypass login is disabled. Use OTP login.');
}

export async function performDevBypassLoginAs(
  _phone: string,
  _router: Router,
  _role: 'seeker' | 'customer' | 'employer' | 'technician'
) {
  throw new Error('Dev bypass login is disabled. Use OTP login.');
}
