/**
 * Progress Screen
 * 
 * Shows user's learning progress and statistics.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { api, DashboardStats, SubjectProgress, WeakTopic } from '@/lib/api';
import { Screen, Header, Card, ProgressBar, Badge, Loading } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
  BorderRadius,
} from '@/constants/theme';

export default function ProgressScreen() {
  const { colors } = useTheme();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, progressData, weakData] = await Promise.all([
        api.progress.getDashboard(),
        api.progress.getSubjectProgress(),
        api.progress.getWeakTopics(),
      ]);
      setStats(statsData);
      setSubjectProgress(progressData);
      setWeakTopics(weakData);
    } catch (e) {
      // Use mock data
      setStats({
        totalQuestions: 245,
        correctAnswers: 189,
        accuracy: 77,
        currentStreak: 5,
        longestStreak: 12,
        todayQuestions: 8,
        todayGoal: 10,
        weeklyProgress: [
          { date: '2026-01-20', questions: 15, correct: 12 },
          { date: '2026-01-21', questions: 20, correct: 16 },
          { date: '2026-01-22', questions: 10, correct: 7 },
          { date: '2026-01-23', questions: 25, correct: 21 },
          { date: '2026-01-24', questions: 18, correct: 14 },
          { date: '2026-01-25', questions: 22, correct: 18 },
          { date: '2026-01-26', questions: 8, correct: 6 },
        ],
      });
      setSubjectProgress([
        { subjectId: '1', subjectName: 'General Knowledge', totalQuestions: 80, correctAnswers: 65, accuracy: 81, lastPracticed: '2026-01-26' },
        { subjectId: '2', subjectName: 'Nepali', totalQuestions: 45, correctAnswers: 32, accuracy: 71, lastPracticed: '2026-01-25' },
        { subjectId: '3', subjectName: 'English', totalQuestions: 60, correctAnswers: 52, accuracy: 87, lastPracticed: '2026-01-26' },
        { subjectId: '4', subjectName: 'Mathematics', totalQuestions: 40, correctAnswers: 28, accuracy: 70, lastPracticed: '2026-01-24' },
      ]);
      setWeakTopics([
        { topicId: '1', topicName: 'Algebra', subjectName: 'Mathematics', accuracy: 45, totalAttempts: 20 },
        { topicId: '2', topicName: 'Grammar Rules', subjectName: 'Nepali', accuracy: 52, totalAttempts: 15 },
        { topicId: '3', topicName: 'World Geography', subjectName: 'General Knowledge', accuracy: 58, totalAttempts: 12 },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading progress..." />;
  }

  return (
    <Screen safeTop padding={false}>
      <Header title="Your Progress" />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Overall Stats */}
        {stats && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Card style={styles.statsCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Overall Performance
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.brand.primary }]}>
                    {stats.totalQuestions}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Questions
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.semantic.success }]}>
                    {Math.round(stats.accuracy)}%
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Accuracy
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.semantic.warning }]}>
                    {stats.currentStreak}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Weekly Activity */}
        {stats?.weeklyProgress && (
          <Animated.View 
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              This Week
            </Text>
            <Card>
              <View style={styles.weekChart}>
                {stats.weeklyProgress.map((day, index) => (
                  <View key={day.date} style={styles.dayColumn}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${Math.min(100, (day.questions / 30) * 100)}%`,
                            backgroundColor: day.correct / day.questions >= 0.7
                              ? Colors.semantic.success
                              : Colors.brand.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(day.date).getDay()]}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Subject Progress */}
        {subjectProgress.length > 0 && (
          <Animated.View 
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              By Subject
            </Text>
            {subjectProgress.map((subject) => (
              <Card key={subject.subjectId} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <Text style={[styles.subjectName, { color: colors.text }]}>
                    {subject.subjectName}
                  </Text>
                  <Badge
                    variant={subject.accuracy >= 70 ? 'success' : subject.accuracy >= 50 ? 'warning' : 'error'}
                  >
                    {Math.round(subject.accuracy)}%
                  </Badge>
                </View>
                <ProgressBar 
                  progress={subject.accuracy} 
                  height={6}
                  color={
                    subject.accuracy >= 70 
                      ? Colors.semantic.success 
                      : subject.accuracy >= 50 
                      ? Colors.semantic.warning 
                      : Colors.semantic.error
                  }
                />
                <Text style={[styles.subjectStats, { color: colors.textTertiary }]}>
                  {subject.correctAnswers} / {subject.totalQuestions} correct
                </Text>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <Animated.View 
            entering={FadeInUp.delay(400).duration(500)}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Topics to Improve
            </Text>
            {weakTopics.map((topic) => (
              <Card key={topic.topicId} style={styles.weakCard} variant="outlined">
                <View style={styles.weakHeader}>
                  <View>
                    <Text style={[styles.weakTopic, { color: colors.text }]}>
                      {topic.topicName}
                    </Text>
                    <Text style={[styles.weakSubject, { color: colors.textSecondary }]}>
                      {topic.subjectName}
                    </Text>
                  </View>
                  <View style={styles.weakStats}>
                    <Text style={[styles.weakAccuracy, { color: Colors.semantic.error }]}>
                      {Math.round(topic.accuracy)}%
                    </Text>
                    <Text style={[styles.weakAttempts, { color: colors.textTertiary }]}>
                      {topic.totalAttempts} attempts
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  statsCard: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    marginBottom: Spacing.md,
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: 20,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  dayLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  subjectCard: {
    marginBottom: Spacing.sm,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subjectName: {
    ...Typography.bodyMedium,
  },
  subjectStats: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  weakCard: {
    marginBottom: Spacing.sm,
  },
  weakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weakTopic: {
    ...Typography.bodyMedium,
  },
  weakSubject: {
    ...Typography.caption,
    marginTop: 2,
  },
  weakStats: {
    alignItems: 'flex-end',
  },
  weakAccuracy: {
    ...Typography.bodyMedium,
  },
  weakAttempts: {
    ...Typography.caption,
  },
});
