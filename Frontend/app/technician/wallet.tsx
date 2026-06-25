import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import { getWallet, rechargeWallet, Wallet } from '@/core/api/wallet';

export default function TechnicianWallet() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await getWallet();
      setWallet(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load wallet balance.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (amount: number) => {
    setRecharging(true);
    try {
      const response = await rechargeWallet(amount);
      setWallet(response.wallet);
      Alert.alert('Success', `Added ₹${amount} to your wallet!`);
    } catch (err: any) {
      Alert.alert('Recharge Failed', err?.message || 'Something went wrong.');
    } finally {
      setRecharging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Wallet & Escrow" showBack onBack={() => router.back()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          {/* Balance Card */}
          <View style={[styles.balanceCard, (wallet?.balance || 0) < 50 ? styles.balanceLow : {}]}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹ {wallet?.balance?.toFixed(2) || '0.00'}</Text>
            {(wallet?.balance || 0) < 50 && (
              <View style={styles.alertBox}>
                <Ionicons name="warning-outline" size={20} color={Colors.danger} />
                <Text style={styles.alertText}>
                  Your balance is below ₹50. You cannot accept new bookings until you recharge.
                </Text>
              </View>
            )}
          </View>

          {/* Quick Recharge Options */}
          <Text style={styles.sectionTitle}>Quick Recharge</Text>
          <View style={styles.rechargeRow}>
            {[100, 500, 1000].map((amount) => (
              <Pressable 
                key={amount} 
                style={styles.rechargeBtn}
                onPress={() => handleRecharge(amount)}
                disabled={recharging}
              >
                <Text style={styles.rechargeBtnText}>₹ {amount}</Text>
              </Pressable>
            ))}
          </View>

          {recharging && <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />}
          
          <View style={{ flex: 1 }} />

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.inkMuted} />
            <Text style={styles.infoText}>
              Platform Fee: A fixed amount of ₹50 is deducted automatically ONLY upon the successful completion of a service using the End OTP.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: Spacing.xl, flex: 1 },
  balanceCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Elevation.card,
  },
  balanceLow: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  balanceLabel: { fontSize: 16, color: Colors.inkMuted, marginBottom: Spacing.sm },
  balanceValue: { fontSize: 42, fontWeight: '800', color: Colors.inkNavy },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWhite,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  alertText: { flex: 1, fontSize: 12, color: Colors.danger, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.inkNavy, marginBottom: Spacing.md },
  rechargeRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'space-between' },
  rechargeBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceCanvas,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  rechargeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.inkMuted, lineHeight: 18 },
});
