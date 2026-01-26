/**
 * Button Component
 * 
 * A versatile button component with multiple variants and states.
 * Uses react-native-reanimated for smooth press animations.
 */

import React from 'react';
import {
    Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, 
    TextStyle, PressableProps,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
    Typography, BorderRadius, Layout, Shadows, Colors, Animation
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    style,
    textStyle,
    onPressIn,
    onPressOut,
    ...props
}: ButtonProps) {
    const { isDark, colors } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: any) => {
        scale.value = withSpring(0.97, Animation.spring.stiff);
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, Animation.spring.default);
        onPressOut?.(e);
    };

    const isDisabled = disabled || loading;

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (variant) {
            case 'primary':
                return {
                    container: {
                        backgroundColor: isDisabled ? colors.buttonDisabled : Colors.brand.primary,
                        ...(isDisabled ? {} : Shadows.sm),
                    },
                    text: {
                        color: isDisabled ? colors.buttonDisabledText : colors.buttonPrimaryText,
                    },
                };
            case 'secondary':
                return {
                    container: {
                        backgroundColor: colors.buttonSecondary,
                    },
                    text: {
                        color: colors.buttonSecondaryText,
                    },
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: isDisabled ? colors.border : Colors.brand.primary,
                    },
                    text: {
                        color: isDisabled ? colors.textTertiary : Colors.brand.primary,
                    },
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: {
                        color: isDisabled ? colors.textTertiary : Colors.brand.primary,
                    },
                };
            case 'danger':
                return {
                    container: {
                        backgroundColor: isDisabled ? colors.buttonDisabled : Colors.semantic.error,
                        ...(isDisabled ? {} : Shadows.sm),
                    },
                    text: {
                        color: isDisabled ? colors.buttonDisabledText : colors.buttonPrimaryText,
                    },
                };
            default:
                return { container: {}, text: {} };
        }
    };

    const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (size) {
            case 'sm':
                return {
                    container: {
                        height: Layout.height.buttonSmall,
                        paddingHorizontal: 12,
                    },
                    text: Typography.buttonSmall,
                };
            case 'lg':
                return {
                    container: {
                        height: Layout.height.buttonLarge,
                        paddingHorizontal: 24,
                    },
                    text: Typography.buttonLarge,
                };
            default:
                return {
                    container: {
                        height: Layout.height.button,
                        paddingHorizontal: 20,
                    },
                    text: Typography.button,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <AnimatedPressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.base,
                sizeStyles.container,
                variantStyles.container,
                fullWidth && styles.fullWidth,
                animatedStyle,
                style,
            ]}
            {...props}
        >
            {
            loading ? (
                <ActivityIndicator
                    color={variantStyles.text.color}
                    size={size === 'sm' ? 'small' : 'small'}
                />
            ) : (
                <>
                    {leftIcon && <>{leftIcon}</>}
                    <Text
                        style={[
                            sizeStyles.text,
                            variantStyles.text,
                            leftIcon ? { marginLeft: 8 } : undefined,
                            rightIcon ? { marginRight: 8 } : undefined,
                            textStyle,
                        ]}
                    >
                        {children}
                    </Text>
                    {rightIcon && <>{rightIcon}</>}
                </>
            )
            }
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        gap: 8,
    },
    fullWidth: {
        width: '100%',
    },
});
