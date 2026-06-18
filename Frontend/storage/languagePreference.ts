import AsyncStorage from '@react-native-async-storage/async-storage';

/** M-002: persisted language code (en | hi | te). Same key as MMKV spec for backend parity. */
export const LANGUAGE_PREFERENCE_KEY = 'language_preference';

export async function saveLanguagePreference(locale: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, locale);
}

export async function loadLanguagePreference(): Promise<string | null> {
  return AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
}
