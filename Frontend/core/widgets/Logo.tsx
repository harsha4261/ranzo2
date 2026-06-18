import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/core/theme';
import { StyleSheet, Text, View } from 'react-native';
import { t, useI18nStore } from '@/core/i18n';

export type RanzoLogoMarkProps = {
  size?: number;
  color?: string;
};

export function RanzoLogoMark({
  size = 96,
  color = Colors.primary,
}: RanzoLogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path d="M10 8 H62 L62 36 L34 36 L34 92 L10 92 Z" fill={color} />
      <Path d="M62 36 L92 36 L62 64 Z" fill={color} opacity={0.85} />
    </Svg>
  );
}

export type RanzoWordmarkProps = {
  size?: number;
  showTagline?: boolean;
  align?: 'center' | 'flex-start';
};

export function RanzoWordmark({
  size = 44,
  showTagline = true,
  align = 'center',
}: RanzoWordmarkProps) {
  const locale = useI18nStore((s) => s.locale);

  return (
    <View style={[styles.wrap, { alignItems: align }]}>
      <Text
        style={[
          styles.wordmark,
          { fontSize: size, lineHeight: size * 1.05 },
        ]}
      >
        <Text style={{ color: Colors.inkNavy }}>Ranz</Text>
        <Text style={{ color: Colors.primary }}>o</Text>
      </Text>
      {showTagline && (
        <View style={styles.taglineBlock}>
          <View style={styles.taglineRow}>
            <View style={styles.dash} />
            <Text style={styles.tagline} key={`tagline-${locale}`}>
              {t('landing.tagline')}
            </Text>
            <View style={styles.dash} />
          </View>
          <Text style={styles.taglineSub} key={`tagline-sub-${locale}`}>
            {t('landing.taglineServices')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  taglineBlock: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
    paddingHorizontal: 4,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  taglineSub: {
    color: Colors.inkBody,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    fontWeight: '600',
    textAlign: 'center',
  },
  dash: {
    width: 18,
    height: 1.5,
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },
  tagline: {
    color: Colors.primary,
    fontSize: 14,
    letterSpacing: 0.6,
    fontWeight: '500',
  },
});
