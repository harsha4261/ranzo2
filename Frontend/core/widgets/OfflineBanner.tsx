import React, { useEffect, useState } from 'react';
import { Animated, Platform, StatusBar, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/core/theme';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slide = React.useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected || state.isInternetReachable === false;
      setIsOffline(offline);
    });
    return () => sub();
  }, []);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: isOffline ? 0 : -30,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slide]);

  if (!isOffline) return null;

  const topInset = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 0);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.bar,
        { paddingTop: topInset + 4, transform: [{ translateY: slide }] },
      ]}
    >
      <Ionicons name="cloud-offline" size={14} color={Colors.white} />
      <Text style={styles.text}>You're offline</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    paddingBottom: 6,
    paddingHorizontal: Spacing.lg,
    gap: 6,
    zIndex: 10000,
  },
  text: { color: Colors.white, fontSize: 12, fontWeight: '700' },
});
