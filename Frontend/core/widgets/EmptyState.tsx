import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/core/theme';
import { RanzoButton } from './RanzoButton';

export type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
};

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={42} color={Colors.primary} />
      </View>
      <Text style={[Typography.h2, styles.title]}>{title}</Text>
      {subtitle && (
        <Text style={[Typography.body, styles.subtitle]}>{subtitle}</Text>
      )}
      {ctaLabel && onCta && (
        <View style={styles.ctaWrap}>
          <RanzoButton label={ctaLabel} onPress={onCta} fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center' },
  subtitle: {
    textAlign: 'center',
    color: Colors.inkMuted,
  },
  ctaWrap: { marginTop: Spacing.md },
});
