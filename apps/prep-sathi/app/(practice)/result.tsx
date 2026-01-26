/**
 * Quiz Result Screen
 * 
 * Shows quiz results with score breakdown and performance analysis.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Screen, Button, Card, ProgressBar } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
  BorderRadius,
} from '@/constants/theme';

export default function ResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId?: string;
    total?: string;
    correct?: string;
    wrong?: string;
    skipped?: string;
  }>();

  const total = parseInt(params.total || '0', 10);
  const correct = parseInt(params.correct || '0', 10);
  const wrong = parseInt(params.wrong || '0', 10);
  const skipped = parseInt(params.skipped || '0', 10);
  
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= 50;

  // Animation values
  const scoreProgress = useSharedValue(0);
  const circleProgress = useSharedValue(0);

  useEffect(() => {
    scoreProgress.value = withDelay(300, withSpring(score, { damping: 15 }));
    circleProgress.value = withDelay(300, withTiming(score / 100, { duration: 1000 }));
  }, [score]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scoreProgress.value, [0, score], [0, 1], Extrapolation.CLAMP),
  }));

  const getGrade = () => {
    if (score >= 90) return { grade: 'A+', color: Colors.semantic.success, message: 'Excellent! Outstanding performance!' };
    if (score >= 80) return { grade: 'A', color: Colors.semantic.success, message: 'Great job! Keep it up!' };
    if (score >= 70) return { grade: 'B+', color: Colors.brand.primary, message: 'Good work! Almost there!' };
    if (score >= 60) return { grade: 'B', color: Colors.brand.primary, message: 'Nice effort! Keep practicing!' };
    if (score >= 50) return { grade: 'C', color: Colors.semantic.warning, message: 'You passed! Room for improvement.' };
    return { grade: 'F', color: Colors.semantic.error, message: 'Keep practicing! You can do better.' };
  };

  const gradeInfo = getGrade();

  const handleRetry = () => {
    router.replace('/(tabs)' as const);
  };

  const handleHome = () => {
    router.replace('/(tabs)' as const);
  };

  const handleReviewAnswers = () => {
    // Navigate to answer review
    // router.push({ pathname: '/(practice)/review', params: { sessionId: params.sessionId } });
    // For now, go back to home
    router.replace('/(tabs)' as const);
  };

  return (
    <Screen safeTop padding>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Score Circle */}
        <Animated.View
          entering={FadeIn.delay(200).duration(500)}
          style={styles.scoreSection}
        >
          <View style={[styles.scoreCircle, { borderColor: gradeInfo.color }]}>
            <Animated.Text
              style={[styles.scoreText, { color: gradeInfo.color }, animatedScoreStyle]}
            >
              {score}%
            </Animated.Text>
            <Text style={[styles.gradeText, { color: gradeInfo.color }]}>
              Grade: {gradeInfo.grade}
            </Text>
          </View>
          
          <Text style={[styles.resultMessage, { color: colors.text }]}>
            {gradeInfo.message}
          </Text>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.statsContainer}
        >
          <Card variant="outlined" style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.semantic.success + '20' }]}>
              <Text style={styles.statEmoji}>✓</Text>
            </View>
            <Text style={[styles.statValue, { color: Colors.semantic.success }]}>
              {correct}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Correct
            </Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.semantic.error + '20' }]}>
              <Text style={styles.statEmoji}>✗</Text>
            </View>
            <Text style={[styles.statValue, { color: Colors.semantic.error }]}>
              {wrong}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Wrong
            </Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.semantic.warning + '20' }]}>
              <Text style={styles.statEmoji}>−</Text>
            </View>
            <Text style={[styles.statValue, { color: Colors.semantic.warning }]}>
              {skipped}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Skipped
            </Text>
          </Card>
        </Animated.View>

        {/* Progress Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
        >
          <Card variant="filled" style={styles.breakdownCard}>
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              Performance Breakdown
            </Text>
            
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Accuracy
              </Text>
              <View style={styles.breakdownProgress}>
                <ProgressBar progress={score} height={8} />
              </View>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {score}%
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                Completion
              </Text>
              <View style={styles.breakdownProgress}>
                <ProgressBar 
                  progress={((correct + wrong) / total) * 100} 
                  height={8}
                  color={Colors.brand.secondary}
                />
              </View>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {Math.round(((correct + wrong) / total) * 100)}%
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Encouragement */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(400)}
          style={styles.tipSection}
        >
          <Text style={[styles.tipTitle, { color: colors.text }]}>
            💡 Tip
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {passed 
              ? 'Great job! Try harder topics to challenge yourself and improve further.'
              : 'Practice makes perfect! Focus on the topics where you made mistakes and try again.'
            }
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeIn.delay(1000).duration(400)}
        style={styles.footer}
      >
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            size="lg"
            style={styles.footerButton}
            onPress={handleReviewAnswers}
          >
            Review Answers
          </Button>
          <Button
            variant="primary"
            size="lg"
            style={styles.footerButton}
            onPress={handleRetry}
          >
            Practice Again
          </Button>
        </View>
        
        <Button
          variant="ghost"
          onPress={handleHome}
          style={styles.homeButton}
        >
          Back to Home
        </Button>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  scoreSection: {
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreText: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  gradeText: {
    ...Typography.bodyMedium,
  },
  resultMessage: {
    ...Typography.h4,
    textAlign: 'center',
    maxWidth: 280,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statEmoji: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statValue: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
  },
  breakdownCard: {
    marginBottom: Spacing.lg,
  },
  breakdownTitle: {
    ...Typography.h5,
    marginBottom: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  breakdownLabel: {
    ...Typography.body,
    width: 90,
  },
  breakdownProgress: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  breakdownValue: {
    ...Typography.bodyMedium,
    width: 50,
    textAlign: 'right',
  },
  tipSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.brand.primary + '10',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tipTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.sm,
  },
  tipText: {
    ...Typography.body,
    lineHeight: 22,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  homeButton: {
    alignSelf: 'center',
  },
});
