/**
 * Card Component
 * 
 * A versatile card component with press animation.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
  BorderRadius,
  Spacing,
  Shadows,
  Animation,
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  pressable?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
  pressable = false,
  onPressIn,
  onPressOut,
  ...props
}: CardProps) {
  const { isDark, colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    if (pressable) {
      scale.value = withSpring(0.98, Animation.spring.stiff);
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (pressable) {
      scale.value = withSpring(1, Animation.spring.default);
    }
    onPressOut?.(e);
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          ...Shadows.base,
        };
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.backgroundSecondary,
        };
      default:
        return {};
    }
  };

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.sm;
      case 'lg':
        return Spacing.xl;
      default:
        return Spacing.base;
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.base,
    ...getVariantStyles(),
    padding: getPadding(),
    ...style,
  };

  if (pressable || props.onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
