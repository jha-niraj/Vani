/**
 * Phone Input Component
 * 
 * Block-style phone number input with +977 country code prefix.
 * Features smooth animations and proper validation.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
  Typography,
  FontSizes,
  BorderRadius,
  Layout,
  Spacing,
  Animation,
  Colors,
  Shadows,
} from '@/constants/theme';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  error,
  placeholder = '98XXXXXXXX',
  autoFocus = false,
  disabled = false,
}: PhoneInputProps) {
  const { isDark, colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: Animation.duration.fast });
    scale.value = withSpring(1.01, Animation.spring.gentle);
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: Animation.duration.fast });
    scale.value = withSpring(1, Animation.spring.default);
  };

  const handleChange = (text: string) => {
    // Only allow digits, max 10 characters
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? Colors.semantic.error : colors.inputBorder, Colors.brand.primary]
    );
    return {
      borderColor,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
          },
          animatedContainerStyle,
          isFocused && Shadows.sm,
        ]}
      >
        {/* Country Code Block */}
        <View
          style={[
            styles.countryCode,
            {
              backgroundColor: isDark 
                ? Colors.dark.backgroundTertiary 
                : Colors.light.backgroundTertiary,
              borderRightColor: isFocused 
                ? Colors.brand.primary 
                : error 
                ? Colors.semantic.error 
                : colors.inputBorder,
            },
          ]}
        >
          <Text style={[styles.flag]}>🇳🇵</Text>
          <Text style={[styles.code, { color: colors.text }]}>+977</Text>
        </View>

        {/* Phone Number Input */}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="phone-pad"
          maxLength={10}
          autoFocus={autoFocus}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>

      {error && <Text style={styles.error}>{error}</Text>}
      
      {!error && (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Enter your 10-digit mobile number
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.height.input + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: Spacing.md,
    borderRightWidth: 2,
    gap: Spacing.xs,
  },
  flag: {
    fontSize: FontSizes.xl,
  },
  code: {
    ...Typography.bodyMedium,
    fontSize: FontSizes.lg,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.base,
    ...Typography.body,
    fontSize: FontSizes.lg,
    letterSpacing: 1,
  },
  error: {
    ...Typography.caption,
    color: Colors.semantic.error,
    marginTop: Spacing.sm,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
});
