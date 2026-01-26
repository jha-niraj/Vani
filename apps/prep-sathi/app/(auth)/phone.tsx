/**
 * Phone Input Screen
 * 
 * Collects user's phone number for OTP authentication.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { Screen, Header, Button, PhoneInput } from '@/components/ui';
import {
  Typography,
  Spacing,
} from '@/constants/theme';

export default function PhoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useAuthStore();
  const [phone, setPhone] = useState('');

  const isValidPhone = phone.length === 10 && /^9[78]\d{8}$/.test(phone);

  const handleContinue = async () => {
    if (!isValidPhone) return;
    
    const success = await sendOtp(phone);
    if (success) {
      router.push('/(auth)/otp');
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (error) clearError();
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
            Enter your phone number
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We will send you a verification code to confirm your identity
          </Text>
        </Animated.View>

        {/* Phone Input */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.inputContainer}
        >
          <PhoneInput
            value={phone}
            onChange={handlePhoneChange}
            error={error || undefined}
            autoFocus
          />
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.buttonContainer}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValidPhone}
            loading={isLoading}
            onPress={handleContinue}
          >
            Continue
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
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});
