import React from 'react';
import {
	View, Text, ScrollView, ActivityIndicator, Pressable
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProgressOverview, useSubjectProgress, useWeeklyProgress } from '@/hooks/use-api';

interface StatCardProps {
	value: string;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	color: string;
	isLoading?: boolean;
}

function StatCard({ value, label, icon, color, isLoading }: StatCardProps) {
	return (
		<View className="flex-1 bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
			<View
				className="w-10 h-10 rounded-full items-center justify-center mb-3"
				style={{ backgroundColor: `${color}20` }}
			>
				<Ionicons name={icon} size={20} color={color} />
			</View>
			{isLoading ? (
				<ActivityIndicator color={color} size="small" />
			) : (
				<Text className="text-white text-2xl font-bold">{value}</Text>
			)}
			<Text className="text-neutral-500 text-sm mt-1">{label}</Text>
		</View>
	);
}

interface SubjectProgressProps {
	name: string;
	progress: number;
	accuracy: number;
	color: string;
	icon: string | null;
}

// Icon mapping for subjects
const subjectIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
	'mathematics': 'calculator-outline',
	'math': 'calculator-outline',
	'science': 'flask-outline',
	'english': 'book-outline',
	'gk': 'globe-outline',
	'general knowledge': 'globe-outline',
};

function getSubjectIcon(name: string): keyof typeof Ionicons.glyphMap {
	const key = name.toLowerCase();
	return subjectIcons[key] || 'book-outline';
}

const subjectColors: Record<string, string> = {
	'mathematics': '#F59E0B',
	'math': '#F59E0B',
	'science': '#10B981',
	'english': '#6366F1',
	'gk': '#EC4899',
	'general knowledge': '#EC4899',
};

function getSubjectColor(name: string): string {
	const key = name.toLowerCase();
	return subjectColors[key] || '#F59E0B';
}

function SubjectProgressCard({ name, progress, accuracy, color, icon }: SubjectProgressProps) {
	const iconName = icon || getSubjectIcon(name);
	const colorValue = color || getSubjectColor(name);

	return (
		<View className="flex-row items-center bg-neutral-900 rounded-xl p-4 mb-3 border border-neutral-800">
			<View
				className="w-10 h-10 rounded-full items-center justify-center"
				style={{ backgroundColor: `${colorValue}20` }}
			>
				<Ionicons name={iconName as any} size={20} color={colorValue} />
			</View>
			<View className="flex-1 ml-4">
				<View className="flex-row items-center justify-between mb-2">
					<Text className="text-white font-medium">{name}</Text>
					<Text className="text-neutral-400 text-sm">{accuracy}% accuracy</Text>
				</View>
				<View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
					<View
						className="h-full rounded-full"
						style={{ width: `${progress}%`, backgroundColor: colorValue }}
					/>
				</View>
			</View>
		</View>
	);
}

