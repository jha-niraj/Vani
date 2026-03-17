import React from 'react';
import { View, Pressable, PressableProps } from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { Animation } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    pressable?: boolean;
}

export function Card({
    children,
    variant = 'elevated',
    padding = 'md',
    className = '',
    pressable = false,
    onPressIn,
    onPressOut,
    ...props
}: CardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: any) => {
        if (pressable) {
            scale.value = withSpring(0.98, Animation.spring.stiff);
        }
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        if (pressable) {
            scale.value = withSpring(1, Animation.spring.default);
        }
        onPressOut?.(e);
    };

    const getVariantClass = (): string => {
        switch (variant) {
            case 'elevated':
                return 'bg-neutral-900 shadow-lg';
            case 'outlined':
                return 'bg-neutral-900 border border-neutral-800';
            case 'filled':
                return 'bg-neutral-900/50';
            default:
                return '';
        }
    };

    const getPaddingClass = (): string => {
        switch (padding) {
            case 'none':
                return '';
            case 'sm':
                return 'p-2';
            case 'lg':
                return 'p-6';
            default:
                return 'p-4';
        }
    };

    const baseClass = `rounded-xl overflow-hidden ${getVariantClass()} ${getPaddingClass()} ${className}`;

    if (pressable || props.onPress) {
        return (
            <AnimatedPressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                className={baseClass}
                style={animatedStyle}
                {...props}
            >
                {children}
            </AnimatedPressable>
        );
    }

    return <View className={baseClass}>{children}</View>;
}