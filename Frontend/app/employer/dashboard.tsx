import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar } from '@/core/widgets';
import { getProfileMe, EmployerProfile } from '@/core/api/profiles';
import { useAuthStore } from '@/data/store';

export default function EmployerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileMe('employer') as EmployerProfile;
        setProfile(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load employer profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar 
        title="Employer Dashboard" 
        showBack 
        onBack={() => router.replace('/home' as any)} 
        trailing={
          <Pressable onPress={() => router.push('/profile-details?role=employer' as any)}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={Colors.inkMuted} />
            </View>
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Welcome */}
          <View style={styles.welcomeCard}>
            <Ionicons name="business-outline" size={36} color={Colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeName}>Hello, {user?.name || 'Employer'} 👋</Text>
              <Text style={styles.welcomeSub}>{profile?.company || 'Manage your hiring'}</Text>
            </View>
          </View>



          {/* Job Postings — empty state (no job posting backend yet) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Job Postings</Text>
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={44} color={Colors.inkMuted} />
              <Text style={styles.emptyTitle}>No active job postings</Text>
              <Text style={styles.emptyDesc}>
                Job posting functionality will be available soon. You'll be able to post jobs and review applicants right here.
              </Text>
            </View>
          </View>

          {/* Applicants — empty state */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applicants</Text>
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={Colors.inkMuted} />
              <Text style={styles.emptyTitle}>No applicants yet</Text>
              <Text style={styles.emptyDesc}>
                Post a job to start receiving applications from job seekers in your area.
              </Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Elevation.card,
  },
  welcomeText: { flex: 1 },
  welcomeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  welcomeSub: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    gap: Spacing.md,
    ...Elevation.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  metaGrid: { gap: 0 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  metaLabel: {
    fontSize: 14,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 14,
    color: Colors.inkNavy,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    paddingLeft: Spacing.md,
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
