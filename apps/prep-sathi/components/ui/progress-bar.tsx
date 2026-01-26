import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
	useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation
} from 'react-native-reanimated';

export interface ProgressBarProps {
	progress: number; // 0 to 100
	height?: number;
	color?: string;
	backgroundColor?: string;
	animated?: boolean;
	style?: ViewStyle;
}

export function ProgressBar({
	progress,
	height = 8,
	color = '#F59E0B',
	backgroundColor,
	animated = true,
	style,
}: ProgressBarProps) {
	const progressAnim = useSharedValue(0);
	const clampedProgress = Math.min(100, Math.max(0, progress));

	useEffect(() => {
		if (animated) {
			progressAnim.value = withSpring(clampedProgress, {
				damping: 15,
				stiffness: 100,
				overshootClamping: true,
			});
		} else {
			progressAnim.value = clampedProgress;
		}
	}, [clampedProgress, animated, progressAnim]);

	const animatedStyle = useAnimatedStyle(() => {
		const width = interpolate(
			progressAnim.value,
			[0, 100],
			[0, 100],
			Extrapolation.CLAMP
		);
		return {
			width: `${width}%`,
		};
	});

	return (
		<View
			className="w-full rounded-full overflow-hidden bg-neutral-800"
			style={[{ height }, backgroundColor ? { backgroundColor } : undefined, style]}
		>
			<Animated.View
				className="h-full rounded-full"
				style={[{ backgroundColor: color }, animatedStyle]}
			/>
		</View>
	);
}