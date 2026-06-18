import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/core/theme';

export type RanzoChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: ViewStyle;
};

export function RanzoChip({
  label,
  selected = false,
  onPress,
  icon,
  size = 'md',
  disabled = false,
  style,
}: RanzoChipProps) {
  const sizeStyle = size === 'sm' ? styles.sm : styles.md;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        selected ? styles.selected : styles.unselected,
        pressed && !disabled && (selected ? styles.selectedPressed : styles.unselectedPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text
          style={[
            styles.label,
            size === 'sm' && styles.labelSm,
            selected ? styles.labelSelected : styles.labelUnselected,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  sm: { paddingHorizontal: Spacing.md, paddingVertical: 6, minHeight: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  icon: { marginRight: 2 },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelSm: { fontSize: 12 },
  selected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectedPressed: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  unselected: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  unselectedPressed: {
    backgroundColor: Colors.primarySoft,
  },
  labelSelected: { color: Colors.white },
  labelUnselected: { color: Colors.primary },
  disabled: { opacity: 0.4 },
});
