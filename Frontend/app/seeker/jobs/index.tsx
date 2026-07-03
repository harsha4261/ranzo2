import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoTextField, EmptyState } from '@/core/widgets';
import { listJobs, Job } from '@/core/api/jobs';

/** Combined browse + search screen (README's M-S06/M-S07 as one screen). */
export default function SeekerJobsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await listJobs({ q: q || undefined, limit: 50 });
      setJobs(res.items);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs('');
  }, [fetchJobs]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Find Jobs" showBack />
      <View style={styles.searchWrap}>
        <RanzoTextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search job title..."
          onSubmitEditing={() => fetchJobs(query)}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: Colors.danger }}>{error}</Text>
        </View>
      ) : jobs.length === 0 ? (
        <EmptyState icon="briefcase-outline" title="No jobs found" subtitle="Try a different search term." />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {jobs.map((job) => (
            <Pressable key={job.id} style={styles.card} onPress={() => router.push(`/seeker/jobs/${job.id}` as any)}>
              <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
              <Text style={styles.meta}>{job.sector} · {job.employment_type.replace('_', ' ')}</Text>
              <Text style={styles.meta}>{job.job_address}</Text>
              <Text style={styles.salary}>₹{job.salary_min} – ₹{job.salary_max} / {job.salary_period}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  searchWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
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
  title: { fontSize: 16, fontWeight: '800', color: Colors.inkNavy },
  meta: { fontSize: 13, color: Colors.inkMuted },
  salary: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },
});
