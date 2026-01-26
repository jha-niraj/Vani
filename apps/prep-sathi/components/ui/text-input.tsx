import React, { useState } from 'react';
import {
    View, TextInput as RNTextInput, Text,
    TextInputProps as RNTextInputProps, ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';

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
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useSharedValue(0);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        focusAnim.value = withTiming(1, { duration: 150 });
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        focusAnim.value = withTiming(0, { duration: 150 });
        onBlur?.(e);
    };

    const animatedBorderStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            focusAnim.value,
            [0, 1],
            [error ? '#EF4444' : '#404040', '#F59E0B']
        );
        return { borderColor };
    });

    return (
        <View className="w-full" style={containerStyle}>
            {
                label && (
                    <Text className="text-white text-sm font-medium mb-2">{label}</Text>
                )
            }

            <Animated.View
                className={`flex-row items-center h-14 rounded-xl border-2 px-4 bg-neutral-900 ${error ? 'border-red-500' : 'border-neutral-700'
                    }`}
                style={animatedBorderStyle}
            >
                {leftIcon && <View className="mr-3">{leftIcon}</View>}

                <RNTextInput
                    className="flex-1 text-white text-base h-full"
                    placeholderTextColor="#737373"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={[
                        leftIcon ? { paddingLeft: 0 } : undefined,
                        rightIcon ? { paddingRight: 0 } : undefined,
                        style,
                    ]}
                    {...props}
                />

                {rightIcon && <View className="ml-3">{rightIcon}</View>}
            </Animated.View>

            {
                (error || hint) && (
                    <Text
                        className={`text-sm mt-2 ${error ? 'text-red-500' : 'text-neutral-500'}`}
                    >
                        {error || hint}
                    </Text>
                )
            }
        </View>
    );
}
