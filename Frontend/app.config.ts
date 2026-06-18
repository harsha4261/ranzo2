import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Keep `app.json` as the base, but allow env-driven overrides.
  // NOTE: `EXPO_PUBLIC_*` variables are safe to expose to the client bundle.
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  return {
    ...(config as ExpoConfig),
    name: (config as ExpoConfig).name ?? 'Ranzo',
    slug: (config as ExpoConfig).slug ?? 'ranzo',
    plugins: (config.plugins ?? []) as ExpoConfig['plugins'],
    extra: {
      ...(config.extra ?? {}),
      apiBaseUrl,
    },
  };
};

