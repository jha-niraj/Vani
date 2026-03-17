/**
 * useTheme Hook
 * 
 * Provides access to the design system with current color scheme.
 * Use this hook to get theme-aware colors and styles.
 */

import { useColorScheme } from 'react-native';
import { Colors, ComponentStyles, QuizStyles, getColor } from '@/constants/theme';

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // UI Elements
  border: string;
  borderFocus: string;
  divider: string;
  
  // Interactive
  tint: string;
  icon: string;
  iconActive: string;
  
  // Tab Bar
  tabIconDefault: string;
  tabIconSelected: string;
  tabBackground: string;
  
  // Input
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  
  // Button
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  
  // Status
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
}

export interface Theme {
  isDark: boolean;
  colorScheme: ColorScheme;
  colors: ThemeColors;
  brand: typeof Colors.brand;
  
  // Style helpers
  styles: {
    card: () => ReturnType<typeof ComponentStyles.card>;
    input: (focused?: boolean, error?: boolean) => ReturnType<typeof ComponentStyles.input>;
    button: {
      primary: (disabled?: boolean) => ReturnType<typeof ComponentStyles.button.primary>;
      secondary: () => ReturnType<typeof ComponentStyles.button.secondary>;
      outline: () => ReturnType<typeof ComponentStyles.button.outline>;
      ghost: () => ReturnType<typeof ComponentStyles.button.ghost>;
    };
    screenContainer: () => ReturnType<typeof ComponentStyles.screenContainer>;
    safeContainer: () => ReturnType<typeof ComponentStyles.safeContainer>;
  };
  
  // Quiz styles
  quiz: {
    option: {
      default: () => ReturnType<typeof QuizStyles.option.default>;
      selected: () => ReturnType<typeof QuizStyles.option.selected>;
      correct: () => ReturnType<typeof QuizStyles.option.correct>;
      incorrect: () => ReturnType<typeof QuizStyles.option.incorrect>;
    };
    progressBar: typeof QuizStyles.progressBar;
    timer: typeof QuizStyles.timer;
    difficulty: typeof QuizStyles.difficulty;
  };
}

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  
  return {
    isDark,
    colorScheme: colorScheme ?? 'light',
    colors: colors as ThemeColors,
    brand: Colors.brand,
    
    styles: {
      card: () => ComponentStyles.card(isDark),
      input: (focused = false, error = false) => ComponentStyles.input(isDark, focused, error),
      button: {
        primary: (disabled = false) => ComponentStyles.button.primary(isDark, disabled),
        secondary: () => ComponentStyles.button.secondary(isDark),
        outline: () => ComponentStyles.button.outline(isDark),
        ghost: () => ComponentStyles.button.ghost(),
      },
      screenContainer: () => ComponentStyles.screenContainer(isDark),
      safeContainer: () => ComponentStyles.safeContainer(isDark),
    },
    
    quiz: {
      option: {
        default: () => QuizStyles.option.default(isDark),
        selected: () => QuizStyles.option.selected(isDark),
        correct: () => QuizStyles.option.correct(),
        incorrect: () => QuizStyles.option.incorrect(),
      },
      progressBar: QuizStyles.progressBar,
      timer: QuizStyles.timer,
      difficulty: QuizStyles.difficulty,
    },
  };
}

/**
 * Helper to get a single color value
 */
export function useThemeColor(colorKey: keyof ThemeColors): string {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return getColor(colorKey as keyof typeof Colors.light, isDark);
}
