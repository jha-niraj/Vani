import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { Animation } from '@/constants/theme';

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
    className?: string;
    textClassName?: string;
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
    className = '',
    textClassName = '',
    onPressIn,
    onPressOut,
    ...props
}: ButtonProps) {
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

    const getVariantClasses = (): { container: string; text: string; loaderColor: string } => {
        if (isDisabled) {
            return {
                container: 'bg-neutral-700',
                text: 'text-neutral-500',
                loaderColor: '#737373',
            };
        }

        switch (variant) {
            case 'primary':
                return {
                    container: 'bg-amber-500 shadow-sm',
                    text: 'text-neutral-950',
                    loaderColor: '#0a0a0a',
                };
            case 'secondary':
                return {
                    container: 'bg-neutral-800',
                    text: 'text-white',
                    loaderColor: '#ffffff',
                };
            case 'outline':
                return {
                    container: 'bg-transparent border-[1.5px] border-amber-500',
                    text: 'text-amber-500',
                    loaderColor: '#F59E0B',
                };
            case 'ghost':
                return {
                    container: 'bg-transparent',
                    text: 'text-amber-500',
                    loaderColor: '#F59E0B',
                };
            case 'danger':
                return {
                    container: 'bg-red-500 shadow-sm',
                    text: 'text-white',
                    loaderColor: '#ffffff',
                };
            default:
                return { container: '', text: '', loaderColor: '#ffffff' };
        }
    };

    const getSizeClasses = (): { container: string; text: string } => {
        switch (size) {
            case 'sm':
                return {
                    container: 'h-9 px-3',
                    text: 'text-sm font-semibold',
                };
            case 'lg':
                return {
                    container: 'h-14 px-6',
                    text: 'text-lg font-semibold',
                };
            default:
                return {
                    container: 'h-12 px-5',
                    text: 'text-base font-semibold',
                };
        }
    };

    const variantClasses = getVariantClasses();
    const sizeClasses = getSizeClasses();

    const baseClass = `flex-row items-center justify-center rounded-lg gap-2 ${sizeClasses.container} ${variantClasses.container} ${fullWidth ? 'w-full' : ''} ${className}`;

    return (
        <AnimatedPressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className={baseClass}
            style={animatedStyle}
            {...props}
        >
            {
                loading ? (
                    <ActivityIndicator
                        color={variantClasses.loaderColor}
                        size={size === 'sm' ? 'small' : 'small'}
                    />
                ) : (
                    <>
                        {leftIcon && <>{leftIcon}</>}
                        <Text
                            className={`${sizeClasses.text} ${variantClasses.text} ${leftIcon ? 'ml-2' : ''} ${rightIcon ? 'mr-2' : ''} ${textClassName}`}
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