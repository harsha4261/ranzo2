import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoTextField } from '@/core/widgets';
import { applyToJob } from '@/core/api/jobs';
import type { ApiError } from '@/core/api/client';

export default function ApplyToJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [coverMessage, setCoverMessage] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (coverMessage.length > 500) {
      setError('Cover message must be 500 characters or fewer.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await applyToJob(id, {
        cover_message: coverMessage.trim() || null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
      });
      Alert.alert('Application sent', 'Your application has been submitted.');
      router.replace('/seeker/applications' as any);
    } catch (e: any) {
      const apiErr = e as ApiError;
      if (apiErr?.status === 409) {
        setError('You already applied to this job.');
      } else {
        setError(apiErr?.message || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Apply" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <RanzoTextField
          label="Cover message"
          value={coverMessage}
          onChangeText={setCoverMessage}
          placeholder="Tell the employer why you're a good fit (optional, max 500 chars)"
          multiline
          helper={`${coverMessage.length}/500`}
        />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <RanzoTextField label="Expected min (₹)" value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" placeholder="Optional" />
          </View>
          <View style={{ flex: 1 }}>
            <RanzoTextField label="Expected max (₹)" value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" placeholder="Optional" />
          </View>
        </View>
        <RanzoButton label={submitting ? 'Submitting...' : 'Submit Application'} onPress={handleApply} disabled={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  container: { padding: Spacing.xl, gap: Spacing.lg },
  row2: { flexDirection: 'row', gap: Spacing.md },
  errorText: { color: Colors.danger, fontWeight: '600' },
});
