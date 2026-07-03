import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoButton, RanzoTextField, StarRating } from '@/core/widgets';
import { getHistoryBookings, Booking } from '@/core/api/bookings';
import { createReview, raiseDispute } from '@/core/api/reviews';
import { wsUrl } from '@/core/config/api';

import { useAuthStore } from '@/data/store';

export default function HistoryScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);
  const [notification, setNotification] = useState<string | null>(null);

  const [rateTarget, setRateTarget] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingReview, setRatingReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const [disputeTarget, setDisputeTarget] = useState<Booking | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchHistory = async () => {
    try {
      const data = await getHistoryBookings('customer');
      setBookings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const ws = new WebSocket(`${wsUrl('/api/v1/bookings/ws')}?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const data = payload.data || {};

        if (payload.event === 'booking_updated') {
          if (['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_TECH', 'PENDING_RATING', 'DISPUTED'].includes(data.status)) {
            setNotification(`Booking ${data.status}!`);
            setBookings(prev => {
              if (prev.find(b => b.id === data.id)) return prev.map(b => b.id === data.id ? data : b);
              return [data, ...prev];
            });
            setTimeout(() => setNotification(null), 5000);
          }
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const openRateModal = (b: Booking) => {
    setRatingValue(0);
    setRatingReview('');
    setRateTarget(b);
  };

  const submitRating = async () => {
    if (!rateTarget) return;
    if (ratingValue < 1) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    setSubmittingRating(true);
    try {
      await createReview('customer', {
        booking_id: rateTarget.id,
        rating: ratingValue,
        review: ratingReview.trim() || null,
      });
      setRateTarget(null);
      Alert.alert('Thanks!', 'Your rating has been submitted.');
      await fetchHistory();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const openDisputeModal = (b: Booking) => {
    setDisputeReason('');
    setDisputeTarget(b);
  };

  const submitDispute = async () => {
    if (!disputeTarget) return;
    if (!disputeReason.trim()) {
      Alert.alert('Reason required', 'Please describe the issue.');
      return;
    }
    setSubmittingDispute(true);
    try {
      await raiseDispute(disputeTarget.id, { reason: disputeReason.trim() });
      setDisputeTarget(null);
      Alert.alert('Dispute raised', 'Our team will review this booking.');
      await fetchHistory();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not raise dispute.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: Colors.danger }}>{error}</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {notification && (
            <View style={{ backgroundColor: Colors.primary, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ color: Colors.white, fontWeight: '600' }}>{notification}</Text>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Booking History</Text>
          {bookings.length === 0 ? (
            <Text style={{ color: Colors.inkMuted }}>No history found.</Text>
          ) : (
            bookings.map((b) => (
              <View key={b.id} style={styles.card}>
                <Text style={styles.cardTitle}>{b.category} - {b.status}</Text>
                <Text style={styles.cardSub}>{new Date(b.created_at).toLocaleString()}</Text>
                <Text style={styles.cardSub}>Technician: {b.technician_id || 'None'}</Text>

                {b.status === 'PENDING_RATING' && (
                  <View style={styles.actionRow}>
                    <RanzoButton
                      label="Approve & Rate"
                      onPress={() => openRateModal(b)}
                      style={{ flex: 1 }}
                    />
                    <RanzoButton
                      label="Dispute"
                      variant="danger"
                      onPress={() => openDisputeModal(b)}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
                {b.status === 'DISPUTED' && (
                  <Text style={styles.disputedText}>Dispute submitted — our team is reviewing this booking.</Text>
                )}
              </View>
            ))
          )}
          </ScrollView>
        </View>
      )}

      {/* Approve + rate modal */}
      <Modal visible={!!rateTarget} transparent animationType="fade" onRequestClose={() => setRateTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate this service</Text>
            <StarRating value={ratingValue} onChange={setRatingValue} />
            <RanzoTextField
              label="Written review (optional)"
              value={ratingReview}
              onChangeText={setRatingReview}
              placeholder="How was the technician's work?"
              multiline
            />
            <View style={styles.modalActions}>
              <RanzoButton label="Cancel" variant="secondary" onPress={() => setRateTarget(null)} style={{ flex: 1 }} />
              <RanzoButton
                label={submittingRating ? 'Submitting...' : 'Submit'}
                onPress={submitRating}
                disabled={submittingRating}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispute reason modal */}
      <Modal visible={!!disputeTarget} transparent animationType="fade" onRequestClose={() => setDisputeTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Raise a dispute</Text>
            <RanzoTextField
              label="Reason *"
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Describe what went wrong"
              multiline
            />
            <View style={styles.modalActions}>
              <RanzoButton label="Cancel" variant="secondary" onPress={() => setDisputeTarget(null)} style={{ flex: 1 }} />
              <RanzoButton
                label={submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                variant="danger"
                onPress={submitDispute}
                disabled={submittingDispute}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: Spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: Colors.inkMuted, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  disputedText: { fontSize: 13, color: Colors.warning, fontWeight: '600', marginTop: Spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.inkNavy, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
});
