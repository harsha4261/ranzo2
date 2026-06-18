import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/core/theme';
import { t } from '@/core/i18n';

type Props = {
  title: string;
  hasValue: boolean;
  onAction: () => void;
};

export function ProfileSectionHeader({ title, hasValue, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={Typography.h2}>{title}</Text>
      <Pressable
        onPress={onAction}
        hitSlop={8}
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={hasValue ? t('profile.edit') : t('profile.add')}
      >
        <Ionicons
          name={hasValue ? 'pencil' : 'add-circle-outline'}
          size={18}
          color={Colors.primary}
        />
        <Text style={styles.actionText}>
          {hasValue ? t('profile.edit') : t('profile.add')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
});
