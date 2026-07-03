import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton, EmptyState } from '@/core/widgets';
import { listMyJobs, Job } from '@/core/api/jobs';

const STATUS_COLOR: Record<Job['status'], string> = {
  DRAFT: Colors.inkMuted,
  PUBLISHED: Colors.success,
  CLOSED: Colors.danger,
};

function ModerationBadge({ job }: { job: Job }) {
  if (job.status !== 'PUBLISHED') return null;
  if (job.moderation_status === 'APPROVED') return null;
  if (job.moderation_status === 'REJECTED') {
    return (
      <View style={[styles.badge, { backgroundColor: Colors.dangerSoft }]}>
        <Ionicons name="close-circle" size={14} color={Colors.danger} />
        <Text style={[styles.badgeText, { color: Colors.danger }]}>Rejected{job.moderation_note ? `: ${job.moderation_note}` : ''}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: Colors.warningSoft }]}>
      <Ionicons name="time" size={14} color={Colors.warning} />
      <Text style={[styles.badgeText, { color: Colors.warning }]}>Pending review</Text>
    </View>
  );
}

export default function MyJobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await listMyJobs({ limit: 50 });
      setJobs(res.items);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load your jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchJobs();
    }, [fetchJobs])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar
        title="My Jobs"
        showBack
        trailing={
          <Pressable onPress={() => router.push('/employer/post-job' as any)} hitSlop={10}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
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
          <RanzoButton label="Retry" onPress={fetchJobs} fullWidth={false} />
        </View>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title="No jobs posted yet"
          subtitle="Post your first job to start receiving applications."
          ctaLabel="Post a job"
          onCta={() => router.push('/employer/post-job' as any)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {jobs.map((job) => (
            <View key={job.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[job.status] }]} />
              </View>
              <Text style={styles.meta}>{job.sector} · {job.employment_type.replace('_', ' ')} · {job.vacancies} openings</Text>
              <Text style={styles.meta}>₹{job.salary_min} – ₹{job.salary_max} / {job.salary_period}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: Colors.surfaceCanvas }]}>
                  <Text style={styles.badgeText}>{job.status}</Text>
                </View>
                <ModerationBadge job={job} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  errorText: { color: Colors.danger, fontWeight: '600', textAlign: 'center' },
  container: { padding: Spacing.xl, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.xs,
    ...Elevation.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '800', color: Colors.inkNavy, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.sm },
  meta: { fontSize: 13, color: Colors.inkMuted },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.inkBody },
});
