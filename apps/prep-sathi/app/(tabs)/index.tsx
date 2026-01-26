import React from 'react';
import {
	View, Text, ScrollView, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
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
}

function StatCard({ value, label, icon }: StatCardProps) {
	return (
		<View className="flex-1 bg-neutral-900 rounded-xl p-4 border border-neutral-800">
			<View className="flex-row items-center justify-between mb-2">
				<Text className="text-amber-500 text-2xl font-bold">{value}</Text>
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

	const greeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
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
					className="px-6 pt-4 pb-6"
				>
					<Text className="text-neutral-400 text-base">{greeting()}</Text>
					<Text className="text-white text-2xl font-bold mt-1">
						{user?.username || 'Student'}
					</Text>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(200).duration(400)}
					className="mx-6 mb-6"
				>
					<View className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-2xl p-5 border border-amber-500/30">
						<View className="flex-row items-center justify-between mb-4">
							<View>
								<Text className="text-white text-lg font-semibold">Daily Goal</Text>
								<Text className="text-neutral-400 text-sm mt-1">
									5 of 10 questions completed
								</Text>
							</View>
							<View className="bg-amber-500 px-3 py-1 rounded-full">
								<Text className="text-black text-sm font-semibold">50%</Text>
							</View>
						</View>
						<View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
							<View className="h-full w-1/2 bg-amber-500 rounded-full" />
						</View>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(300).duration(400)}
					className="px-6 mb-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Your Stats</Text>
					<View className="flex-row gap-3">
						<StatCard value="156" label="Questions Done" icon="checkmark-circle-outline" />
						<StatCard value="78%" label="Accuracy" icon="analytics-outline" />
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
							title="Continue"
							subtitle="Resume learning"
							color="#10B981"
							onPress={() => router.push('/(tabs)/practice')}
						/>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(500).duration(400)}
					className="px-6"
				>
					<Text className="text-white text-lg font-semibold mb-4">Recent Activity</Text>

					{
						[
							{ title: 'Science Quiz', score: '8/10', time: '2 hours ago', icon: 'flask-outline' },
							{ title: 'Math Practice', score: '15/20', time: 'Yesterday', icon: 'calculator-outline' },
							{ title: 'English Grammar', score: '12/15', time: '2 days ago', icon: 'book-outline' },
						].map((activity, index) => (
							<View
								key={index}
								className="flex-row items-center bg-neutral-900 rounded-xl p-4 mb-3 border border-neutral-800"
							>
								<View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center">
									<Ionicons name={activity.icon as any} size={20} color="#F59E0B" />
								</View>
								<View className="flex-1 ml-4">
									<Text className="text-white font-medium">{activity.title}</Text>
									<Text className="text-neutral-500 text-sm">{activity.time}</Text>
								</View>
								<View className="bg-neutral-800 px-3 py-1 rounded-full">
									<Text className="text-amber-500 font-semibold">{activity.score}</Text>
								</View>
							</View>
						))
					}
				</Animated.View>
			</ScrollView>
		</View>
	);
}