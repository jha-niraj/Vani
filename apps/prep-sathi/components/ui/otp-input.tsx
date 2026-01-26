/**
 * OTP Input Component
 * 
 * Block-style OTP input with 6 separate boxes.
 * Features auto-focus, paste support, and smooth animations.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
    View, TextInput, Text, StyleSheet, Pressable, Keyboard
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withSequence, 
    withTiming, SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import {
    Typography, BorderRadius, Layout, Spacing, Animation, Colors, 
    Shadows
} from '@/constants/theme';

const OTP_LENGTH = 6;

export interface OTPInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoFocus?: boolean;
    onComplete?: (value: string) => void;
}

// Separate component for each OTP box to properly use hooks
interface OTPBoxProps {
    index: number;
    digit: string;
    isFocused: boolean;
    error?: string;
    scaleValue: SharedValue<number>;
    shakeValue: SharedValue<number>;
    inputRef: (ref: TextInput | null) => void;
    onChangeText: (text: string) => void;
    onKeyPress: (e: { nativeEvent: { key: string } }) => void;
    onFocus: () => void;
    onBlur: () => void;
    onPress: () => void;
}

function OTPBox({
    digit,
    isFocused,
    error,
    scaleValue,
    shakeValue,
    inputRef,
    onChangeText,
    onKeyPress,
    onFocus,
    onBlur,
    onPress,
}: OTPBoxProps) {
    const { isDark, colors } = useTheme();
    const hasValue = !!digit;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scaleValue.value },
            { translateX: shakeValue.value },
        ],
    }));

    return (
        <Animated.View style={[animatedStyle]}>
            <Pressable
                onPress={onPress}
                style={[
                    styles.box,
                    {
                        backgroundColor: hasValue
                            ? isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary
                            : colors.inputBackground,
                        borderColor: error
                            ? Colors.semantic.error
                            : isFocused
                                ? Colors.brand.primary
                                : hasValue
                                    ? Colors.brand.primary + '40'
                                    : colors.inputBorder,
                    },
                    isFocused && Shadows.sm,
                ]}
            >
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: colors.text }]}
                    value={digit}
                    onChangeText={onChangeText}
                    onKeyPress={onKeyPress}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                    caretHidden
                />
            </Pressable>
        </Animated.View>
    );
}

export function OTPInput({
    value,
    onChange,
    error,
    autoFocus = true,
    onComplete,
}: OTPInputProps) {
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);

    // Animation values for each box - using individual hooks at component level
    const scale0 = useSharedValue(1);
    const scale1 = useSharedValue(1);
    const scale2 = useSharedValue(1);
    const scale3 = useSharedValue(1);
    const scale4 = useSharedValue(1);
    const scale5 = useSharedValue(1);
    const scales = [scale0, scale1, scale2, scale3, scale4, scale5];

    const shake0 = useSharedValue(0);
    const shake1 = useSharedValue(0);
    const shake2 = useSharedValue(0);
    const shake3 = useSharedValue(0);
    const shake4 = useSharedValue(0);
    const shake5 = useSharedValue(0);
    const shakes = [shake0, shake1, shake2, shake3, shake4, shake5];

    const otpArray = value.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [autoFocus]);

    useEffect(() => {
        if (value.length === OTP_LENGTH) {
            onComplete?.(value);
        }
    }, [value, onComplete]);

    // Shake animation when error occurs
    useEffect(() => {
        if (error) {
            shakes.forEach((shake) => {
                shake.value = withSequence(
                    withTiming(-10, { duration: 50 }),
                    withTiming(10, { duration: 50 }),
                    withTiming(-10, { duration: 50 }),
                    withTiming(10, { duration: 50 }),
                    withTiming(0, { duration: 50 })
                );
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    const handleChange = (text: string, index: number) => {
        // Handle paste
        if (text.length > 1) {
            const pastedValue = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
            onChange(pastedValue);
            if (pastedValue.length === OTP_LENGTH) {
                Keyboard.dismiss();
            } else {
                inputRefs.current[pastedValue.length]?.focus();
            }
            return;
        }

        // Handle single digit
        const digit = text.replace(/\D/g, '');
        const newOtp = otpArray.slice();
        newOtp[index] = digit;
        const newValue = newOtp.join('').trim();
        onChange(newValue);

        // Animate the box
        scales[index].value = withSequence(
            withSpring(1.1, Animation.spring.stiff),
            withSpring(1, Animation.spring.default)
        );

        // Move to next input
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!otpArray[index] && index > 0) {
                // Move to previous input if current is empty
                const newOtp = otpArray.slice();
                newOtp[index - 1] = '';
                onChange(newOtp.join('').trim());
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current
                const newOtp = otpArray.slice();
                newOtp[index] = '';
                onChange(newOtp.join('').trim());
            }
        }
    };

    const handleFocus = (index: number) => {
        setFocusedIndex(index);
        scales[index].value = withSpring(1.05, Animation.spring.gentle);
    };

    const handleBlur = (index: number) => {
        if (focusedIndex === index) {
            setFocusedIndex(null);
        }
        scales[index].value = withSpring(1, Animation.spring.default);
    };

    const handlePress = (index: number) => {
        inputRefs.current[index]?.focus();
    };

    return (
        <View style={styles.container}>
            <View style={styles.boxesContainer}>
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                    <OTPBox
                        key={index}
                        index={index}
                        digit={otpArray[index]}
                        isFocused={focusedIndex === index}
                        error={error}
                        scaleValue={scales[index]}
                        shakeValue={shakes[index]}
                        inputRef={(ref) => { inputRefs.current[index] = ref; }}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => handleFocus(index)}
                        onBlur={() => handleBlur(index)}
                        onPress={() => handlePress(index)}
                    />
                ))}
            </View>

            {error && (
                <Text style={styles.error}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    boxesContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Layout.otpInput.gap,
    },
    box: {
        width: Layout.otpInput.size,
        height: Layout.otpInput.size,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        ...Typography.h3,
        textAlign: 'center',
        width: '100%',
        height: '100%',
    },
    error: {
        ...Typography.caption,
        color: Colors.semantic.error,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});
