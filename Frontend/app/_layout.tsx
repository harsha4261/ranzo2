import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/data/store';
import { Colors } from '@/core/theme';
import { OfflineBanner } from '@/core/widgets';
import { useI18nStore } from '@/core/i18n';

/** Subscribe to locale changes so translated screens re-render without resetting navigation. */
function I18nRoot({ children }: { children: React.ReactNode }) {
  useI18nStore((s) => s.locale);
  return <>{children}</>;
}

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const hydrateI18n = useI18nStore((s) => s.hydrate);
  const i18nHydrated = useI18nStore((s) => s.hydrated);

  useEffect(() => {
    void Promise.all([hydrate(), hydrateI18n()]);
  }, [hydrate, hydrateI18n]);

  useEffect(() => {
    if (authHydrated && i18nHydrated) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [authHydrated, i18nHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.surfaceWhite }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <I18nRoot>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.surfaceWhite },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'fade' }} />
            </Stack>
          <OfflineBanner />
        </View>
        </I18nRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

