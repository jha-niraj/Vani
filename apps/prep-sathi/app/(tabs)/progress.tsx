import React from 'react';
import {
	View, Text, ScrollView
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
	value: string;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	color: string;
}

function StatCard({ value, label, icon, color }: StatCardProps) {
	return (
		<View className="flex-1 bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
			<View
				className="w-10 h-10 rounded-full items-center justify-center mb-3"
				style={{ backgroundColor: `${color}20` }}
			>
				<Ionicons name={icon} size={20} color={color} />
			</View>
			<Text className="text-white text-2xl font-bold">{value}</Text>
			<Text className="text-neutral-500 text-sm mt-1">{label}</Text>
		</View>
	);
}

interface SubjectProgressProps {
	name: string;
	progress: number;
	color: string;
	icon: keyof typeof Ionicons.glyphMap;
}

function SubjectProgress({ name, progress, color, icon }: SubjectProgressProps) {
	return (
		<View className="flex-row items-center bg-neutral-900 rounded-xl p-4 mb-3 border border-neutral-800">
			<View
				className="w-10 h-10 rounded-full items-center justify-center"
				style={{ backgroundColor: `${color}20` }}
			>
				<Ionicons name={icon} size={20} color={color} />
			</View>
			<View className="flex-1 ml-4">
				<View className="flex-row items-center justify-between mb-2">
					<Text className="text-white font-medium">{name}</Text>
					<Text className="text-neutral-400 text-sm">{progress}%</Text>
				</View>
				<View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
					<View
						className="h-full rounded-full"
						style={{ width: `${progress}%`, backgroundColor: color }}
					/>
				</View>
			</View>
		</View>
	);
}

export default function ProgressScreen() {
	const insets = useSafeAreaInsets();

	const weeklyData = [
		{ day: 'Mon', value: 15 },
		{ day: 'Tue', value: 25 },
		{ day: 'Wed', value: 10 },
		{ day: 'Thu', value: 30 },
		{ day: 'Fri', value: 20 },
		{ day: 'Sat', value: 35 },
		{ day: 'Sun', value: 12 },
	];

	const maxValue = Math.max(...weeklyData.map((d) => d.value));

	const subjects = [
		{ name: 'Mathematics', progress: 65, color: '#F59E0B', icon: 'calculator-outline' as const },
		{ name: 'Science', progress: 45, color: '#10B981', icon: 'flask-outline' as const },
		{ name: 'English', progress: 80, color: '#6366F1', icon: 'book-outline' as const },
		{ name: 'General Knowledge', progress: 55, color: '#EC4899', icon: 'globe-outline' as const },
	];

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
				<Animated.View
					entering={FadeInDown.delay(200).duration(400)}
					className="px-6 mb-6"
				>
					<View className="flex-row gap-3 mb-3">
						<StatCard
							value="156"
							label="Total Questions"
							icon="help-circle-outline"
							color="#F59E0B"
						/>
						<StatCard
							value="78%"
							label="Accuracy"
							icon="checkmark-circle-outline"
							color="#10B981"
						/>
					</View>
					<View className="flex-row gap-3">
						<StatCard
							value="12"
							label="Day Streak"
							icon="flame-outline"
							color="#EF4444"
						/>
						<StatCard
							value="4h 32m"
							label="Study Time"
							icon="time-outline"
							color="#6366F1"
						/>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(300).duration(400)}
					className="px-6 mb-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Weekly Activity</Text>
					<View className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
						<View className="flex-row items-end justify-between h-32">
							{
								weeklyData.map((item, index) => {
									const height = (item.value / maxValue) * 100;
									const isToday = index === new Date().getDay() - 1;
									return (
										<View key={item.day} className="items-center flex-1">
											<View
												className={`w-8 rounded-t-lg ${isToday ? 'bg-amber-500' : 'bg-neutral-700'}`}
												style={{ height: `${height}%` }}
											/>
											<Text
												className={`text-xs mt-2 ${isToday ? 'text-amber-500 font-semibold' : 'text-neutral-500'}`}
											>
												{item.day}
											</Text>
										</View>
									);
								})
							}
						</View>
						<View className="flex-row items-center justify-center mt-4 pt-4 border-t border-neutral-800">
							<Ionicons name="trending-up" size={16} color="#10B981" />
							<Text className="text-neutral-400 text-sm ml-2">
								<Text className="text-emerald-500 font-semibold">+15%</Text> from last week
							</Text>
						</View>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(400).duration(400)}
					className="px-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Subject Progress</Text>
					{
						subjects.map((subject) => (
							<SubjectProgress key={subject.name} {...subject} />
						))
					}
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(500).duration(400)}
					className="px-6 mt-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Recent Achievement</Text>
					<View className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-2xl p-5 border border-amber-500/30 flex-row items-center">
						<View className="w-14 h-14 bg-amber-500/30 rounded-full items-center justify-center">
							<Text className="text-3xl">🏆</Text>
						</View>
						<View className="flex-1 ml-4">
							<Text className="text-white font-bold text-lg">Quiz Master</Text>
							<Text className="text-neutral-400 text-sm mt-1">
								Completed 100 quiz questions
							</Text>
						</View>
					</View>
				</Animated.View>
			</ScrollView>
		</View>
	);
}