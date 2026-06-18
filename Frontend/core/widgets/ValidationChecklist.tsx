import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/core/theme';

export type ValidationCheckItem = {
  id: string;
  label: string;
  met: boolean;
};

type Props = {
  items: ValidationCheckItem[];
  visible?: boolean;
};

export function ValidationChecklist({ items, visible = true }: Props) {
  if (!visible || items.length === 0) return null;

  return (
    <View style={styles.wrap} accessibilityRole="list">
      {items.map((item) => (
        <View key={item.id} style={styles.row} accessibilityRole="text">
          <Ionicons
            name={item.met ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={item.met ? Colors.success : Colors.inkMuted}
          />
          <Text style={[styles.label, item.met && styles.labelMet]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    marginTop: Spacing.xs,
    paddingLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...Typography.caption,
    color: Colors.inkMuted,
    flex: 1,
  },
  labelMet: {
    color: Colors.success,
  },
});
