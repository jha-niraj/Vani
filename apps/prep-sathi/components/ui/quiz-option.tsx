/**
 * Quiz Option Component
 * 
 * Animated option button for quiz questions.
 * Shows selection state and correct/incorrect feedback.
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
  Typography,
  BorderRadius,
  Spacing,
  Animation,
  Colors,
  Shadows,
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

export interface QuizOptionProps {
  label: string; // A, B, C, D
  text: string;
  state?: OptionState;
  disabled?: boolean;
  onPress?: () => void;
}

export function QuizOption({
  label,
  text,
  state = 'default',
  disabled = false,
  onPress,
}: QuizOptionProps) {
  const { isDark, colors } = useTheme();
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);

  const getStateStyles = () => {
    switch (state) {
      case 'selected':
        return {
          background: `${Colors.brand.primary}15`,
          border: Colors.brand.primary,
          labelBg: Colors.brand.primary,
          labelText: Colors.neutral.white,
          text: colors.text,
        };
      case 'correct':
        return {
          background: `${Colors.semantic.success}15`,
          border: Colors.semantic.success,
          labelBg: Colors.semantic.success,
          labelText: Colors.neutral.white,
          text: colors.text,
        };
      case 'incorrect':
        return {
          background: `${Colors.semantic.error}15`,
          border: Colors.semantic.error,
          labelBg: Colors.semantic.error,
          labelText: Colors.neutral.white,
          text: colors.text,
        };
      default:
        return {
          background: colors.card,
          border: colors.border,
          labelBg: colors.backgroundTertiary,
          labelText: colors.textSecondary,
          text: colors.text,
        };
    }
  };

  const stateStyles = getStateStyles();

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98, Animation.spring.stiff);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, Animation.spring.default);
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      // Bounce animation on press
      scale.value = withSequence(
        withSpring(0.95, { damping: 10, stiffness: 400 }),
        withSpring(1, Animation.spring.default)
      );
      onPress();
    }
  };

  // Shake animation when incorrect
  React.useEffect(() => {
    if (state === 'incorrect') {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shake.value },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        {
          backgroundColor: stateStyles.background,
          borderColor: stateStyles.border,
        },
        state !== 'default' && Shadows.sm,
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.label,
          { backgroundColor: stateStyles.labelBg },
        ]}
      >
        <Text style={[styles.labelText, { color: stateStyles.labelText }]}>
          {label}
        </Text>
      </View>
      
      <Text
        style={[
          styles.text,
          { color: stateStyles.text },
        ]}
        numberOfLines={3}
      >
        {text}
      </Text>
      
      {state === 'correct' && (
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✓</Text>
        </View>
      )}
      
      {state === 'incorrect' && (
        <View style={[styles.iconContainer, styles.iconError]}>
          <Text style={styles.icon}>✗</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  label: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  labelText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    ...Typography.body,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  iconError: {
    backgroundColor: Colors.semantic.error,
  },
  icon: {
    color: Colors.neutral.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
