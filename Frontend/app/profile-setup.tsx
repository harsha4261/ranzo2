import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoTextField } from '@/core/widgets';
import { updateProfileMe, UserRole } from '@/core/api/profiles';
import { getUserMe } from '@/core/api/users';
import { useAuthStore } from '@/data/store';

// Predefined Technician Skills List
const TECHNICIAN_SKILLS = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'ac_technician', label: 'AC Technician' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'mason', label: 'Mason' },
  { value: 'welder', label: 'Welder' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'cook', label: 'Cook' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'geyser_repair', label: 'Geyser Repair' },
  { value: 'refrigerator_repair', label: 'Refrigerator Repair' },
  { value: 'tv_repair', label: 'TV Repair' },
  { value: 'washing_machine_repair', label: 'Washing Machine Repair' },
];

// Predefined Job Portal Categories & Roles Mapping
const JOB_CATEGORIES = [
  { value: 'it_technology', label: 'IT & Technology' },
  { value: 'construction', label: 'Construction' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail_sales', label: 'Retail & Sales' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'finance_banking', label: 'Finance & Banking' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'security_services', label: 'Security Services' },
  { value: 'media_entertainment', label: 'Media & Entertainment' },
];

const CATEGORY_ROLES_MAP: Record<string, string[]> = {
  it_technology: [
    'software_developer', 'data_analyst', 'system_admin',
    'ui_ux_designer', 'qa_engineer', 'devops_engineer', 'cybersecurity_analyst',
  ],
  construction: [
    'civil_engineer', 'site_supervisor', 'mason',
    'carpenter', 'plumber', 'surveyor', 'foreman',
  ],
  healthcare: [
    'nurse', 'pharmacist', 'lab_technician',
    'medical_assistant', 'doctor', 'physiotherapist',
  ],
  education: [
    'teacher', 'tutor', 'school_administrator',
    'curriculum_developer', 'counselor',
  ],
  retail_sales: [
    'sales_associate', 'store_manager', 'cashier',
    'inventory_manager', 'visual_merchandiser',
  ],
  hospitality: [
    'chef', 'waiter', 'hotel_manager',
    'housekeeper', 'receptionist', 'event_coordinator',
  ],
  manufacturing: [
    'machine_operator', 'quality_inspector', 'production_supervisor',
    'welder', 'assembler',
  ],
  transportation: [
    'driver', 'delivery_executive', 'logistics_coordinator',
    'fleet_manager', 'dispatcher',
  ],
  finance_banking: [
    'accountant', 'financial_analyst', 'loan_officer',
    'insurance_agent', 'teller',
  ],
  agriculture: [
    'farmer', 'agronomist', 'irrigation_specialist',
    'farm_manager', 'horticulturist',
  ],
  security_services: [
    'security_guard', 'cctv_operator', 'security_supervisor', 'bouncer',
  ],
  media_entertainment: [
    'photographer', 'videographer', 'content_creator',
    'graphic_designer', 'journalist',
  ],
};

function formatLabel(str: string) {
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const roleParam = searchParams.role as UserRole;
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [company, setCompany] = useState('');
  const [techSkills, setTechSkills] = useState<string[]>([]);
  const [onlineStatus, setOnlineStatus] = useState(false);

  const [seekerCategory, setSeekerCategory] = useState('');
  const [seekerRole, setSeekerRole] = useState('');

  // Dropdown states for Seeker
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    // Reset Seeker role when category changes
    setSeekerRole('');
  }, [seekerCategory]);

  const handleDetectLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied. Please enable it in settings.');
        return;
      }

      let locationCoords = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: locationCoords.coords.latitude,
        longitude: locationCoords.coords.longitude,
      });

      if (geocode.length > 0) {
        const place = geocode[0];
        const address = [place.city, place.region, place.country].filter(Boolean).join(', ');
        setLocation(address);
        setLatitude(locationCoords.coords.latitude);
        setLongitude(locationCoords.coords.longitude);
      } else {
        setError('Could not determine address from location.');
      }
    } catch (e: any) {
      setError('Failed to fetch location: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (techSkills.includes(skill)) {
      setTechSkills(techSkills.filter((s) => s !== skill));
    } else {
      if (techSkills.length >= 3) {
        setError('You can select a maximum of 3 skills.');
        return;
      }
      setTechSkills([...techSkills, skill]);
      setError(null);
    }
  };

  const handleSaveProfile = async () => {
    setError(null);
    setLoading(true);
    try {
      let body: Record<string, any> = {};

      if (roleParam === 'customer') {
        if (location.trim().length < 2 || location.trim().length > 100) {
          setError('Location must be between 2 and 100 characters.');
          setLoading(false);
          return;
        }
        if (latitude === null || longitude === null) {
          setError('Please detect your location.');
          setLoading(false);
          return;
        }
        body = { location: location.trim(), latitude, longitude };
      } else if (roleParam === 'technician') {
        if (techSkills.length < 1 || techSkills.length > 3) {
          setError('Please select between 1 and 3 skills.');
          setLoading(false);
          return;
        }
        if (location.trim().length < 2 || location.trim().length > 100) {
          setError('Location must be between 2 and 100 characters.');
          setLoading(false);
          return;
        }
        if (latitude === null || longitude === null) {
          setError('Please detect your location.');
          setLoading(false);
          return;
        }
        body = { skills: techSkills, location: location.trim(), latitude, longitude, online_status: onlineStatus };
      } else if (roleParam === 'seeker') {
        if (!seekerCategory) {
          setError('Please select a job category.');
          setLoading(false);
          return;
        }
        if (!seekerRole) {
          setError('Please select a job role.');
          setLoading(false);
          return;
        }
        if (location.trim().length < 2 || location.trim().length > 100) {
          setError('Location must be between 2 and 100 characters.');
          setLoading(false);
          return;
        }
        if (latitude === null || longitude === null) {
          setError('Please detect your location.');
          setLoading(false);
          return;
        }
        body = {
          category: seekerCategory,
          role: seekerRole,
          location: location.trim(),
          latitude,
          longitude,
        };
      } else if (roleParam === 'employer') {
        if (company.trim().length < 2 || company.trim().length > 100) {
          setError('Company name must be between 2 and 100 characters.');
          setLoading(false);
          return;
        }
        if (location.trim().length < 2 || location.trim().length > 100) {
          setError('Location must be between 2 and 100 characters.');
          setLoading(false);
          return;
        }
        if (latitude === null || longitude === null) {
          setError('Please detect your location.');
          setLoading(false);
          return;
        }
        body = {
          company: company.trim(),
          location: location.trim(),
          latitude,
          longitude,
        };
      }

      await updateProfileMe(roleParam, body);
      // Fetch latest user details and update Zustand store
      const updatedUser = await getUserMe();
      await setUser(updatedUser);

      // Navigate to the role dashboard
      router.replace(`/${roleParam}/dashboard` as any);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title={`${formatLabel(roleParam || '')} Profile Setup`} showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Provide your details to register as a {formatLabel(roleParam || '')}.
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.form}>
            {/* Customer Form */}
            {roleParam === 'customer' && (
              <View style={styles.locationRow}>
                <View style={styles.locationInputWrap}>
                  <RanzoTextField
                    label="Your Location"
                    value={location}
                    onChangeText={() => {}}
                    placeholder="Tap detect button"
                    editable={false}
                  />
                </View>
                <Pressable style={styles.detectBtn} onPress={handleDetectLocation}>
                  <Ionicons name="location" size={24} color={Colors.white} />
                </Pressable>
              </View>
            )}

            {/* Technician Form */}
            {roleParam === 'technician' && (
              <View style={styles.section}>
                <View style={styles.locationRow}>
                  <View style={styles.locationInputWrap}>
                    <RanzoTextField
                      label="Your Location"
                      value={location}
                      onChangeText={() => {}}
                      placeholder="Tap detect button"
                      editable={false}
                    />
                  </View>
                  <Pressable style={styles.detectBtn} onPress={handleDetectLocation}>
                    <Ionicons name="location" size={24} color={Colors.white} />
                  </Pressable>
                </View>
                <Text style={styles.sectionTitle}>Select Your Skills (1 to 3)</Text>
                <View style={styles.skillsGrid}>
                  {TECHNICIAN_SKILLS.map((skill) => {
                    const isSelected = techSkills.includes(skill.value);
                    return (
                      <Pressable
                        key={skill.value}
                        style={[styles.skillChip, isSelected && styles.selectedSkillChip]}
                        onPress={() => toggleSkill(skill.value)}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                          size={16}
                          color={isSelected ? Colors.white : Colors.primary}
                        />
                        <Text style={[styles.skillChipText, isSelected && styles.selectedSkillChipText]}>
                          {skill.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={styles.toggleLabel}>Go Online Immediately</Text>
                    <Text style={styles.toggleDesc}>Make yourself visible to customers for bookings</Text>
                  </View>
                  <Switch
                    value={onlineStatus}
                    onValueChange={setOnlineStatus}
                    trackColor={{ false: Colors.divider, true: Colors.primaryTint }}
                    thumbColor={onlineStatus ? Colors.primary : Colors.inkMuted}
                  />
                </View>
              </View>
            )}

            {/* Seeker Form */}
            {roleParam === 'seeker' && (
              <View style={styles.section}>
                <Text style={styles.dropdownLabel}>Job Category</Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={styles.dropdownValue}>
                    {seekerCategory
                      ? JOB_CATEGORIES.find((c) => c.value === seekerCategory)?.label
                      : 'Select job category'}
                  </Text>
                  <Ionicons name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.inkMuted} />
                </Pressable>

                {showCategoryDropdown && (
                  <View style={styles.dropdownList}>
                    {JOB_CATEGORIES.map((c) => (
                      <Pressable
                        key={c.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSeekerCategory(c.value);
                          setShowCategoryDropdown(false);
                          setError(null);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{c.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {seekerCategory && (
                  <View style={styles.subSection}>
                    <Text style={styles.dropdownLabel}>Job Role</Text>
                    <Pressable
                      style={styles.dropdownTrigger}
                      onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                    >
                      <Text style={styles.dropdownValue}>
                        {seekerRole ? formatLabel(seekerRole) : 'Select job role'}
                      </Text>
                      <Ionicons name={showRoleDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.inkMuted} />
                    </Pressable>

                    {showRoleDropdown && (
                      <View style={styles.dropdownList}>
                        {CATEGORY_ROLES_MAP[seekerCategory]?.map((r) => (
                          <Pressable
                            key={r}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSeekerRole(r);
                              setShowRoleDropdown(false);
                              setError(null);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{formatLabel(r)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.subSection}>
                  <View style={styles.locationRow}>
                    <View style={styles.locationInputWrap}>
                      <RanzoTextField
                        label="Preferred Job Location"
                        value={location}
                        onChangeText={() => {}}
                        placeholder="Tap detect button"
                        editable={false}
                      />
                    </View>
                    <Pressable style={styles.detectBtn} onPress={handleDetectLocation}>
                      <Ionicons name="location" size={24} color={Colors.white} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Employer Form */}
            {roleParam === 'employer' && (
              <View style={styles.section}>
                <RanzoTextField
                  label="Company Name"
                  value={company}
                  onChangeText={(t) => {
                    setCompany(t);
                    setError(null);
                  }}
                  placeholder="Enter your company name"
                  helper="Minimum 2 characters, maximum 100 characters"
                />
                <View style={styles.subSection}>
                  <View style={styles.locationRow}>
                    <View style={styles.locationInputWrap}>
                      <RanzoTextField
                        label="Company Address/Location"
                        value={location}
                        onChangeText={() => {}}
                        placeholder="Tap detect button"
                        editable={false}
                      />
                    </View>
                    <Pressable style={styles.detectBtn} onPress={handleDetectLocation}>
                      <Ionicons name="location" size={24} color={Colors.white} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actionWrap}>
            <RanzoButton
              label="Save & Complete Profile"
              onPress={handleSaveProfile}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceWhite,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.inkMuted,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  form: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkBody,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.surfaceCanvas,
    gap: Spacing.xs,
  },
  selectedSkillChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  skillChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedSkillChipText: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: Spacing.md,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkBody,
  },
  toggleDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkBody,
    marginBottom: Spacing.xs,
  },
  dropdownTrigger: {
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCanvas,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  dropdownValue: {
    fontSize: 15,
    color: Colors.inkBody,
  },
  dropdownList: {
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dropdownItemText: {
    fontSize: 15,
    color: Colors.inkBody,
  },
  subSection: {
    marginTop: Spacing.md,
  },
  actionWrap: {
    marginTop: Spacing.xxl,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  locationInputWrap: {
    flex: 1,
  },
  detectBtn: {
    height: 56,
    width: 56,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