export default function ProgressScreen() {
	const insets = useSafeAreaInsets();
	const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useProgressOverview();
	const { data: subjects, isLoading: subjectsLoading } = useSubjectProgress();
	const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyProgress();

	const maxWeeklyValue = weeklyData ? Math.max(...weeklyData.map((d) => d.questionsCompleted), 1) : 1;

	const formatTime = (minutes: number) => {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

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
					className="px-6 pt-4 pb-4"
				>
					<Text className="text-white text-2xl font-bold">Progress</Text>
					<Text className="text-neutral-400 text-sm mt-1">
						Track your learning journey
					</Text>
				</Animated.View>

				{/* Stats */}
				<Animated.View
					entering={FadeInDown.delay(200).duration(400)}
					className="px-6 mb-6"
				>
					<View className="flex-row gap-3 mb-3">
						<StatCard
							value={String(overview?.overall?.totalQuestionsAttempted ?? 0)}
							label="Total Questions"
							icon="help-circle-outline"
							color="#F59E0B"
							isLoading={overviewLoading}
						/>
						<StatCard
							value={`${overview?.overall?.accuracy ?? 0}%`}
							label="Accuracy"
							icon="checkmark-circle-outline"
							color="#10B981"
							isLoading={overviewLoading}
						/>
					</View>
					<View className="flex-row gap-3">
						<StatCard
							value={String(overview?.streak?.current ?? 0)}
							label="Day Streak"
							icon="flame-outline"
							color="#EF4444"
							isLoading={overviewLoading}
						/>
						<StatCard
							value={formatTime(overview?.overall?.totalTimeSpentMinutes ?? 0)}
							label="Study Time"
							icon="time-outline"
							color="#6366F1"
							isLoading={overviewLoading}
						/>
					</View>
				</Animated.View>

				{/* Weekly Activity */}
				<Animated.View
					entering={FadeInDown.delay(300).duration(400)}
					className="px-6 mb-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Weekly Activity</Text>
					<View className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
						{weeklyLoading ? (
							<View className="h-32 items-center justify-center">
								<ActivityIndicator color="#F59E0B" />
							</View>
						) : weeklyData && weeklyData.length > 0 ? (
							<>
								<View className="flex-row items-end justify-between h-32">
									{weeklyData.slice(-7).map((item, index) => {
										const height = (item.questionsCompleted / maxWeeklyValue) * 100;
										const isToday = index === weeklyData.length - 1;
										return (
											<View key={item.date} className="items-center flex-1">
												<View
													className={`w-8 rounded-t-lg ${item.goalMet ? 'bg-emerald-500' : isToday ? 'bg-amber-500' : 'bg-neutral-700'}`}
													style={{ height: `${Math.max(height, 5)}%` }}
												/>
												<Text
													className={`text-xs mt-2 ${isToday ? 'text-amber-500 font-semibold' : 'text-neutral-500'}`}
												>
													{item.dayOfWeek?.slice(0, 3) || 'Day'}
												</Text>
											</View>
										);
									})}
								</View>
								<View className="flex-row items-center justify-center mt-4 pt-4 border-t border-neutral-800">
									<Ionicons name="analytics-outline" size={16} color="#a3a3a3" />
									<Text className="text-neutral-400 text-sm ml-2">
										{overview?.today?.questionsCompleted ?? 0} questions today
									</Text>
								</View>
							</>
						) : (
							<View className="h-32 items-center justify-center">
								<Text className="text-neutral-500">No activity this week</Text>
							</View>
						)}
					</View>
				</Animated.View>

				{/* Subject Progress */}
				<Animated.View
					entering={FadeInDown.delay(400).duration(400)}
					className="px-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Subject Progress</Text>
					{subjectsLoading ? (
						<View className="items-center py-8">
							<ActivityIndicator color="#F59E0B" />
						</View>
					) : subjects && subjects.length > 0 ? (
						subjects.map((subject) => (
							<SubjectProgressCard
								key={subject.id}
								name={subject.name}
								progress={subject.completion}
								accuracy={subject.accuracy}
								color={subject.color || getSubjectColor(subject.name)}
								icon={subject.icon}
							/>
						))
					) : (
						<View className="items-center py-8">
							<Ionicons name="bar-chart-outline" size={48} color="#737373" />
							<Text className="text-neutral-400 mt-4 text-center">
								No progress data yet.{'\n'}Start practicing to see your stats!
							</Text>
						</View>
					)}
				</Animated.View>

				{/* Streak Achievement */}
				{overview?.streak?.current && overview.streak.current >= 3 && (
					<Animated.View
						entering={FadeInDown.delay(500).duration(400)}
						className="px-6 mt-6"
					>
						<View className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/30 flex-row items-center">
							<View className="w-14 h-14 bg-amber-500/30 rounded-full items-center justify-center">
								<Text className="text-3xl">🔥</Text>
							</View>
							<View className="flex-1 ml-4">
								<Text className="text-white font-bold text-lg">
									{overview.streak.current} Day Streak!
								</Text>
								<Text className="text-neutral-400 text-sm mt-1">
									Your longest: {overview.streak.longest} days
								</Text>
							</View>
						</View>
					</Animated.View>
				)}
			</ScrollView>
		</View>
	);
}