import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { getProfileMe, ProfileResponse, TechnicianProfile, EmployerProfile, SeekerProfile, CustomerProfile, UserRole } from '@/core/api/profiles';
import { apiUrl } from '@/core/config/api';

function formatLabel(str: string) {
  if (!str) return '';
  return str.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const roleParam = searchParams.role as UserRole;
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileMe(roleParam);
        setProfile(data);
      } catch (err: any) {
        setError(err?.message || `Failed to load ${roleParam} profile.`);
      } finally {
        setLoading(false);
      }
    };
    if (roleParam) {
      fetchProfile();
    } else {
      setError('Role parameter is missing.');
      setLoading(false);
    }
  }, [roleParam]);

  const renderDetails = () => {
    if (!profile) return null;

    if (roleParam === 'technician') {
      const tech = profile as TechnicianProfile;
      return (
        <View style={styles.section}>
          <View style={styles.profileDetailsCard}>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Adhar No.: </Text>{tech.adhar_number || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Village/City: </Text>{tech.village_city || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>PIN Code: </Text>{tech.pin_code || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>District: </Text>{tech.district || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>State: </Text>{tech.state || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Preferred Distance: </Text>{tech.preferred_distance ? `${tech.preferred_distance} K.M` : 'N/A'}</Text>
            
            <Text style={[styles.detailLabel, { marginTop: Spacing.sm }]}>Technical skills: </Text>
            <Text style={styles.detailText}>
              {tech.skills ? tech.skills.map(formatLabel).join(', ') : 'None'}
            </Text>

            <View style={styles.imagesRow}>
              <View style={styles.imageBox}>
                {tech.photo_url ? (
                  <Image source={{ uri: apiUrl(tech.photo_url) }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imageBoxText}>No Pic</Text>
                )}
              </View>
              <View style={styles.imageBox}>
                {tech.adhar_image_url ? (
                  <Image source={{ uri: apiUrl(tech.adhar_image_url) }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imageBoxText}>No Adhar</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (roleParam === 'employer') {
      const emp = profile as EmployerProfile;
      return (
        <View style={styles.section}>
          <View style={styles.profileDetailsCard}>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Company Name: </Text>{emp.company || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Office Location: </Text>{emp.location || 'N/A'}</Text>
          </View>
        </View>
      );
    }

    if (roleParam === 'seeker') {
      const seek = profile as SeekerProfile;
      return (
        <View style={styles.section}>
          <View style={styles.profileDetailsCard}>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Category: </Text>{seek.category ? formatLabel(seek.category) : 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Target Role: </Text>{seek.role ? formatLabel(seek.role) : 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Preferred Location: </Text>{seek.location || 'N/A'}</Text>
          </View>
        </View>
      );
    }

    if (roleParam === 'customer') {
      const cust = profile as CustomerProfile;
      return (
        <View style={styles.section}>
          <View style={styles.profileDetailsCard}>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Home Location: </Text>{cust.location || 'N/A'}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title={`${formatLabel(roleParam)} Profile Details`} showBack onBack={() => router.back()} />
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
          {renderDetails()}
          <View style={styles.editRow}>
            <RanzoButton label="Edit Profile" onPress={() => router.push(`/profile-setup?role=${roleParam}` as any)} />
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
  section: { gap: Spacing.md },
  profileDetailsCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    color: Colors.inkBody,
  },
  detailLabel: {
    fontWeight: '700',
    color: Colors.inkNavy,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  imageBox: {
    flex: 1,
    height: 120,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  imageBoxText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    resizeMode: 'cover',
  },
  editRow: {
    marginTop: Spacing.xl,
  },
});
