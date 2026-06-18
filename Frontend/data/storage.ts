import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEY_AUTH = 'ranzo:auth';
export const KEY_WORKER = 'ranzo:worker';
export const KEY_EMPLOYER = 'ranzo:employer';
export const KEY_LOCATION = 'ranzo:location';
export const KEY_LANGUAGE = 'ranzo:language';
/** M-002 completed — user explicitly chose language on first launch. */
export const KEY_LANGUAGE_INTRO_DONE = 'ranzo:language_intro_done';
/** M-005 completed — user chose platform role via add-role. */
export const KEY_ROLE_SELECT_DONE = 'ranzo:role_select_done';

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function removeJSON(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function clearAll() {
  const { clearAllSecureAuth } = await import('@/core/auth/secureLogin');
  await clearAllSecureAuth();
  await AsyncStorage.multiRemove([
    KEY_AUTH,
    KEY_WORKER,
    KEY_EMPLOYER,
    KEY_LOCATION,
    KEY_ROLE_SELECT_DONE,
  ]);
}
