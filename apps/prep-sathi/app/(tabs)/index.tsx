/**
 * Home Screen
 * 
 * Main dashboard showing daily progress, quick actions, and continue learning.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { api, DashboardStats } from '@/lib/api';
import { Screen, Card, ProgressBar, Avatar, Badge } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
  BorderRadius,
  Shadows,
  Animation,
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const data = await api.progress.getDashboard();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboard();
    setIsRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dailyProgress = stats 
    ? Math.min(100, (stats.todayQuestions / stats.todayGoal) * 100) 
    : 0;

  return (
    <Screen safeTop padding={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()} 👋
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.displayName || user?.username || 'Student'}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <Avatar 
              name={user?.displayName || user?.username} 
              source={user?.avatarUrl || undefined}
              size="md"
            />
          </Pressable>
        </Animated.View>

        {/* Daily Goal Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Card style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <View>
                <Text style={[styles.dailyTitle, { color: colors.text }]}>
                  Daily Goal
                </Text>
                <Text style={[styles.dailySubtitle, { color: colors.textSecondary }]}>
                  {stats?.todayQuestions || 0} / {stats?.todayGoal || 10} questions
                </Text>
              </View>
              {stats && stats.currentStreak > 0 && (
                <Badge variant="warning">
                  🔥 {stats.currentStreak} day streak
                </Badge>
              )}
            </View>
            <ProgressBar 
              progress={dailyProgress} 
              height={10}
              style={styles.progressBar}
            />
            {dailyProgress >= 100 ? (
              <Text style={[styles.dailyMessage, { color: Colors.semantic.success }]}>
                ✓ Goal completed! Great job!
              </Text>
            ) : (
              <Text style={[styles.dailyMessage, { color: colors.textSecondary }]}>
                {stats?.todayGoal ? stats.todayGoal - (stats?.todayQuestions || 0) : 10} more to reach your goal
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Practice
          </Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              emoji="🎯"
              title="Quick Quiz"
              subtitle="10 random questions"
              color={Colors.brand.primary}
              onPress={() => router.push('/(practice)/quiz?type=QUICK')}
            />
            <QuickAction
              emoji="📚"
              title="By Subject"
              subtitle="Choose a topic"
              color={Colors.brand.secondary}
              onPress={() => router.push('/(tabs)/practice')}
            />
            <QuickAction
              emoji="⚡"
              title="Weak Areas"
              subtitle="Focus on struggles"
              color={Colors.semantic.warning}
              onPress={() => router.push('/(practice)/quiz?type=WEAK_TOPICS')}
            />
            <QuickAction
              emoji="📋"
              title="Past Papers"
              subtitle="Previous years"
              color={Colors.semantic.success}
              onPress={() => router.push('/(tabs)/practice')}
            />
          </View>
        </Animated.View>

        {/* Stats Summary */}
        {stats && (
          <Animated.View 
            entering={FadeInUp.delay(400).duration(500)}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Stats
            </Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Practiced"
                value={stats.totalQuestions.toString()}
                icon="📝"
              />
              <StatCard
                label="Accuracy"
                value={`${Math.round(stats.accuracy)}%`}
                icon="🎯"
              />
              <StatCard
                label="Current Streak"
                value={stats.currentStreak.toString()}
                icon="🔥"
              />
              <StatCard
                label="Best Streak"
                value={stats.longestStreak.toString()}
                icon="⭐"
              />
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </Screen>
  );
}

interface QuickActionProps {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ emoji, title, subtitle, color, onPress }: QuickActionProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, Animation.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Animation.spring.default);
      }}
      style={[
        styles.actionCard,
        { backgroundColor: colors.card },
        Shadows.sm,
        animatedStyle,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </AnimatedPressable>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: {},
  greeting: {
    ...Typography.bodySmall,
  },
  name: {
    ...Typography.h3,
  },
  dailyCard: {
    marginBottom: Spacing.xl,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dailyTitle: {
    ...Typography.h5,
    marginBottom: 2,
  },
  dailySubtitle: {
    ...Typography.bodySmall,
  },
  progressBar: {
    marginBottom: Spacing.sm,
  },
  dailyMessage: {
    ...Typography.caption,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...Typography.caption,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.h4,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
