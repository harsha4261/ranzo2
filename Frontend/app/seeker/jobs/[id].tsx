import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoChip } from '@/core/widgets';
import { getJob, Job } from '@/core/api/jobs';

export default function SeekerJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getJob(id)
      .then(setJob)
      .catch((e: any) => setError(e?.message || 'Failed to load job.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <RanzoAppBar title="Job Detail" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <RanzoAppBar title="Job Detail" showBack />
        <View style={styles.center}>
          <Text style={{ color: Colors.danger }}>{error || 'Job not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Job Detail" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.subtitle}>{job.sector}{job.sub_sector ? ` · ${job.sub_sector}` : ''}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="briefcase-outline" size={18} color={Colors.primary} />
          <Text style={styles.metaText}>{job.employment_type.replace('_', ' ')} · {job.vacancies} openings</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={18} color={Colors.primary} />
          <Text style={styles.metaText}>{job.job_address}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={18} color={Colors.primary} />
          <Text style={styles.metaText}>₹{job.salary_min} – ₹{job.salary_max} / {job.salary_period}</Text>
        </View>
        {job.working_hours && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <Text style={styles.metaText}>{job.working_hours}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Ionicons name="school-outline" size={18} color={Colors.primary} />
          <Text style={styles.metaText}>{job.experience_min}-{job.experience_max} yrs experience{job.education ? ` · ${job.education}` : ''}</Text>
        </View>

        {job.required_skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Required skills</Text>
            <View style={styles.chipRow}>
              {job.required_skills.map((s) => (
                <RanzoChip key={s} label={s} size="sm" />
              ))}
            </View>
          </>
        )}

        {job.benefits.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <View style={styles.chipRow}>
              {job.benefits.map((b) => (
                <RanzoChip key={b} label={b} size="sm" />
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{job.description}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <RanzoButton label="Apply Now" onPress={() => router.push(`/seeker/jobs/${job.id}/apply` as any)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  title: { fontSize: 22, fontWeight: '800', color: Colors.inkNavy },
  subtitle: { fontSize: 14, color: Colors.inkMuted, marginBottom: Spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  metaText: { fontSize: 14, color: Colors.inkBody },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.inkNavy, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  description: { fontSize: 14, color: Colors.inkBody, lineHeight: 20 },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
  },
});
