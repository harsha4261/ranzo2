import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { useAuthStore } from '@/data/store';
import { RanzoButton } from '@/core/widgets';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Custom App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.brandTitle}>Ranzo</Text>
        <Pressable
          onPress={() => router.push('/profile-summary' as any)}
          style={({ pressed }) => [styles.profileIcon, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.subtitle}>Select a service card below to get started.</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Card 1: Home Services */}
          <TouchableOpacity onPress={() => router.push('/auth/home-services')}>
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="construct-outline" size={28} color={Colors.primary} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>Home Services</Text>
                  <Text style={styles.cardDesc}>Register your skill, Book a technician</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Job Portal */}
          <TouchableOpacity onPress={() => router.push('/auth/jobs-portal')}>
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="briefcase-outline" size={28} color={Colors.primary} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>Job Portal</Text>
                  <Text style={styles.cardDesc}>Find job opportunities or hire top talent</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {!user && (
          <View style={styles.actionRow}>
            <View style={styles.buttonWrapper}>
              <RanzoButton
                label="Register"
                onPress={() => router.push({ pathname: '/auth/register', params: { returnUrl: '/home' } } as any)}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <RanzoButton
                label="Sign In"
                variant="secondary"
                onPress={() => router.push({ pathname: '/auth/login', params: { returnUrl: '/home' } } as any)}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceWhite,
  },
  appBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  profileIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.inkMuted,
    marginTop: Spacing.xs,
  },
  cardsContainer: {
    gap: Spacing.lg,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    overflow: 'hidden',
    ...Elevation.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});
