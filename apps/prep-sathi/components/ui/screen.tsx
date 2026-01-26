/**
 * Screen Component
 * 
 * Base screen wrapper with safe area and common layout patterns.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Layout } from '@/constants/theme';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  safeTop?: boolean;
  safeBottom?: boolean;
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  padding = true,
  safeTop = true,
  safeBottom = true,
  keyboardAvoiding = false,
  style,
  contentStyle,
}: ScreenProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
    ...style,
  };

  const innerStyle: ViewStyle = {
    flex: 1,
    ...(padding && {
      paddingHorizontal: Spacing.base,
    }),
    ...contentStyle,
  };

  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        padding && { paddingHorizontal: Spacing.base },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={innerStyle}>{children}</View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={containerStyle}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {wrappedContent}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
});
