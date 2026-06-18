import React, { useState, useEffect } from 'react';
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
import { checkPhone, sendOtp, verifyOtp, register } from '@/core/api/auth';
import { getUserMe } from '@/core/api/users';
import { useAuthStore } from '@/data/store';

export default function RegisterScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const setUser = useAuthStore((s) => s.setUser);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // OTP Verification Flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Status & Errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Validators
  const nameValid = name.trim().length >= 3 && name.trim().length <= 30;
  const phoneValid = phone.trim().length === 10 && /^\d+$/.test(phone);

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/`~\\]/.test(password);
  const hasLength = password.length >= 8;
  const passwordValid = hasUpper && hasLower && hasDigit && hasSpecial && hasLength;

  const canRegister = nameValid && phoneVerified && passwordValid;

  const handleVerifyPhone = async () => {
    if (!phoneValid) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      // Step 1: Check if phone already registered
      const checkRes = await checkPhone(phone);
      if (checkRes.exists) {
        setError('This phone number is already registered.');
        setLoading(false);
        return;
      }

      // Step 2: Send OTP
      await sendOtp(phone, 'register');
      setOtpSent(true);
      setInfo('Verification OTP sent successfully! Check your console/messages.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification OTP.');
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
      await verifyOtp(phone, otpCode, 'register');
      setPhoneVerified(true);
      setOtpSent(false);
      setInfo('Phone number verified successfully!');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!canRegister) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const tokenRes = await register(name, phone, password);
      await signIn(tokenRes.access_token);
      const userSummary = await getUserMe();
      await setUser(userSummary);
      router.replace('/home' as any);
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register as a user to access jobs & services.</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {info && <Text style={styles.infoText}>{info}</Text>}

          <View style={styles.form}>
            <RanzoTextField
              label="Full Name"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              placeholder="e.g. John Doe"
              helper="Name must be between 3 and 30 characters"
            />

            <View style={styles.phoneSection}>
              <View style={styles.phoneInputWrap}>
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
              </View>
              {!phoneVerified && !otpSent && (
                <Pressable
                  style={[styles.verifyButton, !phoneValid && styles.disabledButton]}
                  onPress={handleVerifyPhone}
                  disabled={!phoneValid || loading}
                >
                  <Text style={styles.verifyBtnText}>Verify</Text>
                </Pressable>
              )}
            </View>

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
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.verifiedText}>Phone number verified</Text>
              </View>
            )}

            <RanzoTextField
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              secureTextEntry
              placeholder="Create strong password"
            />

            {/* Password Validation Hints */}
            <View style={styles.hintsGrid}>
              <Text style={styles.hintsTitle}>Password Strength Requirements:</Text>
              <ValidationHint label="At least 8 characters" checked={hasLength} />
              <ValidationHint label="One uppercase letter (A-Z)" checked={hasUpper} />
              <ValidationHint label="One lowercase letter (a-z)" checked={hasLower} />
              <ValidationHint label="One number (0-9)" checked={hasDigit} />
              <ValidationHint label="One special character (!@#...)" checked={hasSpecial} />
            </View>
          </View>

          <View style={styles.actionWrap}>
            <RanzoButton
              label="Register"
              onPress={handleRegister}
              disabled={!canRegister}
              loading={loading}
            />
          </View>

          <Pressable
            onPress={() => router.push('/auth/login' as any)}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already registered? <Text style={styles.loginHighlight}>Log in</Text>
            </Text>
          </Pressable>
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
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  phoneInputWrap: {
    flex: 1,
  },
  verifyButton: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, // alignment adjustment for field error/helper row
  },
  disabledButton: {
    backgroundColor: Colors.divider,
  },
  verifyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
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
  loginLink: {
    marginTop: Spacing.xl,
    alignSelf: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.inkBody,
  },
  loginHighlight: {
    color: Colors.primary,
    fontWeight: '700',
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
