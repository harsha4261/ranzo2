import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoTextField, RanzoChip } from '@/core/widgets';
import { createJob } from '@/core/api/jobs';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

const SALARY_PERIODS = ['month', 'day', 'hour'];

/**
 * Single-screen job composer covering everything backend/app/schemas/job.py's
 * JobCreate needs. The README describes a 4-step wizard (M-E05–M-E08) but no
 * such wizard exists in this codebase yet — this is a deliberately simpler
 * one-screen equivalent that posts the same payload in one shot.
 */
export default function PostJobScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [sector, setSector] = useState('');
  const [subSector, setSubSector] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [vacancies, setVacancies] = useState('1');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceMin, setExperienceMin] = useState('0');
  const [experienceMax, setExperienceMax] = useState('0');
  const [education, setEducation] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('month');
  const [workingHours, setWorkingHours] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v || skills.length >= 8 || skills.includes(v)) return;
    setSkills([...skills, v]);
    setSkillInput('');
  };

  const addBenefit = () => {
    const v = benefitInput.trim();
    if (!v || benefits.includes(v)) return;
    setBenefits([...benefits, v]);
    setBenefitInput('');
  };

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'Job title must be at least 3 characters.';
    if (!sector.trim()) return 'Sector is required.';
    if (!description.trim()) return 'Description is required.';
    if (!jobAddress.trim()) return 'Job address is required.';
    if (!salaryMin || !salaryMax) return 'Salary range is required.';
    if (Number(salaryMin) > Number(salaryMax)) return 'Salary min cannot exceed salary max.';
    return null;
  };

  const handleSave = async (publish: boolean) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(publish ? 'publish' : 'draft');
    try {
      await createJob({
        title: title.trim(),
        sector: sector.trim(),
        sub_sector: subSector.trim() || null,
        employment_type: employmentType,
        vacancies: Number(vacancies) || 1,
        description: description.trim(),
        required_skills: skills,
        experience_min: Number(experienceMin) || 0,
        experience_max: Number(experienceMax) || 0,
        education: education.trim() || null,
        job_address: jobAddress.trim(),
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        salary_period: salaryPeriod,
        working_hours: workingHours.trim() || null,
        benefits,
        publish,
      });
      Alert.alert(
        publish ? 'Job submitted' : 'Draft saved',
        publish
          ? 'Your job is published and pending admin review before it appears in public search.'
          : 'Your job was saved as a draft.'
      );
      router.replace('/employer/my-jobs' as any);
    } catch (e: any) {
      setError(e?.message || 'Failed to save job.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Post a Job" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.sectionTitle}>Basics</Text>
        <RanzoTextField label="Job title *" value={title} onChangeText={setTitle} placeholder="e.g. Site Electrician" />
        <RanzoTextField label="Sector *" value={sector} onChangeText={setSector} placeholder="e.g. Construction" />
        <RanzoTextField label="Sub-sector" value={subSector} onChangeText={setSubSector} placeholder="Optional" />
        <Text style={styles.label}>Employment type</Text>
        <View style={styles.chipRow}>
          {EMPLOYMENT_TYPES.map((t) => (
            <RanzoChip key={t.value} label={t.label} selected={employmentType === t.value} onPress={() => setEmploymentType(t.value)} />
          ))}
        </View>
        <RanzoTextField label="Vacancies" value={vacancies} onChangeText={setVacancies} keyboardType="numeric" />

        <Text style={styles.sectionTitle}>Description</Text>
        <RanzoTextField label="Description *" value={description} onChangeText={setDescription} multiline placeholder="Role responsibilities" />
        <Text style={styles.label}>Required skills (up to 8)</Text>
        <View style={styles.chipRow}>
          {skills.map((s) => (
            <RanzoChip key={s} label={s} selected onPress={() => setSkills(skills.filter((x) => x !== s))} />
          ))}
        </View>
        <View style={styles.inlineAdd}>
          <View style={{ flex: 1 }}>
            <RanzoTextField value={skillInput} onChangeText={setSkillInput} placeholder="Add a skill" onSubmitEditing={addSkill} />
          </View>
          <RanzoButton label="Add" onPress={addSkill} fullWidth={false} style={styles.addBtn} />
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <RanzoTextField label="Min experience (yrs)" value={experienceMin} onChangeText={setExperienceMin} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <RanzoTextField label="Max experience (yrs)" value={experienceMax} onChangeText={setExperienceMax} keyboardType="numeric" />
          </View>
        </View>
        <RanzoTextField label="Education" value={education} onChangeText={setEducation} placeholder="Minimum education level" />

        <Text style={styles.sectionTitle}>Location & compensation</Text>
        <RanzoTextField label="Job address *" value={jobAddress} onChangeText={setJobAddress} placeholder="Work location" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <RanzoTextField label="Salary min (₹) *" value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <RanzoTextField label="Salary max (₹) *" value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" />
          </View>
        </View>
        <Text style={styles.label}>Salary period</Text>
        <View style={styles.chipRow}>
          {SALARY_PERIODS.map((p) => (
            <RanzoChip key={p} label={p} selected={salaryPeriod === p} onPress={() => setSalaryPeriod(p)} />
          ))}
        </View>
        <RanzoTextField label="Working hours" value={workingHours} onChangeText={setWorkingHours} placeholder="e.g. 9 AM – 6 PM" />
        <Text style={styles.label}>Benefits</Text>
        <View style={styles.chipRow}>
          {benefits.map((b) => (
            <RanzoChip key={b} label={b} selected onPress={() => setBenefits(benefits.filter((x) => x !== b))} />
          ))}
        </View>
        <View style={styles.inlineAdd}>
          <View style={{ flex: 1 }}>
            <RanzoTextField value={benefitInput} onChangeText={setBenefitInput} placeholder="e.g. PF, health insurance" onSubmitEditing={addBenefit} />
          </View>
          <RanzoButton label="Add" onPress={addBenefit} fullWidth={false} style={styles.addBtn} />
        </View>

        <View style={styles.actions}>
          <RanzoButton
            label={saving === 'draft' ? 'Saving...' : 'Save draft'}
            variant="secondary"
            onPress={() => handleSave(false)}
            disabled={saving !== null}
            style={{ flex: 1 }}
          />
          <RanzoButton
            label={saving === 'publish' ? 'Publishing...' : 'Publish'}
            onPress={() => handleSave(true)}
            disabled={saving !== null}
            style={{ flex: 1 }}
          />
        </View>
        <Text style={styles.note}>
          Published jobs go into a pending review queue and won't show up in seeker search until an admin approves them.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  container: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.inkNavy, marginTop: Spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Colors.inkBody, marginTop: Spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  inlineAdd: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  addBtn: { minHeight: 56, paddingHorizontal: Spacing.lg },
  row2: { flexDirection: 'row', gap: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  errorText: { color: Colors.danger, fontWeight: '600' },
  note: { fontSize: 12, color: Colors.inkMuted, textAlign: 'center', marginTop: Spacing.md, lineHeight: 17 },
});
