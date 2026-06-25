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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/core/theme';
import { RanzoAppBar, RanzoButton, RanzoTextField } from '@/core/widgets';
import { login, loginOtp, sendOtp } from '@/core/api/auth';
import { getUserMe } from '@/core/api/users';
import { useAuthStore } from '@/data/store';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetRole = params.targetRole as string | undefined;
  const returnUrl = params.returnUrl as string | undefined;
  const signIn = useAuthStore((s) => s.signIn);
  const setUser = useAuthStore((s) => s.setUser);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const phoneValid = phone.trim().length === 10 && /^\d+$/.test(phone);

  const handleSendOtp = async () => {
    if (!phoneValid) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendOtp(phone, 'login');
      setOtpSent(true);
      setInfo('OTP sent successfully. Check your console/messages.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Is your number registered?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setInfo(null);
    if (!phoneValid) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      let tokenRes;
      if (useOtp) {
        if (otpCode.length !== 6) {
          setError('Please enter a 6-digit OTP');
          setLoading(false);
          return;
        }
        tokenRes = await loginOtp(phone, otpCode);
      } else {
        if (password.length === 0) {
          setError('Please enter your password');
          setLoading(false);
          return;
        }
        tokenRes = await login(phone, password);
      }

      await signIn(tokenRes.access_token);
      const userSummary = await getUserMe();
      await setUser(userSummary);
      
      if (returnUrl) {
        router.replace(returnUrl as any);
      } else if (targetRole) {
        const isCompleted = userSummary?.registered_roles?.includes(targetRole);
        if (isCompleted) {
          if (targetRole === 'customer') {
            router.replace('/customer/(tabs)' as any);
          } else {
            router.replace(`/${targetRole}/dashboard` as any);
          }
        } else {
          router.replace(`/profile-setup?role=${targetRole}` as any);
        }
      } else {
        router.replace('/home' as any);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {useOtp ? 'Sign in using a verification code.' : 'Sign in using your password.'}
            </Text>
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
                setError(null);
              }}
              keyboardType="number-pad"
              placeholder="98765 43210"
              editable={!otpSent}
            />

            {!useOtp ? (
              <RanzoTextField
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError(null);
                }}
                secureTextEntry
                placeholder="Enter password"
              />
            ) : (
              otpSent && (
                <RanzoTextField
                  label="OTP Verification Code"
                  value={otpCode}
                  onChangeText={(t) => {
                    setOtpCode(t.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  keyboardType="number-pad"
                  placeholder="Enter 6-digit OTP"
                />
              )
            )}
          </View>

          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => {
                setUseOtp(!useOtp);
                setOtpSent(false);
                setOtpCode('');
                setError(null);
                setInfo(null);
              }}
            >
              <Text style={styles.toggleText}>
                {useOtp ? 'Use Password Login instead' : 'Use OTP Login instead'}
              </Text>
            </Pressable>

            {!useOtp && (
              <Pressable onPress={() => router.push('/auth/forgot-password' as any)}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.actionWrap}>
            {useOtp && !otpSent ? (
              <RanzoButton
                label="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
                disabled={!phoneValid}
              />
            ) : (
              <RanzoButton
                label="Log In"
                onPress={handleLogin}
                loading={loading}
              />
            )}
          </View>

          <Pressable
            onPress={() => {
              const baseParams = targetRole ? `targetRole=${targetRole}` : '';
              const retParams = returnUrl ? `returnUrl=${encodeURIComponent(returnUrl)}` : '';
              const qString = [baseParams, retParams].filter(Boolean).join('&');
              router.push((qString ? `/auth/register?${qString}` : '/auth/register') as any);
            }}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              New here? <Text style={styles.registerHighlight}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 14,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  actionWrap: {
    marginTop: Spacing.md,
  },
  registerLink: {
    marginTop: Spacing.xxl,
    alignSelf: 'center',
  },
  registerText: {
    fontSize: 14,
    color: Colors.inkBody,
  },
  registerHighlight: {
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
