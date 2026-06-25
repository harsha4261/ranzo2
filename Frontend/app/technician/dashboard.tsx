import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Switch,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { getProfileMe, updateProfileMe, TechnicianProfile } from '@/core/api/profiles';
import { apiUrl } from '@/core/config/api';
import { useAuthStore } from '@/data/store';
import { getActiveBookings, acceptBooking, startJourney, startJob, completeJob, Booking } from '@/core/api/bookings';
import { RanzoTextField } from '@/core/widgets';


function formatSkill(str: string) {
  return str.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  const updateOtp = (id: string, val: string) => setOtpInputs(prev => ({...prev, [id]: val}));


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, bookData] = await Promise.all([
          getProfileMe('technician'),
          getActiveBookings('technician')
        ]);
        setProfile(profData as TechnicianProfile);
        setOnline((profData as TechnicianProfile).online_status);
        setBookings(bookData);
      } catch (err: any) {
        if (loading) setError(err?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, bookingId: string) => {
    try {
      if (action === 'accept') await acceptBooking(bookingId);
      if (action === 'transit') await startJourney(bookingId);
      if (action === 'start') {
         const otp = otpInputs[bookingId] || '';
         if (otp.length !== 4) return alert("Enter 4 digit Start OTP");
         await startJob(bookingId, otp);
         updateOtp(bookingId, '');
      }
      if (action === 'complete') {
         const otp = otpInputs[bookingId] || '';
         if (otp.length !== 4) return alert("Enter 4 digit End OTP");
         await completeJob(bookingId, otp);
         updateOtp(bookingId, '');
      }
      
      // Refresh
      const b = await getActiveBookings('technician');
      setBookings(b);
    } catch (e: any) {
      alert(e.message || "Action failed");
    }
  };


  const handleToggleOnline = async (val: boolean) => {
    if (!profile || togglingOnline) return;
    setOnline(val);
    setTogglingOnline(true);
    try {
      const updated = await updateProfileMe('technician', {
        skills: profile.skills,
        online_status: val,
      }) as TechnicianProfile;
      setProfile(updated);
    } catch (err: any) {
      // Revert on error
      setOnline(!val);
      alert(err?.message || 'Failed to update status.');
    } finally {
      setTogglingOnline(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar 
        title="Technician Dashboard" 
        showBack 
        onBack={() => router.replace('/home' as any)} 
        trailing={
          <Pressable onPress={() => router.push('/profile-details?role=technician' as any)}>
            {profile?.photo_url ? (
              <Image 
                source={{ uri: apiUrl(profile.photo_url) }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={Colors.inkMuted} />
              </View>
            )}
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
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Welcome */}
          <View style={styles.welcomeCard}>
            <Ionicons name="hammer-outline" size={36} color={Colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeName}>Hello, {user?.name || 'Technician'} 👋</Text>
              <Text style={styles.welcomeSub}>Manage your availability below</Text>
            </View>
          </View>

          {!profile?.is_approved && (
            <View style={styles.pendingBanner}>
              <Ionicons name="time-outline" size={24} color={Colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>Pending Admin Approval</Text>
                <Text style={styles.pendingDesc}>
                  Your profile is being reviewed by an administrator. You cannot accept bookings until approved.
                </Text>
              </View>
            </View>
          )}

          {/* Online Status Toggle — backed by PUT /profiles/me?role=technician */}
          <View style={[styles.statusCard, online ? styles.onlineCard : styles.offlineCard]}>
            <View style={styles.statusInfo}>
              <Ionicons
                name={online ? 'radio-outline' : 'power-outline'}
                size={28}
                color={online ? Colors.success : Colors.inkMuted}
              />
              <View>
                <Text style={styles.statusTitle}>{online ? 'You are Online' : 'You are Offline'}</Text>
                <Text style={styles.statusDesc}>
                  {!profile?.is_approved
                    ? 'You must be approved by an admin to go online.'
                    : online
                    ? 'Visible to customers for service requests.'
                    : 'Toggle to go online and receive requests.'}
                </Text>
              </View>
            </View>
            <Switch
              value={online}
              onValueChange={handleToggleOnline}
              trackColor={{ false: Colors.divider, true: Colors.successSoft }}
              thumbColor={online ? Colors.success : Colors.inkMuted}
              disabled={togglingOnline || !profile?.is_approved}
            />
          </View>

          
          {/* Active Bookings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active & Incoming Jobs</Text>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={36} color={Colors.inkMuted} />
                <Text style={styles.emptyDesc}>No active requests. Stay online to receive jobs.</Text>
              </View>
            ) : (
              bookings.map((b) => (
                <View key={b.id} style={styles.jobCard}>
                  <Text style={styles.jobCategory}>{b.category} - {b.status.replace(/_/g, ' ')}</Text>
                  <Text style={styles.jobDesc}>{b.problem_description}</Text>
                  <Text style={styles.jobAddress}>
                    {['TECH_ACCEPTED', 'CUSTOMER_CONFIRMED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(b.status)
                      ? `${b.address_details.house_flat}, ${b.address_details.landmark !== 'Not specified' ? b.address_details.landmark + ', ' : ''}${b.address_details.city} - ${b.address_details.zip_code}`
                      : b.address_details.city}
                  </Text>

                  {b.status === 'BROADCASTING' && (
                    <View style={styles.actionRow}>
                       <RanzoButton label="Accept Job" onPress={() => handleAction('accept', b.id)} />
                    </View>
                  )}
                  {b.status === 'TECH_ACCEPTED' && (
                    <Text style={{color: Colors.warning, marginTop: Spacing.sm, fontWeight: '600'}}>Waiting for customer to confirm...</Text>
                  )}
                  {b.status === 'CUSTOMER_CONFIRMED' && (
                    <View style={styles.actionRow}>
                       <RanzoButton label="Start Journey" onPress={() => handleAction('transit', b.id)} />
                    </View>
                  )}
                  {b.status === 'IN_TRANSIT' && (
                    <View style={styles.otpActionWrap}>
                       <Text style={{fontWeight:'bold', marginBottom:4}}>Enter Customer's Start OTP:</Text>
                       <RanzoTextField value={otpInputs[b.id] || ''} onChangeText={(val) => updateOtp(b.id, val)} placeholder="4-digit OTP" keyboardType="numeric" />
                       <View style={{height: 8}}/>
                       <RanzoButton label="Start Job" onPress={() => handleAction('start', b.id)} />
                    </View>
                  )}
                  {b.status === 'IN_PROGRESS' && (
                    <View style={styles.otpActionWrap}>
                       <Text style={{fontWeight:'bold', marginBottom:4}}>Enter Customer's End OTP:</Text>
                       <RanzoTextField value={otpInputs[b.id] || ''} onChangeText={(val) => updateOtp(b.id, val)} placeholder="4-digit OTP" keyboardType="numeric" />
                       <View style={{height: 8}}/>
                       <RanzoButton label="Complete Job" onPress={() => handleAction('complete', b.id)} />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Registered Skills — from GET /profiles/me?role=technician */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Registered Skills</Text>
            {profile?.skills && profile.skills.length > 0 ? (
              <View style={styles.skillsList}>
                {profile.skills.map((skill) => (
                  <View key={skill} style={styles.skillItem}>
                    <Ionicons name="ribbon-outline" size={16} color={Colors.primary} />
                    <Text style={styles.skillText}>{formatSkill(skill)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="ribbon-outline" size={36} color={Colors.inkMuted} />
                <Text style={styles.emptyDesc}>No skills registered. Update your profile.</Text>
              </View>
            )}
          </View>

          {/* Wallet Escrow Navigation */}
          <Pressable style={styles.walletNavCard} onPress={() => router.push('/technician/wallet' as any)}>
            <View style={styles.walletNavContent}>
              <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.walletNavTitle}>Wallet & Escrow</Text>
                <Text style={styles.walletNavDesc}>Manage your balance to receive bookings</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.inkMuted} />
            </View>
          </Pressable>

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
  jobCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    gap: Spacing.xs,
    ...Elevation.card,
  },
  jobCategory: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  jobDesc: {
    fontSize: 14,
    color: Colors.inkBody,
  },
  jobAddress: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  actionRow: {
    marginTop: Spacing.md,
  },
  otpActionWrap: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  welcomeSub: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    ...Elevation.card,
  },
  onlineCard: {
    backgroundColor: Colors.successSoft,
    borderColor: Colors.success,
  },
  offlineCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderColor: Colors.divider,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd', // light warning background
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404', // warning text color
  },
  pendingDesc: {
    fontSize: 12,
    color: '#856404',
    marginTop: 2,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  statusDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
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
  profileDetailsCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 4,
  },
  detailText: {
    fontSize: 14,
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
    height: 100,
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
  editRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCanvas,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    resizeMode: 'cover',
  },
  walletNavCard: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    ...Elevation.card,
  },
  walletNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  walletNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.inkNavy,
  },
  walletNavDesc: {
    fontSize: 12,
    color: Colors.inkMuted,
    marginTop: 2,
  },
});
