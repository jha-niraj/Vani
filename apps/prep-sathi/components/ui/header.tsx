/**
 * Header Component
 * 
 * App header with back button, title, and actions.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
  Typography,
  Spacing,
  Layout,
  Animation,
  IconSizes,
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  transparent = false,
  style,
}: HeaderProps) {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const backScale = useSharedValue(1);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: transparent ? 'transparent' : colors.divider,
        },
        style,
      ]}
    >
      {/* Left side */}
      <View style={styles.left}>
        {showBack && (
          <AnimatedPressable
            onPress={handleBack}
            onPressIn={() => {
              backScale.value = withSpring(0.9, Animation.spring.stiff);
            }}
            onPressOut={() => {
              backScale.value = withSpring(1, Animation.spring.default);
            }}
            style={[styles.backButton, backAnimatedStyle]}
            hitSlop={8}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </AnimatedPressable>
        )}
        {leftAction}
      </View>

      {/* Center - Title */}
      <View style={styles.center}>
        {title && (
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side */}
      <View style={styles.right}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.height.header,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  backIcon: {
    fontSize: IconSizes.lg,
    fontWeight: '500',
  },
  title: {
    ...Typography.h5,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
});
