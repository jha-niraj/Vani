/**
 * Welcome Screen
 * 
 * First screen users see. Introduces the app and prompts to continue.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Screen, Button } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
} from '@/constants/theme';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleContinue = () => {
    router.push('/(auth)/phone');
  };

  return (
    <Screen padding safeBottom>
      <View style={styles.container}>
        {/* Hero Section */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.hero}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>📚</Text>
          </View>
          
          <Animated.Text
            entering={FadeInUp.delay(400).duration(600)}
            style={[styles.title, { color: colors.text }]}
          >
            PrepSathi
          </Animated.Text>
          
          <Animated.Text
            entering={FadeInUp.delay(500).duration(600)}
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Your Loksewa Exam Companion
          </Animated.Text>
        </Animated.View>

        {/* Features */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.features}
        >
          <FeatureItem
            emoji="✓"
            title="Practice MCQs"
            description="Thousands of questions from past exams"
          />
          <FeatureItem
            emoji="📊"
            title="Track Progress"
            description="Monitor your improvement over time"
          />
          <FeatureItem
            emoji="🎯"
            title="Focus on Weak Areas"
            description="AI identifies topics you need to work on"
          />
        </Animated.View>

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.cta}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleContinue}
          >
            Get Started
          </Button>
          
          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

interface FeatureItemProps {
  emoji: string;
  title: string;
  description: string;
}

function FeatureItem({ emoji, title, description }: FeatureItemProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: `${Colors.brand.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  features: {
    paddingVertical: Spacing.xl,
    gap: Spacing.base,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.semantic.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  featureEmoji: {
    fontSize: 20,
    color: Colors.semantic.success,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  featureDescription: {
    ...Typography.bodySmall,
  },
  cta: {
    paddingTop: Spacing.xl,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
});
