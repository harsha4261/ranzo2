import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoAppBar } from '@/core/widgets';
import { getApplication, JobApplication } from '@/core/api/jobs';

const STAGES: JobApplication['status'][] = ['SUBMITTED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'HIRED'];

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getApplication(id)
      .then(setApp)
      .catch((e: any) => setError(e?.message || 'Failed to load application.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Application" showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error || !app ? (
        <View style={styles.center}>
          <Text style={{ color: Colors.danger }}>{error || 'Application not found.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.status}>{app.status.replace('_', ' ')}</Text>
          </View>

          {app.status === 'REJECTED' ? (
            <View style={styles.card}>
              <Text style={styles.rejectedText}>This application was not selected to move forward.</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {STAGES.map((stage, i) => {
                const reached = STAGES.indexOf(app.status) >= i;
                return (
                  <View key={stage} style={styles.timelineRow}>
                    <View style={[styles.dot, reached && styles.dotActive]} />
                    <Text style={[styles.timelineLabel, reached && styles.timelineLabelActive]}>
                      {stage.replace('_', ' ')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.label}>Applied on</Text>
            <Text style={styles.value}>{new Date(app.created_at).toLocaleString()}</Text>
          </View>

          {(app.salary_min || app.salary_max) && (
            <View style={styles.card}>
              <Text style={styles.label}>Expected salary</Text>
              <Text style={styles.value}>₹{app.salary_min ?? '—'} – ₹{app.salary_max ?? '—'}</Text>
            </View>
          )}

          {app.cover_message && (
            <View style={styles.card}>
              <Text style={styles.label}>Cover message</Text>
              <Text style={styles.value}>{app.cover_message}</Text>
            </View>
          )}
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
  },
  label: { fontSize: 12, color: Colors.inkMuted, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: 14, color: Colors.inkBody, marginTop: 2 },
  status: { fontSize: 20, fontWeight: '800', color: Colors.inkNavy, marginTop: 4 },
  rejectedText: { fontSize: 14, color: Colors.danger, fontWeight: '600' },
  timeline: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.divider },
  dotActive: { backgroundColor: Colors.success },
  timelineLabel: { fontSize: 14, color: Colors.inkMuted },
  timelineLabelActive: { color: Colors.inkNavy, fontWeight: '700' },
});
