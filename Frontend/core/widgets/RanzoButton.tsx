import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/core/theme';

export type RanzoButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type RanzoButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: RanzoButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export function RanzoButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  leadingIcon,
  trailingIcon,
  style,
  testID,
}: RanzoButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLES[variant].container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && VARIANT_STYLES[variant].pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_STYLES[variant].label.color} />
      ) : (
        <View style={styles.content}>
          {leadingIcon && <View style={styles.icon}>{leadingIcon}</View>}
          <Text style={[Typography.button, VARIANT_STYLES[variant].label]}>
            {label.toUpperCase()}
          </Text>
          {trailingIcon && <View style={styles.icon}>{trailingIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});

const VARIANT_STYLES = {
  primary: {
    container: { backgroundColor: Colors.primary },
    pressed: { backgroundColor: Colors.primaryDark },
    label: { color: Colors.white, letterSpacing: 0.5 },
  },
  secondary: {
    container: {
      backgroundColor: Colors.white,
      borderWidth: 1.5,
      borderColor: Colors.primary,
    },
    pressed: { backgroundColor: Colors.primarySoft },
    label: { color: Colors.primary, letterSpacing: 0.5 },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: Colors.primarySoft },
    label: { color: Colors.primary, letterSpacing: 0.5 },
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    pressed: { backgroundColor: '#A82E2E' },
    label: { color: Colors.white, letterSpacing: 0.5 },
  },
} as const;
