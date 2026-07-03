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
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { getProfileMe, SeekerProfile } from '@/core/api/profiles';
import { useAuthStore } from '@/data/store';
import { listJobs, listMyApplications, Job, JobApplication } from '@/core/api/jobs';

function formatLabel(str: string) {
  return str.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function SeekerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileMe('seeker') as SeekerProfile;
        setProfile(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load seeker profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    listJobs({ limit: 5 })
      .then((res) => setJobs(res.items))
      .catch((err: any) => setJobsError(err?.message || 'Failed to load jobs.'));

    listMyApplications({ limit: 5 })
      .then((res) => setApplications(res.items))
      .catch((err: any) => setApplicationsError(err?.message || 'Failed to load applications.'));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar 
        title="Job Seeker Dashboard" 
        showBack 
        onBack={() => router.replace('/home' as any)} 
        trailing={
          <Pressable onPress={() => router.push('/profile-details?role=seeker' as any)}>
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
            <Ionicons name="search-outline" size={36} color={Colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeName}>Hello, {user?.name || 'Seeker'} 👋</Text>
              <Text style={styles.welcomeSub}>Your job preferences are saved</Text>
            </View>
          </View>



          {/* Job Feed — real data from GET /jobs */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Matching Jobs</Text>
              <Pressable onPress={() => router.push('/seeker/jobs' as any)}>
                <Text style={styles.linkText}>See all</Text>
              </Pressable>
            </View>
            {jobsError ? (
              <Text style={{ color: Colors.danger }}>{jobsError}</Text>
            ) : jobs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={44} color={Colors.inkMuted} />
                <Text style={styles.emptyTitle}>No matching jobs found</Text>
                <Text style={styles.emptyDesc}>
                  {profile?.location
                    ? `No job listings available in ${profile.location} yet. Employers will post jobs soon.`
                    : 'Update your preferred location to find relevant job listings near you.'}
                </Text>
              </View>
            ) : (
              jobs.map((job) => (
                <Pressable key={job.id} style={styles.jobCard} onPress={() => router.push(`/seeker/jobs/${job.id}` as any)}>
                  <Text style={styles.jobCardTitle} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.jobCardMeta}>{job.sector} · ₹{job.salary_min}–₹{job.salary_max}/{job.salary_period}</Text>
                </Pressable>
              ))
            )}
            <View style={{ marginTop: Spacing.md }}>
              <RanzoButton label="Browse all jobs" variant="secondary" onPress={() => router.push('/seeker/jobs' as any)} />
            </View>
          </View>

          {/* Applications — real data from GET /jobs/seeker/applications */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>My Applications</Text>
              <Pressable onPress={() => router.push('/seeker/applications' as any)}>
                <Text style={styles.linkText}>See all</Text>
              </Pressable>
            </View>
            {applicationsError ? (
              <Text style={{ color: Colors.danger }}>{applicationsError}</Text>
            ) : applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={Colors.inkMuted} />
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptyDesc}>
                  Jobs you apply to will show up here.
                </Text>
              </View>
            ) : (
              applications.map((app) => (
                <Pressable
                  key={app.id}
                  style={styles.jobCard}
                  onPress={() => router.push(`/seeker/applications/${app.id}` as any)}
                >
                  <Text style={styles.jobCardTitle}>Job #{app.job_id.slice(-6)}</Text>
                  <Text style={styles.jobCardMeta}>{app.status.replace('_', ' ')}</Text>
                </Pressable>
              ))
            )}
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
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  jobCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 2,
  },
  jobCardTitle: { fontSize: 14, fontWeight: '700', color: Colors.inkNavy },
  jobCardMeta: { fontSize: 12, color: Colors.inkMuted },
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
