import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoTextField } from '@/core/widgets';
import { sendOtp, verifyOtp, resetPassword } from '@/core/api/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const phoneValid = phone.trim().length === 10 && /^\d+$/.test(phone);

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/`~\\]/.test(newPassword);
  const hasLength = newPassword.length >= 8;
  const passwordValid = hasUpper && hasLower && hasDigit && hasSpecial && hasLength;

  const handleSendOtp = async () => {
    if (!phoneValid) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await sendOtp(phone, 'forgot_password');
      setOtpSent(true);
      setInfo('Password reset OTP sent successfully! Check your console/messages.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset OTP. Is this number registered?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await verifyOtp(phone, otpCode, 'forgot_password');
      setPhoneVerified(true);
      setOtpSent(false);
      setInfo('Phone verified! Please set your new password.');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!phoneVerified) return;
    if (!passwordValid) {
      setError('Password does not meet all criteria.');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await resetPassword(phone, newPassword);
      setInfo('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RanzoAppBar title="" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Verify your phone number to set a new password.</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {info && <Text style={styles.infoText}>{info}</Text>}

          <View style={styles.form}>
            <RanzoTextField
              label="Phone Number"
              prefix="+91"
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, '').slice(0, 10));
                setPhoneVerified(false);
                setOtpSent(false);
                setError(null);
              }}
              keyboardType="number-pad"
              placeholder="98765 43210"
              editable={!phoneVerified}
            />

            {otpSent && !phoneVerified && (
              <View style={styles.otpSection}>
                <RanzoTextField
                  label="Enter 6-Digit OTP"
                  value={otpCode}
                  onChangeText={(t) => {
                    setOtpCode(t.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  keyboardType="number-pad"
                  placeholder="e.g. 123456"
                />
                <RanzoButton
                  label="Confirm OTP"
                  onPress={handleVerifyOtp}
                  loading={loading}
                />
              </View>
            )}

            {phoneVerified && (
              <View style={styles.form}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.verifiedText}>Phone verified</Text>
                </View>

                <RanzoTextField
                  label="New Password"
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    setError(null);
                  }}
                  secureTextEntry
                  placeholder="Enter new password"
                />

                <View style={styles.hintsGrid}>
                  <Text style={styles.hintsTitle}>New Password Strength Requirements:</Text>
                  <ValidationHint label="At least 8 characters" checked={hasLength} />
                  <ValidationHint label="One uppercase letter (A-Z)" checked={hasUpper} />
                  <ValidationHint label="One lowercase letter (a-z)" checked={hasLower} />
                  <ValidationHint label="One number (0-9)" checked={hasDigit} />
                  <ValidationHint label="One special character (!@#...)" checked={hasSpecial} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.actionWrap}>
            {!otpSent && !phoneVerified && (
              <RanzoButton
                label="Send OTP"
                onPress={handleSendOtp}
                disabled={!phoneValid}
                loading={loading}
              />
            )}

            {phoneVerified && (
              <RanzoButton
                label="Reset Password"
                onPress={handleResetPassword}
                disabled={!passwordValid}
                loading={loading}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ValidationHint({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={styles.hintRow}>
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={checked ? Colors.success : Colors.inkMuted}
      />
      <Text style={[styles.hintText, checked && styles.hintChecked]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceWhite,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.inkMuted,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.lg,
  },
  otpSection: {
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successSoft,
    padding: Spacing.md,
    borderRadius: 8,
  },
  verifiedText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  hintsGrid: {
    backgroundColor: Colors.surfaceCanvas,
    padding: Spacing.md,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  hintsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkBody,
    marginBottom: Spacing.xs,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hintText: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  hintChecked: {
    color: Colors.success,
    fontWeight: '600',
  },
  actionWrap: {
    marginTop: Spacing.xl,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  infoText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: Colors.successSoft,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
});
