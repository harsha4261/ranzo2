import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoButton, RanzoAppBar, LoginFloatingShowcase } from '@/core/widgets';
import { Ionicons } from '@expo/vector-icons';

export default function LoginRegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appBar}>
        <Text style={styles.brandTitle}>Ranzo</Text>
      </View>
      <View style={styles.container}>
        <LoginFloatingShowcase />

        <View style={styles.cardsContainer}>
          <Text style={styles.cardHeaderTitle}>Available Portals</Text>
          
          {/* Card 1: Home Services */}
          <View style={styles.productCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="construct-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>Home Services</Text>
                <Text style={styles.cardDesc}>Register your skill, Book a technician</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Job Portal */}
          <View style={styles.productCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="briefcase-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>Job Portal</Text>
                <Text style={styles.cardDesc}>Find job opportunities or hire top talent</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <RanzoButton
            label="Log In"
            onPress={() => router.push('/auth/login')}
          />
          <RanzoButton
            label="Register"
            variant="secondary"
            onPress={() => router.push('/auth/register')}
          />
        </View>

        {/* <Text style={styles.footerNote}>
          Premium experience for service professionals & employers.
        </Text> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceWhite,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    justifyContent: 'space-between',
  },
  appBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.inkNavy,
    marginBottom: Spacing.xs,
  },
  cardsContainer: {
    gap: Spacing.md,
    marginVertical: Spacing.lg,
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
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  actionContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.inkMuted,
    textAlign: 'center',
  },
});
