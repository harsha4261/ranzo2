import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import type { AppMode, Role } from '@/data/models';

/** SecureStore keys: alphanumeric, ".", "-", "_" only (no colons). */
const KEY_ACCESS_TOKEN = 'ranzo_secure_access_token';
const KEY_REFRESH_TOKEN = 'ranzo_secure_refresh_token';
const KEY_LOGIN_PHONE = 'ranzo_secure_login_phone';
const KEY_LOGIN_PASSWORD = 'ranzo_secure_login_password';
const KEY_LOGIN_META = 'ranzo_secure_login_meta';

export type SavedLoginMeta = {
  role: Role;
  app: AppMode | null;
};

export async function saveSecureTokens(
  accessToken: string | null,
  refreshToken: string | null
) {
  if (accessToken) {
    await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, accessToken);
  } else {
    await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN).catch(() => {});
  }
  if (refreshToken) {
    await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, refreshToken);
  } else {
    await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN).catch(() => {});
  }
}

export async function loadSecureTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(KEY_ACCESS_TOKEN),
      SecureStore.getItemAsync(KEY_REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export async function clearSecureTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN).catch(() => {}),
    SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN).catch(() => {}),
  ]);
}

export async function isBiometricHardwareReady() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function getSavedLoginPhone() {
  return SecureStore.getItemAsync(KEY_LOGIN_PHONE);
}

export async function loadSavedLoginMeta(): Promise<SavedLoginMeta | null> {
  const raw = await SecureStore.getItemAsync(KEY_LOGIN_META);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedLoginMeta;
  } catch {
    return null;
  }
}

/** Save phone + password for fingerprint / quick password login. */
export async function savePasswordLoginCredentials(
  phone: string,
  password: string,
  meta: SavedLoginMeta
) {
  const useBiometric = await isBiometricHardwareReady();
  await SecureStore.setItemAsync(KEY_LOGIN_PHONE, phone);
  await SecureStore.setItemAsync(KEY_LOGIN_META, JSON.stringify(meta));
  await SecureStore.setItemAsync(
    KEY_LOGIN_PASSWORD,
    password,
    useBiometric
      ? {
          requireAuthentication: true,
          authenticationPrompt: 'Unlock Ranzo to sign in',
        }
      : undefined
  );
}

export async function hasSavedPasswordLogin() {
  try {
    const phone = await getSavedLoginPhone();
    return Boolean(phone);
  } catch {
    return false;
  }
}

export async function canUseBiometricQuickLogin() {
  if (!(await isBiometricHardwareReady())) return false;
  return hasSavedPasswordLogin();
}

/** True when app launch should ask for fingerprint / device passcode. */
export async function shouldGateAppWithBiometric(hasSession: boolean) {
  if (!(await isBiometricHardwareReady())) return false;
  if (hasSession) return true;
  return hasSavedPasswordLogin();
}

/** Fingerprint / device PIN prompt before entering the app. */
export async function promptBiometricUnlock(
  promptMessage = 'Unlock Ranzo'
): Promise<boolean> {
  if (!(await isBiometricHardwareReady())) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}

export async function loadSavedPassword(): Promise<string | null> {
  const useBiometric = await isBiometricHardwareReady();
  return SecureStore.getItemAsync(
    KEY_LOGIN_PASSWORD,
    useBiometric
      ? {
          requireAuthentication: true,
          authenticationPrompt: 'Sign in to Ranzo',
        }
      : undefined
  );
}

export async function clearSavedLoginCredentials() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_LOGIN_PHONE).catch(() => {}),
    SecureStore.deleteItemAsync(KEY_LOGIN_PASSWORD).catch(() => {}),
    SecureStore.deleteItemAsync(KEY_LOGIN_META).catch(() => {}),
  ]);
}

export async function clearAllSecureAuth() {
  await Promise.all([clearSecureTokens(), clearSavedLoginCredentials()]);
}
