import React, { forwardRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/core/theme';

export type RanzoTextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string | null;
  prefix?: string;
  suffix?: React.ReactNode;
  helper?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
};

export const RanzoTextField = forwardRef<TextInput, RanzoTextFieldProps>(
  ({ label, error, prefix, suffix, helper, multiline, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const borderColor = error
      ? Colors.danger
      : focused
        ? Colors.primary
        : Colors.divider;

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.fieldRow,
            multiline && styles.multiline,
            { borderColor, backgroundColor: focused ? Colors.white : Colors.surfaceCanvas },
          ]}
        >
          {prefix && <Text style={styles.prefix}>{prefix}</Text>}
          <TextInput
            ref={ref}
            multiline={multiline}
            {...props}
            placeholderTextColor={Colors.inkMuted}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            style={[styles.input, multiline && styles.inputMultiline]}
          />
          {suffix && <View style={styles.suffix}>{suffix}</View>}
        </View>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : helper ? (
          <Text style={styles.helper}>{helper}</Text>
        ) : null}
      </View>
    );
  },
);

RanzoTextField.displayName = 'RanzoTextField';

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: {
    ...Typography.bodyStrong,
    fontSize: 14,
    color: Colors.inkBody,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  multiline: { minHeight: 100, alignItems: 'flex-start', paddingVertical: Spacing.md },
  prefix: {
    ...Typography.bodyStrong,
    color: Colors.inkBody,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  suffix: { paddingLeft: Spacing.sm },
  error: { ...Typography.caption, color: Colors.danger },
  helper: { ...Typography.caption },
});
