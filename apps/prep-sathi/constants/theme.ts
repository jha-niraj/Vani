/**
 * PrepSathi Design System
 * 
 * A comprehensive design system for consistent UI across the app.
 * Includes colors, typography, spacing, shadows, and component styles.
 */

import { Platform, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// COLORS
// =============================================================================

// Brand Colors
const brand = {
	// Neutral foundations (already solid)
	backgroundDark: '#0a0a0a',     // neutral-950
	backgroundLight: '#ffffff',

	// Brand accent — warm, optimistic orange
	primary: '#F59E0B',           // Amber-500 (perfect balance)
	primaryLight: '#FCD34D',      // Amber-300 (hover, highlights)
	primaryDark: '#D97706',       // Amber-600 (active, emphasis)

	// Secondary (very subtle, optional)
	secondary: '#FB923C',         // Orange-400
	secondaryLight: '#FED7AA',    // Orange-200
	secondaryDark: '#EA580C',     // Orange-600
};

// Semantic Colors
const semantic = {
	success: '#10B981',
	successLight: '#34D399',
	successDark: '#059669',
	warning: '#F59E0B',
	warningLight: '#FBBF24',
	warningDark: '#D97706',
	error: '#EF4444',
	errorLight: '#F87171',
	errorDark: '#DC2626',
	info: '#3B82F6',
	infoLight: '#60A5FA',
	infoDark: '#2563EB',
};

// Neutral Colors
const neutral = {
	white: '#FFFFFF',
	black: '#000000',
	gray50: '#F9FAFB',
	gray100: '#F3F4F6',
	gray200: '#E5E7EB',
	gray300: '#D1D5DB',
	gray400: '#9CA3AF',
	gray500: '#6B7280',
	gray600: '#4B5563',
	gray700: '#374151',
	gray800: '#1F2937',
	gray900: '#111827',
};

export const Colors = {
	brand,
	semantic,
	neutral,
	light: {
		// Backgrounds
		background: neutral.white,
		backgroundSecondary: neutral.gray50,
		backgroundTertiary: neutral.gray100,
		card: neutral.white,

		// Text
		text: neutral.gray900,
		textSecondary: neutral.gray600,
		textTertiary: neutral.gray400,
		textInverse: neutral.white,

		// UI Elements
		border: neutral.gray200,
		borderFocus: brand.primary,
		divider: neutral.gray100,

		// Interactive
		tint: brand.primary,
		icon: neutral.gray500,
		iconActive: brand.primary,

		// Tab Bar
		tabIconDefault: neutral.gray400,
		tabIconSelected: brand.primary,
		tabBackground: neutral.white,

		// Input
		inputBackground: neutral.gray50,
		inputBorder: neutral.gray300,
		inputPlaceholder: neutral.gray400,

		// Button
		buttonPrimary: brand.primary,
		buttonPrimaryText: neutral.white,
		buttonSecondary: neutral.gray100,
		buttonSecondaryText: neutral.gray700,
		buttonDisabled: neutral.gray200,
		buttonDisabledText: neutral.gray400,

		// Status
		...semantic,
	},
	dark: {
		// Backgrounds - Using neutral-950 (#0a0a0a) as base
		background: '#0a0a0a',
		backgroundSecondary: '#171717',    // neutral-900
		backgroundTertiary: '#262626',     // neutral-800
		card: '#171717',

		// Text
		text: '#FAFAFA',                   // neutral-50
		textSecondary: '#A3A3A3',          // neutral-400
		textTertiary: '#737373',           // neutral-500
		textInverse: neutral.gray900,

		// UI Elements
		border: '#404040',                 // neutral-700
		borderFocus: brand.primary,
		divider: '#262626',                // neutral-800

		// Interactive
		tint: brand.primary,
		icon: '#A3A3A3',                   // neutral-400
		iconActive: brand.primary,

		// Tab Bar
		tabIconDefault: '#737373',         // neutral-500
		tabIconSelected: brand.primary,
		tabBackground: '#0a0a0a',

		// Input
		inputBackground: '#171717',        // neutral-900
		inputBorder: '#404040',            // neutral-700
		inputPlaceholder: '#737373',       // neutral-500

		// Button
		buttonPrimary: brand.primary,
		buttonPrimaryText: '#0a0a0a',      // Dark text on orange button
		buttonSecondary: '#262626',        // neutral-800
		buttonSecondaryText: '#FAFAFA',    // neutral-50
		buttonDisabled: '#262626',         // neutral-800
		buttonDisabledText: '#525252',     // neutral-600

		// Status
		...semantic,
	},
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const Fonts = Platform.select({
	ios: {
		sans: 'System',
		sansMedium: 'System',
		sansBold: 'System',
		serif: 'Georgia',
		mono: 'Menlo',
	},
	default: {
		sans: 'Roboto',
		sansMedium: 'Roboto',
		sansBold: 'Roboto',
		serif: 'serif',
		mono: 'monospace',
	},
});

// Font Sizes (in pixels, will be scaled)
export const FontSizes = {
	xs: 10,
	sm: 12,
	md: 14,
	base: 16,
	lg: 18,
	xl: 20,
	'2xl': 24,
	'3xl': 30,
	'4xl': 36,
	'5xl': 48,
};

// Line Heights
export const LineHeights = {
	tight: 1.2,
	snug: 1.375,
	normal: 1.5,
	relaxed: 1.625,
	loose: 2,
};

// Font Weights
export const FontWeights = {
	normal: '400' as const,
	medium: '500' as const,
	semibold: '600' as const,
	bold: '700' as const,
	extrabold: '800' as const,
};

// Typography Presets
export const Typography = StyleSheet.create({
	// Headings
	h1: {
		fontSize: FontSizes['4xl'],
		fontWeight: FontWeights.bold,
		lineHeight: FontSizes['4xl'] * LineHeights.tight,
		letterSpacing: -0.5,
	},
	h2: {
		fontSize: FontSizes['3xl'],
		fontWeight: FontWeights.bold,
		lineHeight: FontSizes['3xl'] * LineHeights.tight,
		letterSpacing: -0.3,
	},
	h3: {
		fontSize: FontSizes['2xl'],
		fontWeight: FontWeights.semibold,
		lineHeight: FontSizes['2xl'] * LineHeights.snug,
	},
	h4: {
		fontSize: FontSizes.xl,
		fontWeight: FontWeights.semibold,
		lineHeight: FontSizes.xl * LineHeights.snug,
	},
	h5: {
		fontSize: FontSizes.lg,
		fontWeight: FontWeights.medium,
		lineHeight: FontSizes.lg * LineHeights.normal,
	},

	// Body Text
	body: {
		fontSize: FontSizes.base,
		fontWeight: FontWeights.normal,
		lineHeight: FontSizes.base * LineHeights.normal,
	},
	bodyMedium: {
		fontSize: FontSizes.base,
		fontWeight: FontWeights.medium,
		lineHeight: FontSizes.base * LineHeights.normal,
	},
	bodySmall: {
		fontSize: FontSizes.md,
		fontWeight: FontWeights.normal,
		lineHeight: FontSizes.md * LineHeights.normal,
	},

	// Labels & Captions
	label: {
		fontSize: FontSizes.md,
		fontWeight: FontWeights.medium,
		lineHeight: FontSizes.md * LineHeights.normal,
		letterSpacing: 0.1,
	},
	caption: {
		fontSize: FontSizes.sm,
		fontWeight: FontWeights.normal,
		lineHeight: FontSizes.sm * LineHeights.normal,
	},
	overline: {
		fontSize: FontSizes.xs,
		fontWeight: FontWeights.semibold,
		lineHeight: FontSizes.xs * LineHeights.normal,
		letterSpacing: 1,
		textTransform: 'uppercase',
	},

	// Buttons
	buttonLarge: {
		fontSize: FontSizes.lg,
		fontWeight: FontWeights.semibold,
		lineHeight: FontSizes.lg * LineHeights.tight,
		letterSpacing: 0.3,
	},
	button: {
		fontSize: FontSizes.base,
		fontWeight: FontWeights.semibold,
		lineHeight: FontSizes.base * LineHeights.tight,
		letterSpacing: 0.3,
	},
	buttonSmall: {
		fontSize: FontSizes.md,
		fontWeight: FontWeights.semibold,
		lineHeight: FontSizes.md * LineHeights.tight,
		letterSpacing: 0.2,
	},
});

// =============================================================================
// SPACING
// =============================================================================

export const Spacing = {
	none: 0,
	xs: 4,
	sm: 8,
	md: 12,
	base: 16,
	lg: 20,
	xl: 24,
	'2xl': 32,
	'3xl': 40,
	'4xl': 48,
	'5xl': 64,
	'6xl': 80,
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const BorderRadius = {
	none: 0,
	xs: 4,
	sm: 6,
	md: 8,
	base: 12,
	lg: 16,
	xl: 20,
	'2xl': 24,
	'3xl': 32,
	full: 9999,
};

// =============================================================================
// SHADOWS
// =============================================================================

export const Shadows = {
	none: {
		shadowColor: 'transparent',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
	sm: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	base: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	md: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 6,
		elevation: 4,
	},
	lg: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	xl: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.2,
		shadowRadius: 16,
		elevation: 12,
	},
};

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export const Animation = {
	// Durations (in ms)
	duration: {
		instant: 100,
		fast: 200,
		normal: 300,
		slow: 500,
		slower: 700,
	},
	// Spring configs for react-native-reanimated
	spring: {
		default: {
			damping: 15,
			stiffness: 150,
			mass: 1,
		},
		bouncy: {
			damping: 10,
			stiffness: 180,
			mass: 1,
		},
		stiff: {
			damping: 20,
			stiffness: 200,
			mass: 1,
		},
		gentle: {
			damping: 15,
			stiffness: 100,
			mass: 1,
		},
	},
};

// =============================================================================
// LAYOUT
// =============================================================================

export const Layout = {
	// Screen dimensions
	screen: {
		width: SCREEN_WIDTH,
		height: SCREEN_HEIGHT,
	},
	// Safe area padding (approximate)
	safeArea: {
		top: Platform.OS === 'ios' ? 44 : 24,
		bottom: Platform.OS === 'ios' ? 34 : 16,
	},
	// Container max width
	maxWidth: 428,
	// Common component heights
	height: {
		header: 56,
		tabBar: 60,
		button: 52,
		buttonSmall: 40,
		buttonLarge: 56,
		input: 52,
		inputSmall: 44,
		card: 120,
		listItem: 64,
	},
	// OTP input specific
	otpInput: {
		size: 52,
		gap: 12,
		count: 6,
	},
};

// =============================================================================
// Z-INDEX
// =============================================================================

export const ZIndex = {
	base: 0,
	dropdown: 10,
	sticky: 20,
	fixed: 30,
	overlay: 40,
	modal: 50,
	popover: 60,
	tooltip: 70,
};

// =============================================================================
// ICONS
// =============================================================================

export const IconSizes = {
	xs: 12,
	sm: 16,
	md: 20,
	base: 24,
	lg: 28,
	xl: 32,
	'2xl': 40,
	'3xl': 48,
};

// =============================================================================
// COMMON STYLES
// =============================================================================

export const CommonStyles = StyleSheet.create({
	// Flex utilities
	flex1: { flex: 1 },
	flexRow: { flexDirection: 'row' },
	flexRowReverse: { flexDirection: 'row-reverse' },
	flexCol: { flexDirection: 'column' },
	flexWrap: { flexWrap: 'wrap' },

	// Alignment
	itemsCenter: { alignItems: 'center' },
	itemsStart: { alignItems: 'flex-start' },
	itemsEnd: { alignItems: 'flex-end' },
	justifyCenter: { justifyContent: 'center' },
	justifyStart: { justifyContent: 'flex-start' },
	justifyEnd: { justifyContent: 'flex-end' },
	justifyBetween: { justifyContent: 'space-between' },
	justifyAround: { justifyContent: 'space-around' },
	center: { alignItems: 'center', justifyContent: 'center' },

	// Position
	absolute: { position: 'absolute' },
	relative: { position: 'relative' },
	absoluteFill: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},

	// Size
	fullWidth: { width: '100%' },
	fullHeight: { height: '100%' },
	full: { width: '100%', height: '100%' },

	// Overflow
	overflowHidden: { overflow: 'hidden' },

	// Text alignment
	textCenter: { textAlign: 'center' },
	textLeft: { textAlign: 'left' },
	textRight: { textAlign: 'right' },
});

// =============================================================================
// COMPONENT PRESETS
// =============================================================================

export const ComponentStyles = {
	// Card styles
	card: (isDark: boolean) => ({
		backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
		borderRadius: BorderRadius.lg,
		padding: Spacing.base,
		...Shadows.base,
	}),

	// Input styles
	input: (isDark: boolean, focused: boolean = false, error: boolean = false) => ({
		height: Layout.height.input,
		backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground,
		borderRadius: BorderRadius.md,
		borderWidth: 1.5,
		borderColor: error
			? Colors.semantic.error
			: focused
				? isDark ? Colors.dark.borderFocus : Colors.light.borderFocus
				: isDark ? Colors.dark.inputBorder : Colors.light.inputBorder,
		paddingHorizontal: Spacing.base,
	}),

	// Button styles
	button: {
		primary: (isDark: boolean, disabled: boolean = false) => ({
			height: Layout.height.button,
			backgroundColor: disabled
				? isDark ? Colors.dark.buttonDisabled : Colors.light.buttonDisabled
				: Colors.brand.primary,
			borderRadius: BorderRadius.md,
			...(!disabled && Shadows.sm),
		}),
		secondary: (isDark: boolean) => ({
			height: Layout.height.button,
			backgroundColor: isDark ? Colors.dark.buttonSecondary : Colors.light.buttonSecondary,
			borderRadius: BorderRadius.md,
		}),
		outline: (isDark: boolean) => ({
			height: Layout.height.button,
			backgroundColor: 'transparent',
			borderRadius: BorderRadius.md,
			borderWidth: 1.5,
			borderColor: Colors.brand.primary,
		}),
		ghost: () => ({
			height: Layout.height.button,
			backgroundColor: 'transparent',
		}),
	},

	// Screen container
	screenContainer: (isDark: boolean) => ({
		flex: 1,
		backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
	}),

	// Safe area container
	safeContainer: (isDark: boolean) => ({
		flex: 1,
		backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
		paddingTop: Layout.safeArea.top,
	}),
};

// =============================================================================
// QUIZ SPECIFIC STYLES
// =============================================================================

export const QuizStyles = {
	// Option button colors
	option: {
		default: (isDark: boolean) => ({
			background: isDark ? Colors.dark.card : Colors.light.card,
			border: isDark ? Colors.dark.border : Colors.light.border,
			text: isDark ? Colors.dark.text : Colors.light.text,
		}),
		selected: (isDark: boolean) => ({
			background: `${Colors.brand.primary}15`,
			border: Colors.brand.primary,
			text: isDark ? Colors.dark.text : Colors.light.text,
		}),
		correct: () => ({
			background: `${Colors.semantic.success}15`,
			border: Colors.semantic.success,
			text: Colors.semantic.successDark,
		}),
		incorrect: () => ({
			background: `${Colors.semantic.error}15`,
			border: Colors.semantic.error,
			text: Colors.semantic.errorDark,
		}),
	},

	// Progress bar
	progressBar: {
		height: 8,
		borderRadius: BorderRadius.full,
		background: (isDark: boolean) => isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundTertiary,
		fill: Colors.brand.primary,
	},

	// Timer colors
	timer: {
		normal: Colors.brand.primary,
		warning: Colors.semantic.warning,
		critical: Colors.semantic.error,
	},

	// Difficulty badges
	difficulty: {
		easy: {
			background: `${Colors.semantic.success}20`,
			text: Colors.semantic.success,
		},
		medium: {
			background: `${Colors.semantic.warning}20`,
			text: Colors.semantic.warningDark,
		},
		hard: {
			background: `${Colors.semantic.error}20`,
			text: Colors.semantic.error,
		},
	},
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color based on theme
 */
export const getColor = (
	key: keyof typeof Colors.light,
	isDark: boolean
): string => {
	return isDark ? Colors.dark[key] : Colors.light[key];
};

/**
 * Get responsive size based on screen width
 */
export const responsive = (size: number, baseWidth = 375): number => {
	return (SCREEN_WIDTH / baseWidth) * size;
};

/**
 * Create spacing object for use in style prop
 * Use numeric values directly (e.g., 8, 16, 24)
 */
export const spacing = (
	top: number,
	right?: number,
	bottom?: number,
	left?: number
) => {
	if (right === undefined) {
		// Single value - all sides
		return {
			paddingTop: top,
			paddingRight: top,
			paddingBottom: top,
			paddingLeft: top,
		};
	}
	return {
		paddingTop: top,
		paddingRight: right,
		paddingBottom: bottom ?? top,
		paddingLeft: left ?? right,
	};
};
