import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/theme';

export type StarRatingProps = {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
  readonly?: boolean;
};

export function StarRating({
  value,
  onChange,
  size = 36,
  readonly = false,
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <Pressable
            key={i}
            onPress={() => !readonly && onChange?.(i)}
            disabled={readonly}
            hitSlop={6}
            style={({ pressed }) => [pressed && !readonly && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? Colors.warning : Colors.divider}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
});
