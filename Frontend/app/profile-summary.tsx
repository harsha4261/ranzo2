import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { useAuthStore } from '@/data/store';

const ROLES: { value: 'customer' | 'technician' | 'seeker' | 'employer'; label: string; desc: string }[] = [
  { value: 'customer', label: 'Customer', desc: 'Book home services & manage bookings' },
  { value: 'technician', label: 'Technician', desc: 'Provide home services & manage status' },
  { value: 'seeker', label: 'Job Seeker', desc: 'Find and apply for local job listings' },
  { value: 'employer', label: 'Employer', desc: 'Post job listings and hire candidates' },
];

export default function ProfileSummaryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login-register' as any);
  };

  const handleRolePress = (role: 'customer' | 'technician' | 'seeker' | 'employer') => {
    const isCompleted = user?.registered_roles?.includes(role);
    if (isCompleted) {
      if (role === 'customer') {
        router.push('/customer' as any);
      } else {
        router.push(`/${role}/dashboard` as any);
      }
    } else {
      router.push(`/profile-setup?role=${role}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Profile Summary" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{user?.name || 'Ranzo User'}</Text>
            <Text style={styles.userPhone}>+91 {user?.phone}</Text>
            <Text style={styles.userJoined}>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>

        {/* Roles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Role Profiles</Text>
          <Text style={styles.sectionSubtitle}>Complete profiles to unlock and manage different roles.</Text>

          <View style={styles.roleList}>
            {ROLES.map((role) => {
              const isCompleted = user?.registered_roles?.includes(role.value);
              return (
                <Pressable
                  key={role.value}
                  style={({ pressed }) => [styles.roleItem, pressed && { opacity: 0.8 }]}
                  onPress={() => handleRolePress(role.value)}
                >
                  <View style={styles.roleIconWrap}>
                    <Ionicons
                      name={
                        role.value === 'customer'
                          ? 'people'
                          : role.value === 'technician'
                            ? 'hammer'
                            : role.value === 'seeker'
                              ? 'search'
                              : 'business'
                      }
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.roleMeta}>
                    <Text style={styles.roleLabel}>{role.label}</Text>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </View>
                  <View style={styles.roleBadgeWrap}>
                    {isCompleted ? (
                      <View style={[styles.badge, styles.completedBadge]}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.badgeTextCompleted}>Active</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, styles.pendingBadge]}>
                        <Ionicons name="alert-circle" size={14} color={Colors.inkMuted} />
                        <Text style={styles.badgeTextPending}>Setup</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        
        {/* Logout Action */}
        <View style={styles.logoutWrap}>
          <RanzoButton
            label="Log Out"
            variant="secondary"
            onPress={handleLogout}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceWhite,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceCanvas,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.inkBody,
    fontWeight: '600',
  },
  userJoined: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginBottom: Spacing.sm,
  },
  roleList: {
    gap: Spacing.md,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Elevation.card,
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleMeta: {
    flex: 1,
    gap: 2,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.inkBody,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  roleBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadge: {
    backgroundColor: Colors.successSoft,
  },
  pendingBadge: {
    backgroundColor: Colors.divider,
  },
  badgeTextCompleted: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  badgeTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  logoutWrap: {
    marginTop: Spacing.lg,
  },
});
