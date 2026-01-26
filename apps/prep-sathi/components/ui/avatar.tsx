/**
 * Avatar Component
 * 
 * User avatar with initials fallback.
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import {
  Typography,
  BorderRadius,
  Colors,
} from '@/constants/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function Avatar({
  source,
  name,
  size = 'md',
  style,
  imageStyle,
}: AvatarProps) {
  const { isDark, colors } = useTheme();

  const getSize = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 44;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      case 'xl':
        return 28;
      default:
        return 16;
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeValue = getSize();

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[
          styles.image,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
          },
          imageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: Colors.brand.primary,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: getFontSize() },
        ]}
      >
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
});
