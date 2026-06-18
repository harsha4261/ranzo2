import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const ROLE_SELECT_TAGLINE = 'Hire Talent. Find Jobs. Get Work. Request Services.';
import { Colors, Spacing, Typography } from '@/core/theme';

export function SplashView() {
  return (
    <LinearGradient
      colors={[Colors.surfaceWhite, Colors.surfaceWhite, Colors.primarySoft, Colors.primaryTint]}
      locations={[0, 0.55, 0.8, 1]}
      style={styles.container}
    >
      <View style={styles.center}>
        <Image source={require('@/image.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.tagline}>{ROLE_SELECT_TAGLINE}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: Spacing.lg,
  },
  tagline: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.inkMuted,
    maxWidth: 320,
    lineHeight: 22,
    fontSize: 15,
  },
});
