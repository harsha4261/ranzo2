import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '@/core/theme';

export type RanzoToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
};

const SIZES = {
  md: { width: 56, height: 32, knob: 26, padding: 3 },
  lg: { width: 72, height: 40, knob: 34, padding: 3 },
};

export function RanzoToggle({
  value,
  onChange,
  disabled = false,
  size = 'lg',
}: RanzoToggleProps) {
  const dims = SIZES[size];
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const knobX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [dims.padding, dims.width - dims.knob - dims.padding],
  });

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.divider, Colors.success],
  });

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={({ pressed }) => [pressed && !disabled && { opacity: 0.85 }]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: dims.width,
            height: dims.height,
            borderRadius: dims.height / 2,
            backgroundColor: trackColor,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              width: dims.knob,
              height: dims.knob,
              borderRadius: dims.knob / 2,
              transform: [{ translateX: knobX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  knob: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
