import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
	useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { Animation } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface HeaderProps {
	title?: string;
	subtitle?: string;
	showBack?: boolean;
	onBack?: () => void;
	leftAction?: React.ReactNode;
	rightAction?: React.ReactNode;
	transparent?: boolean;
	className?: string;
}

export function Header({
	title,
	subtitle,
	showBack = false,
	onBack,
	leftAction,
	rightAction,
	transparent = false,
	className = '',
}: HeaderProps) {
	const router = useRouter();
	const backScale = useSharedValue(1);

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			router.back();
		}
	};

	const backAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: backScale.value }],
	}));

	return (
		<View
			className={`flex-row items-center h-14 px-4 border-b ${transparent ? 'bg-transparent border-transparent' : 'bg-neutral-950 border-neutral-800'
				} ${className}`}
		>
			<View className="flex-row items-center min-w-12">
				{
					showBack && (
						<AnimatedPressable
							onPress={handleBack}
							onPressIn={() => {
								backScale.value = withSpring(0.9, Animation.spring.stiff);
							}}
							onPressOut={() => {
								backScale.value = withSpring(1, Animation.spring.default);
							}}
							className="w-10 h-10 items-center justify-center -ml-2"
							style={backAnimatedStyle}
							hitSlop={8}
						>
							<Text className="text-white text-xl font-medium">←</Text>
						</AnimatedPressable>
					)
				}
				{leftAction}
			</View>
			<View className="flex-1 items-center justify-center">
				{
					title && (
						<Text
							className="text-white text-lg font-semibold text-center"
							numberOfLines={1}
						>
							{title}
						</Text>
					)
				}
				{
					subtitle && (
						<Text
							className="text-neutral-400 text-xs text-center mt-0.5"
							numberOfLines={1}
						>
							{subtitle}
						</Text>
					)
				}
			</View>

			<View className="flex-row items-center justify-end min-w-12">{rightAction}</View>
		</View>
	);
}