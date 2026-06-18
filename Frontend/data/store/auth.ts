import { create } from 'zustand';
import { KEY_AUTH, loadJSON, saveJSON, clearAll } from '@/data/storage';
import { saveSecureTokens, loadSecureTokens } from '@/core/auth/secureLogin';
import type { UserSummaryResponse } from '@/core/api/users';

export type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: UserSummaryResponse | null;
  hydrate: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  setUser: (user: UserSummaryResponse | null) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  token: null,
  user: null,

  hydrate: async () => {
    try {
      const secure = await loadSecureTokens();
      const user = await loadJSON<UserSummaryResponse>(KEY_AUTH);
      set({
        token: secure.accessToken || null,
        user: user || null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  signIn: async (token: string) => {
    set({ token });
    await saveSecureTokens(token, null);
  },

  setUser: async (user: UserSummaryResponse | null) => {
    set({ user });
    if (user) {
      await saveJSON(KEY_AUTH, user);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(KEY_AUTH).catch(() => {});
    }
  },

  signOut: async () => {
    try {
      const { logout } = await import('@/core/api/auth');
      logout().catch(() => {});
    } catch {}
    await clearAll();
    set({
      token: null,
      user: null,
    });
  },
}));
