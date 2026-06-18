import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/core/theme';

export type RanzoOtpFieldProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onFilled?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
};

export function RanzoOtpField({
  length = 6,
  value,
  onChange,
  onFilled,
  error,
  autoFocus = true,
}: RanzoOtpFieldProps) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const shake = useRef(new Animated.Value(0)).current;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputs.current[0]?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shake]);

  const setIndex = (index: number, char: string) => {
    const sanitized = char.replace(/\D/g, '');
    if (sanitized.length > 1) {
      const next = (value + sanitized).slice(0, length);
      onChange(next);
      if (next.length === length) {
        onFilled?.(next);
        inputs.current[length - 1]?.blur();
      } else {
        inputs.current[next.length]?.focus();
      }
      return;
    }
    const arr = digits.slice();
    arr[index] = sanitized;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (sanitized && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (next.length === length) {
      onFilled?.(next);
      inputs.current[length - 1]?.blur();
    }
  };

  const onKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const arr = digits.slice();
      arr[index - 1] = '';
      onChange(arr.join(''));
    }
  };

  const translateX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      {digits.map((d, i) => {
        const filled = !!d;
        const focused = focusedIndex === i;
        const borderColor = error
          ? Colors.danger
          : focused || filled
            ? Colors.primary
            : Colors.divider;
        return (
          <TextInput
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            value={d}
            onChangeText={(t) => setIndex(i, t)}
            onKeyPress={(e) => onKeyPress(i, e)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={length}
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={i === 0 ? 'sms-otp' : 'off'}
            style={[
              styles.box,
              { borderColor, backgroundColor: filled ? Colors.primarySoft : Colors.white },
            ]}
            selectionColor={Colors.primary}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.inkNavy,
    ...(Typography.bodyStrong as object),
  },
});
