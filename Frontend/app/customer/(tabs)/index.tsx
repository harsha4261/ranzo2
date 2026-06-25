import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { getProfileMe, CustomerProfile } from '@/core/api/profiles';
import { getActiveBookings, confirmTechnician, cancelBooking, Booking } from '@/core/api/bookings';
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
        // Silent error on polling
        if (loading) setError(err?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Smart polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmTechnician(bookingId);
      const updatedBookings = await getActiveBookings('customer');
      setBookings(updatedBookings);
    } catch (err: any) {
      alert('Failed to confirm: ' + err.message);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId, 'customer');
      const updatedBookings = await getActiveBookings('customer');
      setBookings(updatedBookings);
    } catch (err: any) {
      alert('Failed to cancel: ' + err.message);
    }
  };


  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar 
        title="Customer Dashboard" 
        showBack={false} 
        trailing={
          <Pressable onPress={() => router.push('/profile-details?role=customer' as any)}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={Colors.inkMuted} />
            </View>
          </Pressable>
        }
      />

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
                  <Text style={styles.infoLabel}>{b.category}</Text>
                  
                  {/* Better status formatting */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                     <Ionicons name="ellipse" size={10} color={['COMPLETED', 'CUSTOMER_CONFIRMED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(b.status) ? Colors.success : Colors.warning} />
                     <Text style={[styles.infoValue, {fontWeight: '700'}]}>{b.status.replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={styles.infoValue}>Booked: {new Date(b.created_at).toLocaleString()}</Text>

                  {b.status === 'TECH_ACCEPTED' && (
                    <View style={{ marginTop: Spacing.sm, gap: Spacing.xs }}>
                      <Text style={{ fontWeight: 'bold' }}>A technician has accepted your request!</Text>
                      <RanzoButton 
                        label="Confirm Technician" 
                        onPress={() => handleConfirm(b.id)} 
                      />
                    </View>
                  )}
                  
                  {['CUSTOMER_CONFIRMED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(b.status) && b.verification && (
                    <View style={styles.otpBox}>
                      <Text style={styles.otpTitle}>Share these OTPs with the technician</Text>
                      {['CUSTOMER_CONFIRMED', 'IN_TRANSIT'].includes(b.status) && (
                         <Text style={styles.otpText}>Start OTP: <Text style={{fontWeight: '900', color: Colors.primary}}>{b.verification.start_otp}</Text></Text>
                      )}
                      {b.status === 'IN_PROGRESS' && (
                         <Text style={styles.otpText}>End OTP: <Text style={{fontWeight: '900', color: Colors.danger}}>{b.verification.end_otp}</Text></Text>
                      )}
                    </View>
                  )}

                  {/* Cancel Button for active states */}
                  {['CREATED', 'BROADCASTING', 'TECH_ACCEPTED', 'CUSTOMER_CONFIRMED', 'IN_TRANSIT'].includes(b.status) && (
                    <View style={{ marginTop: Spacing.md }}>
                      <Pressable onPress={() => handleCancel(b.id)} style={styles.cancelBtn}>
                         <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                      </Pressable>
                    </View>
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
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  otpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted,
    marginBottom: Spacing.xs,
  },
  otpText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.inkNavy,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    color: Colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  }
});
