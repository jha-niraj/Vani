/**
 * Exam Selection Screen
 * 
 * Allows users to select their target exam type and level.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
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
import { api, ExamType, ExamLevel } from '@/lib/api';
import { Screen, Header, Button, Card, Loading } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
  BorderRadius,
  Shadows,
  Animation,
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ExamSelectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateUser } = useAuthStore();
  
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [levels, setLevels] = useState<ExamLevel[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExamLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch exam types on mount
  useEffect(() => {
    async function fetchExamTypes() {
      try {
        const data = await api.exam.getExamTypes();
        setExamTypes(data);
      } catch (e: any) {
        setError(e.message);
      }
      setIsLoading(false);
    }
    fetchExamTypes();
  }, []);

  // Fetch levels when exam is selected
  useEffect(() => {
    if (!selectedExam?.hasLevels) {
      setLevels([]);
      return;
    }

    async function fetchLevels() {
      try {
        const data = await api.exam.getLevels(selectedExam!.id);
        setLevels(data);
      } catch (e: any) {
        setError(e.message);
      }
    }
    fetchLevels();
  }, [selectedExam]);

  const handleExamSelect = (exam: ExamType) => {
    setSelectedExam(exam);
    setSelectedLevel(null);
  };

  const handleLevelSelect = (level: ExamLevel) => {
    setSelectedLevel(level);
  };

  const handleContinue = async () => {
    if (!selectedExam) return;
    if (selectedExam.hasLevels && !selectedLevel) return;

    setIsSubmitting(true);
    try {
      await api.user.selectExam(selectedExam.id, selectedLevel?.id);
      updateUser({ 
        selectedExamId: selectedExam.id,
        selectedLevelId: selectedLevel?.id || null,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    }
    setIsSubmitting(false);
  };

  const canContinue = selectedExam && (!selectedExam.hasLevels || selectedLevel);

  if (isLoading) {
    return <Loading fullScreen message="Loading exams..." />;
  }

  return (
    <Screen padding>
      <Header title="Select Your Exam" transparent />
      
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            What are you preparing for?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We'll personalize your experience based on your selection
          </Text>
        </Animated.View>

        {/* Exam Types */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Exam Type
          </Text>
          <View style={styles.grid}>
            {examTypes.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                isSelected={selectedExam?.id === exam.id}
                onPress={() => handleExamSelect(exam)}
                delay={index * 50}
              />
            ))}
          </View>
        </Animated.View>

        {/* Levels (if applicable) */}
        {selectedExam?.hasLevels && levels.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Level
            </Text>
            <View style={styles.levelsList}>
              {levels.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  isSelected={selectedLevel?.id === level.id}
                  onPress={() => handleLevelSelect(level)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Error */}
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue}
            loading={isSubmitting}
            onPress={handleContinue}
          >
            Start Learning
          </Button>
        </View>
      </View>
    </Screen>
  );
}

interface ExamCardProps {
  exam: ExamType;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
}

function ExamCard({ exam, isSelected, onPress, delay = 0 }: ExamCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(delay).duration(400)}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, Animation.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Animation.spring.default);
      }}
      style={[
        styles.examCard,
        {
          backgroundColor: isSelected 
            ? `${Colors.brand.primary}10` 
            : colors.card,
          borderColor: isSelected 
            ? Colors.brand.primary 
            : colors.border,
        },
        isSelected && Shadows.sm,
        animatedStyle,
      ]}
    >
      <Text style={styles.examIcon}>{exam.icon || '📋'}</Text>
      <Text 
        style={[
          styles.examName, 
          { color: isSelected ? Colors.brand.primary : colors.text }
        ]}
        numberOfLines={2}
      >
        {exam.name}
      </Text>
    </AnimatedPressable>
  );
}

interface LevelCardProps {
  level: ExamLevel;
  isSelected: boolean;
  onPress: () => void;
}

function LevelCard({ level, isSelected, onPress }: LevelCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.levelCard,
        {
          backgroundColor: isSelected 
            ? `${Colors.brand.primary}10` 
            : colors.card,
          borderColor: isSelected 
            ? Colors.brand.primary 
            : colors.border,
        },
      ]}
    >
      <View 
        style={[
          styles.radio,
          {
            borderColor: isSelected ? Colors.brand.primary : colors.border,
          },
        ]}
      >
        {isSelected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.levelContent}>
        <Text 
          style={[
            styles.levelName, 
            { color: isSelected ? Colors.brand.primary : colors.text }
          ]}
        >
          {level.name}
        </Text>
        {level.description && (
          <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>
            {level.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.base,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  examCard: {
    width: '47%',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 100,
  },
  examIcon: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  examName: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  levelsList: {
    gap: Spacing.sm,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.brand.primary,
  },
  levelContent: {
    flex: 1,
  },
  levelName: {
    ...Typography.bodyMedium,
  },
  levelDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
  error: {
    ...Typography.bodySmall,
    color: Colors.semantic.error,
    marginBottom: Spacing.base,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});
