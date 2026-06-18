import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar } from '@/core/widgets';
import { getProfileMe, updateProfileMe, TechnicianProfile } from '@/core/api/profiles';
import { useAuthStore } from '@/data/store';

function formatSkill(str: string) {
  return str.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileMe('technician') as TechnicianProfile;
        setProfile(data);
        setOnline(data.online_status);
      } catch (err: any) {
        setError(err?.message || 'Failed to load technician profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleOnline = async (val: boolean) => {
    if (!profile || togglingOnline) return;
    setOnline(val);
    setTogglingOnline(true);
    try {
      const updated = await updateProfileMe('technician', {
        skills: profile.skills,
        online_status: val,
      }) as TechnicianProfile;
      setProfile(updated);
    } catch (err: any) {
      // Revert on error
      setOnline(!val);
      alert(err?.message || 'Failed to update status.');
    } finally {
      setTogglingOnline(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Technician Dashboard" showBack onBack={() => router.replace('/home' as any)} />

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
            <Ionicons name="hammer-outline" size={36} color={Colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeName}>Hello, {user?.name || 'Technician'} 👋</Text>
              <Text style={styles.welcomeSub}>Manage your availability below</Text>
            </View>
          </View>

          {/* Online Status Toggle — backed by PUT /profiles/me?role=technician */}
          <View style={[styles.statusCard, online ? styles.onlineCard : styles.offlineCard]}>
            <View style={styles.statusInfo}>
              <Ionicons
                name={online ? 'radio-outline' : 'power-outline'}
                size={28}
                color={online ? Colors.success : Colors.inkMuted}
              />
              <View>
                <Text style={styles.statusTitle}>{online ? 'You are Online' : 'You are Offline'}</Text>
                <Text style={styles.statusDesc}>
                  {online
                    ? 'Visible to customers for service requests.'
                    : 'Toggle to go online and receive requests.'}
                </Text>
              </View>
            </View>
            <Switch
              value={online}
              onValueChange={handleToggleOnline}
              trackColor={{ false: Colors.divider, true: Colors.successSoft }}
              thumbColor={online ? Colors.success : Colors.inkMuted}
              disabled={togglingOnline}
            />
          </View>

          {/* Registered Skills — from GET /profiles/me?role=technician */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Registered Skills</Text>
            {profile?.skills && profile.skills.length > 0 ? (
              <View style={styles.skillsList}>
                {profile.skills.map((skill) => (
                  <View key={skill} style={styles.skillItem}>
                    <Ionicons name="ribbon-outline" size={16} color={Colors.primary} />
                    <Text style={styles.skillText}>{formatSkill(skill)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="ribbon-outline" size={36} color={Colors.inkMuted} />
                <Text style={styles.emptyDesc}>No skills registered. Update your profile.</Text>
              </View>
            )}
          </View>

          {/* Active Requests — empty state (no booking backend yet) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Service Requests</Text>
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={40} color={Colors.inkMuted} />
              <Text style={styles.emptyTitle}>No active requests</Text>
              <Text style={styles.emptyDesc}>
                {online
                  ? 'Customers will appear here when they request a service matching your skills.'
                  : 'Go online to start receiving service requests.'}
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    ...Elevation.card,
  },
  onlineCard: {
    backgroundColor: Colors.successSoft,
    borderColor: Colors.success,
  },
  offlineCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderColor: Colors.divider,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  statusDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
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
});
