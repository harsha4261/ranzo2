import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { useAuthStore } from '@/data/store';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleRoleSelect = (role: 'customer' | 'technician' | 'seeker' | 'employer') => {
    const isCompleted = user?.registered_roles?.includes(role);
    if (isCompleted) {
      if (role === 'customer') {
        router.push('/customer/(tabs)' as any);
      } else {
        router.push(`/${role}/dashboard` as any);
      }
    } else {
      router.push(`/profile-setup?role=${role}` as any);
    }
  };

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

            <View style={styles.expandedContent}>
              <Text style={styles.expandedTitle}>Continue as:</Text>
              <View style={styles.roleButtons}>
                <Pressable style={styles.roleBtn} onPress={() => handleRoleSelect('customer')}>
                  <Ionicons name="people-outline" size={20} color={Colors.white} />
                  <Text style={styles.roleBtnText}>Customer</Text>
                  {user?.registered_roles?.includes('customer') && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.successSoft} />
                  )}
                </Pressable>

                <Pressable style={styles.roleBtn} onPress={() => handleRoleSelect('technician')}>
                  <Ionicons name="hammer-outline" size={20} color={Colors.white} />
                  <Text style={styles.roleBtnText}>Technician</Text>
                  {user?.registered_roles?.includes('technician') && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.successSoft} />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Card 2: Job Portal */}
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

            <View style={styles.expandedContent}>
              <Text style={styles.expandedTitle}>Continue as:</Text>
              <View style={styles.roleButtons}>
                <Pressable style={styles.roleBtn} onPress={() => handleRoleSelect('seeker')}>
                  <Ionicons name="search-outline" size={20} color={Colors.white} />
                  <Text style={styles.roleBtnText}>Seeker</Text>
                  {user?.registered_roles?.includes('seeker') && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.successSoft} />
                  )}
                </Pressable>

                <Pressable style={styles.roleBtn} onPress={() => handleRoleSelect('employer')}>
                  <Ionicons name="business-outline" size={20} color={Colors.white} />
                  <Text style={styles.roleBtnText}>Employer</Text>
                  {user?.registered_roles?.includes('employer') && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.successSoft} />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
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
  expandedContent: {
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: Spacing.md,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkBody,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  roleBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
