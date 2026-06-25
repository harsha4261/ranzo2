import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoButton } from '@/core/widgets';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/data/store';
import { useTranslation } from '@/core/i18n';

export default function JobsPortalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const handleRoleSelect = (role: 'seeker' | 'employer') => {
    if (user) {
      const isCompleted = user?.registered_roles?.includes(role);
      if (isCompleted) {
        router.push(`/${role}/dashboard` as any);
      } else {
        router.push(`/profile-setup?role=${role}` as any);
      }
    } else {
      router.push(`/auth/register?targetRole=${role}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRowContainer}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logoIcon}
          resizeMode="contain"
        />
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTextBold}>{t('auth.headerHireJobs')}</Text>
          <Text style={styles.headerTextBold}>{t('auth.headerRequestReceive')}</Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>{t('jobsPortal.title')}</Text>
          <Text style={styles.mainSubtitle}>{t('jobsPortal.subtitle')}</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity onPress={() => handleRoleSelect('seeker')}>
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="search-outline" size={28} color={Colors.primary} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{t('jobsPortal.lookingJobTitle')}</Text>
                  <Text style={styles.cardDesc}>{t('jobsPortal.lookingJobDesc')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleRoleSelect('employer')}>
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="megaphone-outline" size={28} color={Colors.primary} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{t('jobsPortal.postJobTitle')}</Text>
                  <Text style={styles.cardDesc}>{t('jobsPortal.postJobDesc1')}</Text>
                  <Text style={styles.cardDesc}>{t('jobsPortal.postJobDesc2')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {!user && (
          <View style={styles.actionRow}>
            <View style={styles.buttonWrapper}>
              <RanzoButton
                label={t('auth.registerBtn')}
                onPress={() => router.push({ pathname: '/auth/register', params: { returnUrl: '/auth/jobs-portal' } } as any)}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <RanzoButton
                label={t('auth.signInBtn')}
                variant="secondary"
                onPress={() => router.push({ pathname: '/auth/login', params: { returnUrl: '/auth/jobs-portal' } } as any)}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomNavRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/')}>
            <Ionicons name="home" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceWhite,
  },
  headerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  headerTextWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
  },
  headerTextBold: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.inkNavy,
    marginTop: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    justifyContent: 'flex-start',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.inkNavy,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: Colors.inkNavy,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  productCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  buttonWrapper: {
    flex: 1,
  },
  bottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
    marginBottom: Spacing.md,
  },
  iconButton: {
    backgroundColor: Colors.primarySoft,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
