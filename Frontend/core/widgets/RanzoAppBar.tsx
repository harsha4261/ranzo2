import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/core/theme';

export type RanzoAppBarProps = {
  title?: string;
  showBack?: boolean;
  trailing?: React.ReactNode;
  variant?: 'light' | 'dark';
  onBack?: () => void;
};

export function RanzoAppBar({
  title,
  showBack = false,
  trailing,
  variant = 'light',
  onBack,
}: RanzoAppBarProps) {
  const router = useRouter();
  const dark = variant === 'dark';
  const fg = dark ? Colors.white : Colors.inkNavy;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: dark ? Colors.primary : Colors.white },
      ]}
    >
      <View style={styles.side}>
        {showBack && (
          <Pressable
            hitSlop={12}
            accessibilityLabel="Go back"
            onPress={() => (onBack ? onBack() : router.back())}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={26} color={fg} />
          </Pressable>
        )}
      </View>
      <Text
        style={[
          Typography.h2,
          { color: fg },
          styles.title,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.sm,
  },
  side: {
    width: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  trailing: { alignItems: 'flex-end' },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
