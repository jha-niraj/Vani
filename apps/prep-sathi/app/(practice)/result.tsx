import React from 'react';
import {
	View, Text, ScrollView, Pressable
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ResultScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams<{ score: string; total: string }>();

	const score = parseInt(params.score || '0', 10);
	const total = parseInt(params.total || '5', 10);
	const percentage = Math.round((score / total) * 100);

	const getGrade = () => {
		if (percentage >= 90) return { label: 'Excellent!', emoji: '🏆', color: '#10B981' };
		if (percentage >= 75) return { label: 'Great Job!', emoji: '🌟', color: '#F59E0B' };
		if (percentage >= 60) return { label: 'Good Effort!', emoji: '👍', color: '#6366F1' };
		if (percentage >= 40) return { label: 'Keep Trying!', emoji: '💪', color: '#F97316' };
		return { label: 'Needs Practice', emoji: '📚', color: '#EF4444' };
	};

	const grade = getGrade();

	const stats = [
		{
			icon: 'checkmark-circle-outline' as const,
			label: 'Correct',
			value: score.toString(),
			color: '#10B981',
		},
		{
			icon: 'close-circle-outline' as const,
			label: 'Incorrect',
			value: (total - score).toString(),
			color: '#EF4444',
		},
		{
			icon: 'time-outline' as const,
			label: 'Time',
			value: '2:45',
			color: '#6366F1',
		},
	];

	return (
		<View
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Animated.View
					entering={FadeInDown.delay(200).duration(500)}
					className="items-center py-10"
				>
					<View className="relative">
						<View className="w-40 h-40 rounded-full border-8 border-neutral-800 items-center justify-center">
							<View
								className="absolute w-40 h-40 rounded-full border-8"
								style={{
									borderColor: grade.color,
									borderRightColor: 'transparent',
									borderBottomColor: percentage > 50 ? grade.color : 'transparent',
									transform: [{ rotate: '-45deg' }],
								}}
							/>
							<Text className="text-white text-4xl font-bold">{percentage}%</Text>
							<Text className="text-neutral-500 text-sm">Score</Text>
						</View>
					</View>
					<View className="mt-6 items-center">
						<Text className="text-5xl mb-2">{grade.emoji}</Text>
						<Text
							className="text-2xl font-bold"
							style={{ color: grade.color }}
						>
							{grade.label}
						</Text>
						<Text className="text-neutral-400 mt-2">
							You got {score} out of {total} questions correct
						</Text>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(400).duration(400)}
					className="px-6 mb-8"
				>
					<View className="flex-row gap-3">
						{
							stats.map((stat, index) => (
								<View
									key={stat.label}
									className="flex-1 bg-neutral-900 rounded-2xl p-4 border border-neutral-800 items-center"
								>
									<View
										className="w-10 h-10 rounded-full items-center justify-center mb-2"
										style={{ backgroundColor: `${stat.color}20` }}
									>
										<Ionicons name={stat.icon} size={20} color={stat.color} />
									</View>
									<Text className="text-white text-xl font-bold">{stat.value}</Text>
									<Text className="text-neutral-500 text-sm">{stat.label}</Text>
								</View>
							))
						}
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(500).duration(400)}
					className="px-6 mb-8"
				>
					<Text className="text-white text-lg font-semibold mb-4">Performance</Text>
					<View className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-neutral-400">Accuracy</Text>
							<Text className="text-white font-semibold">{percentage}%</Text>
						</View>
						<View className="h-3 bg-neutral-800 rounded-full overflow-hidden mb-4">
							<View
								className="h-full rounded-full"
								style={{ width: `${percentage}%`, backgroundColor: grade.color }}
							/>
						</View>
						<View className="flex-row justify-between">
							<View className="items-center">
								<Text className="text-emerald-500 text-lg font-bold">{score}</Text>
								<Text className="text-neutral-500 text-xs">Correct</Text>
							</View>
							<View className="items-center">
								<Text className="text-red-500 text-lg font-bold">{total - score}</Text>
								<Text className="text-neutral-500 text-xs">Wrong</Text>
							</View>
							<View className="items-center">
								<Text className="text-neutral-400 text-lg font-bold">0</Text>
								<Text className="text-neutral-500 text-xs">Skipped</Text>
							</View>
						</View>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(600).duration(400)}
					className="px-6"
				>
					<View className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/30">
						<View className="flex-row items-center mb-3">
							<Ionicons name="bulb-outline" size={24} color="#F59E0B" />
							<Text className="text-amber-500 font-semibold ml-2 text-lg">Tip</Text>
						</View>
						<Text className="text-neutral-300 leading-relaxed">
							Review the questions you got wrong and practice similar topics to improve your score.
						</Text>
					</View>
				</Animated.View>
			</ScrollView>
			<Animated.View
				entering={FadeInUp.delay(700).duration(400)}
				className="px-6 pb-4"
			>
				<View className="flex-row gap-3">
					<Pressable
						onPress={() => router.replace('/(tabs)')}
						className="flex-1 bg-neutral-900 rounded-2xl py-4 items-center border border-neutral-800 active:opacity-70"
					>
						<Text className="text-white font-semibold">Home</Text>
					</Pressable>
					<Pressable
						onPress={() => router.replace('/(practice)/quiz')}
						className="flex-1 bg-amber-500 rounded-2xl py-4 items-center active:opacity-80"
					>
						<Text className="text-black font-bold">Try Again</Text>
					</Pressable>
				</View>
			</Animated.View>
		</View>
	);
}