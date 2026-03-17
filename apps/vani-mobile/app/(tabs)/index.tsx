import React from 'react';
import {
	View, Text, ScrollView, Pressable, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
import { useProgressOverview } from '@/hooks/use-api';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionProps {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	subtitle: string;
	color: string;
	onPress: () => void;
}

function QuickAction({ icon, title, subtitle, color, onPress }: QuickActionProps) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-1 bg-neutral-900 rounded-2xl p-4 border border-neutral-800 active:opacity-70"
		>
			<View
				className="w-12 h-12 rounded-full items-center justify-center mb-3"
				style={{ backgroundColor: `${color}20` }}
			>
				<Ionicons name={icon} size={24} color={color} />
			</View>
			<Text className="text-white font-semibold text-base">{title}</Text>
			<Text className="text-neutral-500 text-sm mt-1">{subtitle}</Text>
		</Pressable>
	);
}

interface StatCardProps {
	value: string;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	isLoading?: boolean;
}

function StatCard({ value, label, icon, isLoading }: StatCardProps) {
	return (
		<View className="flex-1 bg-neutral-900 rounded-xl p-4 border border-neutral-800">
			<View className="flex-row items-center justify-between mb-2">
				{isLoading ? (
					<ActivityIndicator color="#F59E0B" size="small" />
				) : (
					<Text className="text-amber-500 text-2xl font-bold">{value}</Text>
				)}
				<Ionicons name={icon} size={20} color="#737373" />
			</View>
			<Text className="text-neutral-400 text-sm">{label}</Text>
		</View>
	);
}

export default function HomeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { user } = useAuthStore();
	const { data: progress, isLoading: progressLoading } = useProgressOverview();

	const greeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	};

	const todayCompleted = progress?.today?.questionsCompleted ?? 0;
	const todayGoal = progress?.today?.goal ?? 10;
	const goalProgress = Math.min(Math.round((todayCompleted / todayGoal) * 100), 100);

	return (
		<View
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top }}
		>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
			>
				<Animated.View
					entering={FadeInDown.delay(100).duration(400)}
					className="px-6 pt-4 pb-6"
				>
					<Text className="text-neutral-400 text-base">{greeting()}</Text>
					<Text className="text-white text-2xl font-bold mt-1">
						{user?.name || user?.username || 'Student'}
					</Text>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(200).duration(400)}
					className="mx-6 mb-6"
				>
					<View className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/30">
						<View className="flex-row items-center justify-between mb-4">
							<View>
								<Text className="text-white text-lg font-semibold">Daily Goal</Text>
								<Text className="text-neutral-400 text-sm mt-1">
									{todayCompleted} of {todayGoal} questions completed
								</Text>
							</View>
							<View className={`px-3 py-1 rounded-full ${progress?.today?.goalMet ? 'bg-emerald-500' : 'bg-amber-500'}`}>
								<Text className="text-black text-sm font-semibold">{goalProgress}%</Text>
							</View>
						</View>
						<View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
							<View
								className={`h-full rounded-full ${progress?.today?.goalMet ? 'bg-emerald-500' : 'bg-amber-500'}`}
								style={{ width: `${goalProgress}%` }}
							/>
						</View>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(300).duration(400)}
					className="px-6 mb-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Your Stats</Text>
					<View className="flex-row gap-3 mb-3">
						<StatCard
							value={String(progress?.overall?.totalQuestionsAttempted ?? 0)}
							label="Questions Done"
							icon="checkmark-circle-outline"
							isLoading={progressLoading}
						/>
						<StatCard
							value={`${progress?.overall?.accuracy ?? 0}%`}
							label="Accuracy"
							icon="analytics-outline"
							isLoading={progressLoading}
						/>
					</View>
					<View className="flex-row gap-3">
						<StatCard
							value={String(progress?.streak?.current ?? 0)}
							label="Day Streak"
							icon="flame-outline"
							isLoading={progressLoading}
						/>
						<StatCard
							value={`${progress?.overall?.totalTimeSpentMinutes ?? 0}m`}
							label="Study Time"
							icon="time-outline"
							isLoading={progressLoading}
						/>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(400).duration(400)}
					className="px-6 mb-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Quick Actions</Text>
					<View className="flex-row gap-3">
						<QuickAction
							icon="flash-outline"
							title="Quick Quiz"
							subtitle="10 random questions"
							color="#F59E0B"
							onPress={() => router.push('/(practice)/quiz')}
						/>
						<QuickAction
							icon="book-outline"
							title="Practice"
							subtitle="Choose a topic"
							color="#10B981"
							onPress={() => router.push('/(tabs)/practice')}
						/>
					</View>
				</Animated.View>
				{progress?.streak?.current && progress.streak.current > 0 && (
					<Animated.View
						entering={FadeInDown.delay(500).duration(400)}
						className="px-6"
					>
						<View className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/30 flex-row items-center">
							<View className="w-14 h-14 bg-amber-500/30 rounded-full items-center justify-center">
								<Text className="text-3xl">🔥</Text>
							</View>
							<View className="flex-1 ml-4">
								<Text className="text-white font-bold text-lg">
									{progress.streak.current} Day Streak!
								</Text>
								<Text className="text-neutral-400 text-sm mt-1">
									Keep going! Your longest streak is {progress.streak.longest} days.
								</Text>
							</View>
						</View>
					</Animated.View>
				)}
			</ScrollView>
		</View>
	);
}