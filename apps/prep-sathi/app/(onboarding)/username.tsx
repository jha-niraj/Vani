/**
 * Username Selection Screen
 * 
 * Allows new users to choose a unique username.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Screen, Header, Button, TextInput, Badge } from '@/components/ui';
import {
  Typography,
  Spacing,
  Colors,
} from '@/constants/theme';

export default function UsernameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateUser } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username validation
  const isValidFormat = /^[a-z0-9_]{3,20}$/.test(username);

  // Debounced availability check
  useEffect(() => {
    if (!username || !isValidFormat) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const result = await api.user.checkUsername(username);
        setIsAvailable(result.available);
        setSuggestions(result.suggestions || []);
      } catch {
        setIsAvailable(null);
      }
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, isValidFormat]);

  const handleUsernameChange = (value: string) => {
    // Lowercase and remove invalid characters
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    setError(null);
    setIsAvailable(null);
  };

  const handleContinue = async () => {
    if (!isAvailable) return;
    
    setIsSubmitting(true);
    try {
      await api.user.setUsername(username);
      updateUser({ username });
      router.push('/(onboarding)/exam-select');
    } catch (e: any) {
      setError(e.message || 'Failed to set username');
    }
    setIsSubmitting(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setUsername(suggestion);
  };

  const getValidationMessage = () => {
    if (!username) return null;
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!isValidFormat) return 'Only lowercase letters, numbers, and underscores';
    if (isChecking) return 'Checking availability...';
    if (isAvailable === true) return 'Username is available! ✓';
    if (isAvailable === false) return 'Username is taken';
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <Screen padding keyboardAvoiding>
      <Header title="Create Profile" transparent />
      
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Choose a username
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This is how other users will see you
          </Text>
        </Animated.View>

        {/* Username Input */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.inputContainer}
        >
          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="your_username"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Text style={{ color: colors.textTertiary }}>@</Text>}
          />
          
          {/* Validation Message */}
          {validationMessage && (
            <Text
              style={[
                styles.validation,
                {
                  color: isAvailable === true
                    ? Colors.semantic.success
                    : isAvailable === false
                    ? Colors.semantic.error
                    : colors.textSecondary,
                },
              ]}
            >
              {validationMessage}
            </Text>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                Try these instead:
              </Text>
              <View style={styles.suggestionsList}>
                {suggestions.map((s) => (
                  <Badge
                    key={s}
                    variant="primary"
                    onPress={() => handleSuggestionPress(s)}
                  >
                    @{s}
                  </Badge>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Error */}
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.buttonContainer}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isAvailable}
            loading={isSubmitting}
            onPress={handleContinue}
          >
            Continue
          </Button>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  validation: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  suggestions: {
    marginTop: Spacing.base,
  },
  suggestionsLabel: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
