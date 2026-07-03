import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, EmptyState } from '@/core/widgets';
import { listMyApplications, JobApplication } from '@/core/api/jobs';

const STATUS_COLOR: Record<JobApplication['status'], string> = {
  SUBMITTED: Colors.inkMuted,
  SHORTLISTED: Colors.primary,
  REJECTED: Colors.danger,
  INTERVIEW_SCHEDULED: Colors.warning,
  HIRED: Colors.success,
};

export default function MyApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await listMyApplications({ limit: 50 });
      setApplications(res.items);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchApplications();
    }, [fetchApplications])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="My Applications" showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: Colors.danger }}>{error}</Text>
        </View>
      ) : applications.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No applications yet" subtitle="Jobs you apply to will show up here." />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {applications.map((app) => (
            <Pressable key={app.id} style={styles.card} onPress={() => router.push(`/seeker/applications/${app.id}` as any)}>
              <View style={styles.cardHeader}>
                <Text style={styles.jobId} numberOfLines={1}>Job #{app.job_id.slice(-6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[app.status] }]}>
                  <Text style={styles.statusText}>{app.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.date}>Applied {new Date(app.created_at).toLocaleDateString()}</Text>
              {app.cover_message ? <Text style={styles.cover} numberOfLines={2}>{app.cover_message}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.xl, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 4,
    ...Elevation.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobId: { fontSize: 15, fontWeight: '700', color: Colors.inkNavy, flex: 1 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.pill },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  date: { fontSize: 12, color: Colors.inkMuted },
  cover: { fontSize: 13, color: Colors.inkBody, marginTop: 4 },
});
