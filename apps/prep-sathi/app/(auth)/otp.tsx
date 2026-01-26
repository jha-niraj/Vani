/**
 * OTP Verification Screen
 * 
 * Verifies the OTP sent to user's phone.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { Screen, Header, Button, OTPInput } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
} from '@/constants/theme';

const RESEND_DELAY = 30; // seconds

export default function OTPScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { 
    phoneNumber, 
    verifyOtp, 
    sendOtp, 
    isVerifying, 
    error, 
    clearError 
  } = useAuthStore();
  
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (error) clearError();
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    
    const result = await verifyOtp(otp);
    if (result.success) {
      if (result.isNewUser) {
        router.replace('/(onboarding)/username');
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(RESEND_DELAY);
    setOtp('');
    await sendOtp(phoneNumber);
  };

  // Format phone for display
  const formatPhone = (phone: string) => {
    return `+977 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  return (
    <Screen padding keyboardAvoiding>
      <Header showBack title="" transparent />
      
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Verification Code
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={[styles.phone, { color: colors.text }]}>
            {formatPhone(phoneNumber)}
          </Text>
        </Animated.View>

        {/* OTP Input */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.otpContainer}
        >
          <OTPInput
            value={otp}
            onChange={handleOtpChange}
            error={error || undefined}
            onComplete={handleVerify}
          />
        </Animated.View>

        {/* Resend */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.resendContainer}
        >
          {canResend ? (
            <Pressable onPress={handleResend}>
              <Text style={[styles.resendText, { color: Colors.brand.primary }]}>
                Resend Code
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.timerText, { color: colors.textSecondary }]}>
              Resend code in {resendTimer}s
            </Text>
          )}
        </Animated.View>

        {/* Verify Button */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.buttonContainer}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={otp.length !== 6}
            loading={isVerifying}
            onPress={handleVerify}
          >
            Verify
          </Button>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  phone: {
    ...Typography.bodyMedium,
    marginTop: Spacing.xs,
  },
  otpContainer: {
    marginBottom: Spacing.xl,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resendText: {
    ...Typography.bodyMedium,
  },
  timerText: {
    ...Typography.body,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});
