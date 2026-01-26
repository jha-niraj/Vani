/**
 * Badge Component
 * 
 * Small badge for labels, counts, and status indicators.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import {
  Typography,
  BorderRadius,
  Spacing,
  Colors,
} from '@/constants/theme';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  outline?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  outline = false,
  style,
  textStyle,
  onPress,
}: BadgeProps) {
  const { colors } = useTheme();

  const getVariantColors = (): { background: string; text: string; border: string } => {
    switch (variant) {
      case 'primary':
        return {
          background: outline ? 'transparent' : `${Colors.brand.primary}20`,
          text: Colors.brand.primary,
          border: Colors.brand.primary,
        };
      case 'success':
        return {
          background: outline ? 'transparent' : `${Colors.semantic.success}20`,
          text: Colors.semantic.success,
          border: Colors.semantic.success,
        };
      case 'warning':
        return {
          background: outline ? 'transparent' : `${Colors.semantic.warning}20`,
          text: Colors.semantic.warningDark,
          border: Colors.semantic.warning,
        };
      case 'error':
        return {
          background: outline ? 'transparent' : `${Colors.semantic.error}20`,
          text: Colors.semantic.error,
          border: Colors.semantic.error,
        };
      case 'info':
        return {
          background: outline ? 'transparent' : `${Colors.semantic.info}20`,
          text: Colors.semantic.info,
          border: Colors.semantic.info,
        };
      default:
        return {
          background: outline ? 'transparent' : colors.backgroundTertiary,
          text: colors.textSecondary,
          border: colors.border,
        };
    }
  };

  const variantColors = getVariantColors();

  const sizeStyles = size === 'sm' 
    ? { paddingHorizontal: Spacing.xs, paddingVertical: 2 }
    : { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs };

  const content = (
    <Text
      style={[
        size === 'sm' ? styles.textSm : styles.text,
        { color: variantColors.text },
        textStyle,
      ]}
    >
      {children}
    </Text>
  );

  const containerStyles = [
    styles.container,
    sizeStyles,
    {
      backgroundColor: variantColors.background,
      borderColor: variantColors.border,
      borderWidth: outline ? 1 : 0,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={containerStyles}>
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
    fontWeight: '600',
  },
});
