import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Elevation } from '@/core/theme';
import { RanzoAppBar, RanzoButton } from '@/core/widgets';
import {
  getWallet,
  getWalletTransactions,
  createRechargeOrder,
  verifyRecharge,
  Wallet,
  WalletTransaction,
} from '@/core/api/wallet';
import { useAuthStore } from '@/data/store';
import type { ApiError } from '@/core/api/client';

const TXN_ICON: Record<WalletTransaction['type'], { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  CREDIT: { name: 'arrow-down-circle', color: Colors.success },
  DEBIT: { name: 'arrow-up-circle', color: Colors.danger },
  REFUND: { name: 'refresh-circle', color: Colors.primary },
};

export default function TechnicianWallet() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);
  const [rechargeUnavailable, setRechargeUnavailable] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [walletData, txnData] = await Promise.all([getWallet(), getWalletTransactions()]);
      setWallet(walletData);
      setTransactions(txnData);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load wallet balance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRecharge = async (amount: number) => {
    setRecharging(true);
    try {
      const order = await createRechargeOrder(amount);

      // Native module — only resolvable once react-native-razorpay is linked
      // (npx pod-install / a dev-client rebuild after `npm install`).
      const RazorpayCheckout = require('react-native-razorpay').default;
      const options = {
        description: 'Ranzo Wallet Recharge',
        currency: order.currency,
        key: order.razorpay_key_id,
        amount: order.amount_paise,
        name: 'Ranzo',
        order_id: order.order_id,
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: { color: Colors.primary },
      };

      const checkoutData = await RazorpayCheckout.open(options);

      const result = await verifyRecharge({
        razorpay_order_id: checkoutData.razorpay_order_id,
        razorpay_payment_id: checkoutData.razorpay_payment_id,
        razorpay_signature: checkoutData.razorpay_signature,
      });
      setWallet(result.wallet);
      await fetchAll();
      Alert.alert('Success', `Added ₹${amount} to your wallet!`);
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 503) {
        setRechargeUnavailable(true);
        Alert.alert(
          'Recharge unavailable',
          "Wallet recharge isn't available yet — check back soon."
        );
      } else if (err?.code === 0 || /cancel/i.test(err?.description || err?.message || '')) {
        // User closed the Razorpay Checkout sheet — not an error worth surfacing loudly.
      } else if (err?.message?.includes("Cannot find module")) {
        Alert.alert(
          'Recharge unavailable',
          'Payment module is not installed in this build. Rebuild the app after installing react-native-razorpay.'
        );
      } else {
        Alert.alert('Recharge Failed', err?.message || err?.description || 'Something went wrong.');
      }
    } finally {
      setRecharging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="Wallet & Escrow" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

          {rechargeUnavailable && (
            <View style={styles.unavailableBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.inkMuted} />
              <Text style={styles.unavailableText}>
                Wallet recharge isn't available yet — check back soon.
              </Text>
            </View>
          )}

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

          <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyTxn}>
              <Text style={styles.emptyTxnText}>No transactions yet.</Text>
            </View>
          ) : (
            transactions.slice(0, 20).map((txn) => {
              const meta = TXN_ICON[txn.type] || TXN_ICON.DEBIT;
              const sign = txn.type === 'DEBIT' ? '-' : '+';
              return (
                <View key={txn._id} style={styles.txnRow}>
                  <Ionicons name={meta.name} size={26} color={meta.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txnDesc} numberOfLines={2}>{txn.description}</Text>
                    <Text style={styles.txnDate}>{new Date(txn.created_at).toLocaleString()}</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: meta.color }]}>
                    {sign}₹{txn.amount}
                  </Text>
                </View>
              );
            })
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.inkMuted} />
            <Text style={styles.infoText}>
              Platform Fee: A fixed amount of ₹50 is deducted automatically ONLY upon the successful completion of a service using the End OTP.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: Spacing.xl, flexGrow: 1 },
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
  unavailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  unavailableText: { flex: 1, fontSize: 13, color: Colors.inkMuted, fontWeight: '600' },
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
  emptyTxn: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.md,
  },
  emptyTxnText: { color: Colors.inkMuted, fontSize: 13 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  txnDesc: { fontSize: 14, fontWeight: '600', color: Colors.inkNavy },
  txnDate: { fontSize: 12, color: Colors.inkMuted, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800' },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.inkMuted, lineHeight: 18 },
});
