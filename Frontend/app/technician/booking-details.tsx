import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { RanzoAppBar, RanzoButton, RanzoTextField } from '@/core/widgets';
import { Colors, Spacing, Radius } from '@/core/theme';
import { Booking, acceptBooking, startJourney, startJob, completeJob, getBookingById } from '@/core/api/bookings';

/**
 * Gets the technician's current GPS position, requesting foreground location
 * permission if needed. The backend geofences start/complete OTP submission
 * to within 200m of the booking's service address, so we must have a real
 * fix before calling those endpoints — never send null/fallback coordinates,
 * the backend will just reject them with a 400 anyway.
 */
async function getCurrentCoords(): Promise<{ latitude: number; longitude: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to start or complete this job on-site.');
  }
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    throw new Error('Could not get your current location. Enable GPS and try again.');
  }
}

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id, booking } = useLocalSearchParams();
  
  const [b, setB] = useState<Booking | null>(
    booking ? (JSON.parse(booking as string) as Booking) : null
  );
  
  const [loading, setLoading] = useState(!b);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [otp, setOtp] = useState('');

  const fetchLatest = async (bookingId: string) => {
    try {
      const data = await getBookingById(bookingId);
      setB(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch latest booking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLatest(id as string);
    } else if (b?.id) {
      // If we got the booking object from push popup, fetch latest just in case
      fetchLatest(b.id);
    } else {
      setLoading(false);
      setError("No booking ID provided.");
    }
  }, [id]);

  if (loading) {
     return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <RanzoAppBar title="Job Details" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
     );
  }

  if (!b) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <RanzoAppBar title="Job Details" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || "No booking data found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAction = async (action: 'accept' | 'transit' | 'start' | 'complete') => {
    setActionLoading(true);
    setError(null);
    try {
      if (action === 'accept') {
        await acceptBooking(b.id);
        await fetchLatest(b.id);
      }
      else if (action === 'transit') {
        await startJourney(b.id);
        await fetchLatest(b.id);
      }
      else if (action === 'start') {
        if (otp.length !== 4) throw new Error("Enter 4-digit Start OTP");
        const { latitude, longitude } = await getCurrentCoords();
        await startJob(b.id, otp, latitude, longitude);
        setOtp('');
        await fetchLatest(b.id);
      }
      else if (action === 'complete') {
        if (otp.length !== 4) throw new Error("Enter 4-digit End OTP");
        const { latitude, longitude } = await getCurrentCoords();
        await completeJob(b.id, otp, latitude, longitude);
        setOtp('');
        await fetchLatest(b.id);
      }
    } catch (e: any) {
      setError(e.message || `Failed to ${action} job.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Job Details" showBack />
      
      <ScrollView contentContainerStyle={styles.container}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.white} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.category}>{b.category}</Text>
            <View style={styles.urgencyBadge}>
               <Text style={styles.urgencyText}>{b.urgency_level || 'NORMAL'}</Text>
            </View>
          </View>
          <Text style={styles.jobStatusLabel}>Status: {b.status.replace(/_/g, ' ')}</Text>
          <Text style={styles.problem}>{b.problem_description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.row}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.detailText}>{b.address_details?.house_flat}, {b.address_details?.landmark}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="map-outline" size={20} color={Colors.primary} />
            <Text style={styles.detailText}>{b.address_details?.city} - {b.address_details?.zip_code}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Ionicons name="person" size={20} color={Colors.primary} />
            <Text style={styles.detailText}>Customer ID: {b.customer_id.slice(-6)}</Text>
          </View>
          {/* Mock rating for display as requested */}
          <View style={styles.row}>
            <Ionicons name="star" size={20} color={'#F59E0B'} />
            <Text style={styles.detailText}>4.8 / 5.0 Rating</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.row}>
            <Ionicons name="time" size={20} color={Colors.primary} />
            <Text style={styles.detailText}>Booked At: {new Date(b.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {b.status === 'BROADCASTING' && (
          <>
            <RanzoButton label="Skip" onPress={() => router.back()} type="outline" style={{ flex: 1 }} />
            <RanzoButton label={actionLoading ? "..." : "Accept Job"} onPress={() => handleAction('accept')} disabled={actionLoading} style={{ flex: 1, backgroundColor: Colors.success }} />
          </>
        )}

        {b.status === 'TECH_ACCEPTED' && (
           <Text style={styles.waitText}>Waiting for customer to confirm...</Text>
        )}

        {b.status === 'CUSTOMER_CONFIRMED' && (
           <RanzoButton label={actionLoading ? "..." : "Start Journey"} onPress={() => handleAction('transit')} disabled={actionLoading} style={{ flex: 1, backgroundColor: Colors.primary }} />
        )}

        {b.status === 'IN_TRANSIT' && (
           <View style={{ flex: 1, gap: Spacing.sm }}>
              <Text style={{fontWeight:'bold'}}>Enter Start OTP:</Text>
              <RanzoTextField value={otp} onChangeText={setOtp} placeholder="4-digit OTP from customer" keyboardType="numeric" />
              <RanzoButton label={actionLoading ? "..." : "Start Work"} onPress={() => handleAction('start')} disabled={actionLoading} style={{ backgroundColor: Colors.success }} />
           </View>
        )}

        {b.status === 'IN_PROGRESS' && (
           <View style={{ flex: 1, gap: Spacing.sm }}>
              <Text style={{fontWeight:'bold'}}>Enter End OTP:</Text>
              <RanzoTextField value={otp} onChangeText={setOtp} placeholder="4-digit OTP from customer" keyboardType="numeric" />
              <RanzoButton label={actionLoading ? "..." : "Complete Job"} onPress={() => handleAction('complete')} disabled={actionLoading} style={{ backgroundColor: Colors.success }} />
           </View>
        )}

        {b.status === 'COMPLETED' && (
           <Text style={styles.successText}>Job Completed successfully!</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: Colors.danger,
    padding: Spacing.md,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorBannerText: {
    color: Colors.white,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  jobStatusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  urgencyBadge: {
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  urgencyText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  problem: {
    fontSize: 16,
    color: Colors.inkNormal,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.inkNavy,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 15,
    color: Colors.inkNormal,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  waitText: {
    flex: 1,
    color: Colors.warning,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  successText: {
    flex: 1,
    color: Colors.success,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  }
});
