import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/data/store';
import { getUserMe } from '@/core/api/users';
import { Colors } from '@/core/theme';

export default function EntryRoute() {
  const router = useRouter();
  const authHydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authHydrated) return;

    const checkSession = async () => {
      if (token) {
        try {
          const userSummary = await getUserMe();
          await setUser(userSummary);
          router.replace('/home' as any);
        } catch (err) {
          console.warn('Session restoration failed:', err);
          await signOut();
          router.replace('/auth/login-register' as any);
        }
      } else {
        router.replace('/auth/login-register' as any);
      }
      setLoading(false);
    };

    checkSession();
  }, [authHydrated, token]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceCanvas }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
