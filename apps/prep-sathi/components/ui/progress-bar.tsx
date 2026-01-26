/**
 * Progress Bar Component
 * 
 * Animated progress bar for quizzes and progress tracking.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
  BorderRadius,
  Animation,
  Colors,
} from '@/constants/theme';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color,
  backgroundColor,
  animated = true,
  style,
}: ProgressBarProps) {
  const { isDark, colors } = useTheme();
  const progressAnim = useSharedValue(0);

  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      progressAnim.value = withSpring(clampedProgress, {
        ...Animation.spring.default,
        overshootClamping: true,
      });
    } else {
      progressAnim.value = clampedProgress;
    }
  }, [clampedProgress, animated, progressAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progressAnim.value,
      [0, 100],
      [0, 100],
      Extrapolation.CLAMP
    );
    return {
      width: `${width}%`,
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: backgroundColor || (isDark ? colors.backgroundTertiary : colors.backgroundTertiary),
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color || Colors.brand.primary,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
