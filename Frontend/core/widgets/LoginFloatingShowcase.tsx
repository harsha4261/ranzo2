import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Elevation, Radius, Spacing } from '@/core/theme';

const HERO_SLIDES: { id: string; source: ImageSourcePropType }[] = [
  { id: 'h1', source: require('@/assets/hero/hero01.png') },
  { id: 'h2', source: require('@/assets/hero/hero02.png') },
  { id: 'h3', source: require('@/assets/hero/hero03.png') },
  { id: 'h4', source: require('@/assets/hero/hero04.png') },
  { id: 'h5', source: require('@/assets/hero/hero05.png') },
  { id: 'h6', source: require('@/assets/hero/hero06.png') },
  { id: 'h7', source: require('@/assets/hero/hero07.png') },
];

const HERO_ROTATE_MS = 3200;
const HERO_HEIGHT = 168;

/** One hero image at a time, auto-advances horizontally with dot indicators. */
export function LoginFloatingShowcase() {
  const scrollRef = useRef<ScrollView>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (slideWidth <= 0) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
        return next;
      });
    }, HERO_ROTATE_MS);

    return () => clearInterval(timer);
  }, [slideWidth]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setHeroIndex(Math.min(i, HERO_SLIDES.length - 1));
  };

  return (
    <View style={styles.showcase}>
      <LinearGradient
        colors={[Colors.surfaceWhite, Colors.primarySoft, Colors.surfaceWhite]}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientLayer}
      />

      <View style={styles.heroChrome}>
        <View
          style={styles.heroClip}
          onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onMomentumScrollEnd={onScrollEnd}
          >
            {HERO_SLIDES.map((slide) => (
              <View key={slide.id} style={{ width: slideWidth || undefined, height: HERO_HEIGHT }}>
                {slideWidth > 0 ? (
                  <>
                    <Image
                      source={slide.source}
                      style={{ width: slideWidth, height: HERO_HEIGHT }}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      pointerEvents="none"
                      colors={[
                        'rgba(255,255,255,0.55)',
                        'rgba(107,44,140,0.14)',
                        'rgba(78,31,104,0.32)',
                      ]}
                      locations={[0, 0.42, 1]}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                      pointerEvents="none"
                      colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
                      locations={[0, 1]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 0.35 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.heroDots} accessibilityLabel="Hero slides">
        {HERO_SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.heroDot,
              i === heroIndex ? styles.heroDotActive : styles.heroDotIdle,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  showcase: {
    minHeight: 228,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
    paddingBottom: Spacing.md,
    marginBottom: Spacing.lg,
    ...Elevation.card,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroChrome: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    padding: 3,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  heroClip: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    height: HERO_HEIGHT,
    width: '100%',
    backgroundColor: Colors.surfaceCanvas,
  },
  heroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  heroDot: {
    height: 6,
    borderRadius: 999,
  },
  heroDotIdle: {
    width: 6,
    backgroundColor: Colors.primaryTint,
    opacity: 0.55,
  },
  heroDotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
});
