import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, {
	useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming
} from 'react-native-reanimated';

export interface LoadingProps {
	message?: string;
	fullScreen?: boolean;
	size?: 'small' | 'large';
}

export function Loading({
	message,
	fullScreen = false,
	size = 'large',
}: LoadingProps) {
	const scale = useSharedValue(1);

	React.useEffect(() => {
		scale.value = withRepeat(
			withSequence(
				withTiming(1.1, { duration: 600 }),
				withTiming(1, { duration: 600 })
			),
			-1,
			true
		);
	}, [scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const content = (
		<Animated.View
			className="items-center justify-center p-6"
			style={animatedStyle}
		>
			<ActivityIndicator size={size} color="#F59E0B" />
			{
			message && (
				<Text className="text-neutral-400 text-base mt-4 text-center">
					{message}
				</Text>
			)
			}
		</Animated.View>
	);

	if (fullScreen) {
		return (
			<View className="flex-1 items-center justify-center bg-neutral-950">
				{content}
			</View>
		);
	}

	return content;
}