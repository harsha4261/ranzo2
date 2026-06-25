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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoTextField } from '@/core/widgets';
import { updateProfileMe, UserRole, uploadFile } from '@/core/api/profiles';
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

  // Technician additional states
  const [technicianStep, setTechnicianStep] = useState(1);
  const [nameAsAdhar, setNameAsAdhar] = useState('');
  const [adharNumber, setAdharNumber] = useState('');
  const [adharImageUri, setAdharImageUri] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [villageCity, setVillageCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [preferredDistance, setPreferredDistance] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [seekerCategory, setSeekerCategory] = useState('');
  const [seekerRole, setSeekerRole] = useState('');

  // Dropdown states for Seeker
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    // Reset Seeker role when category changes
    setSeekerRole('');
  }, [seekerCategory]);

  useEffect(() => {
    handleDetectLocation();
    
    // Pre-fill existing profile data
    const fetchExistingProfile = async () => {
      try {
        const existing = await getProfileMe(roleParam);
        if (!existing) return;
        
        if (existing.location) setLocation(existing.location);
        if (existing.latitude) setLatitude(existing.latitude);
        if (existing.longitude) setLongitude(existing.longitude);

        if (roleParam === 'technician') {
          const tech = existing as any;
          if (tech.name_as_per_adhar) setNameAsAdhar(tech.name_as_per_adhar);
          if (tech.skills) setTechSkills(tech.skills);
          if (tech.adhar_number) setAdharNumber(tech.adhar_number);
          if (tech.village_city) setVillageCity(tech.village_city);
          if (tech.pin_code) setPinCode(tech.pin_code);
          if (tech.district) setDistrict(tech.district);
          if (tech.state) setStateName(tech.state);
          if (tech.preferred_distance) setPreferredDistance(tech.preferred_distance.toString());
          if (tech.terms_agreed) setTermsAgreed(tech.terms_agreed);
        } else if (roleParam === 'employer') {
          const emp = existing as any;
          if (emp.company) setCompany(emp.company);
        } else if (roleParam === 'seeker') {
          const seek = existing as any;
          if (seek.category) setSeekerCategory(seek.category);
          if (seek.role) setSeekerRole(seek.role);
        }
      } catch (e) {
        // Ignore if profile doesn't exist yet
      }
    };
    fetchExistingProfile();
  }, []);

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

  const pickImage = async (setter: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0].uri);
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
        if (technicianStep === 1) {
          if (!nameAsAdhar.trim()) {
            setError('Please enter your name as per Adhar Card.');
            setLoading(false);
            return;
          }
          if (techSkills.length < 1 || techSkills.length > 3) {
            setError('Please select between 1 and 3 skills.');
            setLoading(false);
            return;
          }
          setError(null);
          setLoading(false);
          setTechnicianStep(2);
          return; // Stop here, go to step 2
        } else {
          // Step 2 validation
          if (!adharNumber.trim()) {
            setError('Please enter your Adhar Number.');
            setLoading(false); return;
          }
          if (!adharImageUri && !body.adhar_image_url) {
            // Note: We might be missing the uploaded image, but allow skip if backend already has it.
            // Actually, for simplicity, require them to re-upload if it's their first time saving it properly.
            if (!adharImageUri) {
              setError('Please upload your Adhar Card.');
              setLoading(false); return;
            }
          }
          if (!photoUri) {
            setError('Please upload your Photo.');
            setLoading(false); return;
          }
          if (!villageCity.trim() || !pinCode.trim() || !district.trim() || !stateName.trim() || !preferredDistance.trim()) {
            setError('Please fill all location fields.');
            setLoading(false); return;
          }
          if (!termsAgreed) {
            setError('You must agree to the terms and conditions.');
            setLoading(false); return;
          }

          // Upload images
          let uploadedAdharUrl = '';
          let uploadedPhotoUrl = '';
          try {
            // Upload adhar
            const ext1 = adharImageUri.split('.').pop() || 'jpg';
            const res1 = await uploadFile(adharImageUri, `adhar.${ext1}`, `image/${ext1}`);
            uploadedAdharUrl = res1.url;

            // Upload photo
            const ext2 = photoUri.split('.').pop() || 'jpg';
            const res2 = await uploadFile(photoUri, `photo.${ext2}`, `image/${ext2}`);
            uploadedPhotoUrl = res2.url;
          } catch (e: any) {
            setError('Image upload failed: ' + e.message);
            setLoading(false);
            return;
          }

          body = {
            name_as_per_adhar: nameAsAdhar.trim(),
            skills: techSkills,
            adhar_number: adharNumber.trim(),
            adhar_image_url: uploadedAdharUrl,
            photo_url: uploadedPhotoUrl,
            village_city: villageCity.trim(),
            pin_code: pinCode.trim(),
            district: district.trim(),
            state: stateName.trim(),
            preferred_distance: parseInt(preferredDistance, 10) || 0,
            terms_agreed: termsAgreed,
            online_status: false,
            location: location.trim(),
            latitude,
            longitude,
          };
        }
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
            {roleParam === 'technician' && technicianStep === 1 && (
              <View style={styles.section}>
                <RanzoTextField
                  label="Enter name (as per Adhar Card)*"
                  value={nameAsAdhar}
                  onChangeText={setNameAsAdhar}
                  placeholder="John Doe"
                />

                <Text style={styles.sectionTitle}>Register your skill (Max. 3)</Text>
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
              </View>
            )}

            {roleParam === 'technician' && technicianStep === 2 && (
              <View style={styles.section}>
                <RanzoTextField
                  label="Adhar Number*"
                  value={adharNumber}
                  onChangeText={setAdharNumber}
                  keyboardType="numeric"
                  placeholder="1234 5678 9012"
                />

                <View style={styles.uploadRow}>
                  <Text style={styles.uploadLabel}>Upload Adhar*</Text>
                  <View style={styles.uploadActions}>
                    <RanzoButton label={adharImageUri ? "Selected" : "Browse"} variant="secondary" onPress={() => pickImage(setAdharImageUri)} />
                  </View>
                </View>

                <View style={styles.uploadRow}>
                  <Text style={styles.uploadLabel}>Upload Photo*</Text>
                  <View style={styles.uploadActions}>
                    <RanzoButton label={photoUri ? "Selected" : "Browse"} variant="secondary" onPress={() => pickImage(setPhotoUri)} />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <RanzoTextField label="Village / City*" value={villageCity} onChangeText={setVillageCity} placeholder="Village/City" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <RanzoTextField label="PIN Code*" value={pinCode} onChangeText={setPinCode} keyboardType="numeric" placeholder="123456" />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <RanzoTextField label="District*" value={district} onChangeText={setDistrict} placeholder="District" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <RanzoTextField label="State*" value={stateName} onChangeText={setStateName} placeholder="State" />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <RanzoTextField label="Preferred Distance*" value={preferredDistance} onChangeText={setPreferredDistance} keyboardType="numeric" placeholder="10" />
                  </View>
                  <Text style={{ marginTop: 24, fontSize: 16, fontWeight: '700', color: Colors.inkBody }}>K.M</Text>
                </View>

                <Text style={{ fontSize: 13, color: Colors.inkMuted, marginTop: Spacing.sm }}>
                  (You will get work notifications below above mentioned distance)
                </Text>

                <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md }} onPress={() => setTermsAgreed(!termsAgreed)}>
                  <Ionicons name={termsAgreed ? 'checkbox' : 'square-outline'} size={24} color={Colors.primary} />
                  <Text style={{ fontSize: 14, color: Colors.inkBody }}>I agree with terms & conditions of Ranzo</Text>
                </Pressable>
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
            {roleParam === 'technician' && technicianStep === 1 ? (
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <RanzoButton label="Next" onPress={handleSaveProfile} loading={loading} />
                </View>
              </View>
            ) : roleParam === 'technician' && technicianStep === 2 ? (
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <RanzoButton label="Back" variant="secondary" onPress={() => setTechnicianStep(1)} />
                </View>
                <View style={{ flex: 1 }}>
                  <RanzoButton label="Submit" onPress={handleSaveProfile} loading={loading} />
                </View>
              </View>
            ) : (
              <RanzoButton
                label="Save & Complete Profile"
                onPress={handleSaveProfile}
                loading={loading}
              />
            )}
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
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkBody,
    flex: 1,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
