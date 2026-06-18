import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { getProfileMe, CustomerProfile } from '@/core/api/profiles';
import { getActiveBookings, confirmTechnician, Booking } from '@/core/api/bookings';
import { useAuthStore } from '@/data/store';

const SERVICES = [
  { icon: 'construct-outline' as const, label: 'Carpenter' },
  { icon: 'flash-outline' as const, label: 'Electrician' },
  { icon: 'water-outline' as const, label: 'Plumber' },
  { icon: 'snow-outline' as const, label: 'AC Technician' },
  { icon: 'color-palette-outline' as const, label: 'Painter' },
  { icon: 'sparkles-outline' as const, label: 'Cleaner' },
  { icon: 'flame-outline' as const, label: 'Geyser Repair' },
  { icon: 'tv-outline' as const, label: 'TV Repair' },
  { icon: 'refrigerator-outline' as const, label: 'Appliance Repair' },
];

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, bookData] = await Promise.all([
          getProfileMe('customer'),
          getActiveBookings('customer')
        ]);
        setProfile(profData as CustomerProfile);
        setBookings(bookData);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConfirm = async (bookingId: string, technicianId: string) => {
    try {
      await confirmTechnician(bookingId, technicianId);
      const updatedBookings = await getActiveBookings('customer');
      setBookings(updatedBookings);
    } catch (err: any) {
      alert('Failed to confirm: ' + err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Customer Dashboard" showBack={false} />

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
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Header */}
          <View style={styles.welcomeCard}>
            <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeName}>Hello, {user?.name || 'Customer'} 👋</Text>
              <Text style={styles.welcomeSub}>Find trusted professionals near you</Text>
            </View>
          </View>

          {/* Available Services — static catalog */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Services</Text>

            <View style={styles.servicesGrid}>
              {SERVICES.map((s) => (
                <View key={s.label} style={styles.serviceItem}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name={s.icon} size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.serviceLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Active bookings state */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Bookings</Text>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={40} color={Colors.inkMuted} />
                <Text style={styles.emptyTitle}>No active bookings</Text>
                <Text style={styles.emptyDesc}>
                  Click the + Book tab to find a technician.
                </Text>
              </View>
            ) : (
              bookings.map((b) => (
                <View key={b.id} style={styles.infoCard}>
                  <Text style={styles.infoLabel}>{b.category} - {b.status}</Text>
                  <Text style={styles.infoValue}>{new Date(b.booking_datetime).toLocaleString()}</Text>
                  {b.status === 'pending_selection' && b.accepted_technicians.length > 0 && (
                    <View style={{ marginTop: Spacing.sm, gap: Spacing.xs }}>
                      <Text style={{ fontWeight: 'bold' }}>Select a Technician:</Text>
                      {b.accepted_technicians.map((techId) => (
                        <RanzoButton 
                          key={techId} 
                          label={`Accept Tech ID: ${techId.substring(0,6)}...`} 
                          onPress={() => handleConfirm(b.id, techId)} 
                        />
                      ))}
                    </View>
                  )}
                  {b.status === 'in_progress' && (
                    <Text style={{ color: Colors.primary, marginTop: Spacing.sm }}>
                      Technician {b.technician_id?.substring(0,6)} is assigned. Contact details available.
                    </Text>
                  )}
                </View>
              ))
            )}
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
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Elevation.card,
  },
  welcomeText: { flex: 1 },
  welcomeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  welcomeSub: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    gap: Spacing.sm,
    ...Elevation.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.inkBody,
    lineHeight: 22,
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.inkMuted,
    lineHeight: 18,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  serviceItem: {
    width: '30%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Elevation.card,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkBody,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
