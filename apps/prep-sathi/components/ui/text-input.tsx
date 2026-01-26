/**
 * Text Input Component
 * 
 * A styled text input with label, error state, and focus animations.
 */

import React, { useState } from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,  TextInputProps as RNTextInputProps, ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
    Typography,
    BorderRadius,
    Layout,
    Spacing,
    Animation,
    Colors,
} from '@/constants/theme';

export interface TextInputProps extends RNTextInputProps {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export function TextInput({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    containerStyle,
    onFocus,
    onBlur,
    style,
    ...props
}: TextInputProps) {
    const { isDark, colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useSharedValue(0);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        focusAnim.value = withTiming(1, { duration: Animation.duration.fast });
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        focusAnim.value = withTiming(0, { duration: Animation.duration.fast });
        onBlur?.(e);
    };

    const animatedBorderStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            focusAnim.value,
            [0, 1],
            [error ? Colors.semantic.error : colors.inputBorder, Colors.brand.primary]
        );
        return { borderColor };
    });

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            )}

            <Animated.View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: error ? Colors.semantic.error : colors.inputBorder,
                    },
                    animatedBorderStyle,
                ]}
            >
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

                <RNTextInput
                    style={[
                        styles.input,
                        { color: colors.text },
                        leftIcon && { paddingLeft: 0 },
                        rightIcon && { paddingRight: 0 },
                        style,
                    ]}
                    placeholderTextColor={colors.inputPlaceholder}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />

                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </Animated.View>

            {(error || hint) && (
                <Text
                    style={[
                        styles.helper,
                        { color: error ? Colors.semantic.error : colors.textTertiary },
                    ]}
                >
                    {error || hint}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        ...Typography.label,
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: Layout.height.input,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        paddingHorizontal: Spacing.base,
    },
    input: {
        flex: 1,
        ...Typography.body,
        height: '100%',
    },
    iconLeft: {
        marginRight: Spacing.sm,
    },
    iconRight: {
        marginLeft: Spacing.sm,
    },
    helper: {
        ...Typography.caption,
        marginTop: Spacing.xs,
    },
});
