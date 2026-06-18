import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/core/theme';
import { t } from '@/core/i18n';

type Props = {
  onPress: () => void;
  label?: string;
};

export function GoBackLink({ onPress, label }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label ?? t('common.goBack')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={20} color={Colors.primary} />
      <Text style={styles.text}>{label ?? t('common.goBack')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  pressed: { opacity: 0.65 },
  text: {
    ...Typography.bodyStrong,
    color: Colors.primary,
    fontSize: 15,
  },
});
