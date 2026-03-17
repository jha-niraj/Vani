import React, { useState } from 'react';
import {
	View, Text, ScrollView, Pressable, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubjectProgress } from '@/hooks/use-api';
import { Ionicons } from '@expo/vector-icons';
import type { SubjectProgress } from '@/lib/api';

// Icon mapping for subjects
const subjectIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
	'mathematics': 'calculator-outline',
	'math': 'calculator-outline',
	'science': 'flask-outline',
	'physics': 'flash-outline',
	'chemistry': 'flask-outline',
	'biology': 'leaf-outline',
	'english': 'book-outline',
	'nepali': 'language-outline',
	'gk': 'globe-outline',
	'general knowledge': 'globe-outline',
	'computer': 'laptop-outline',
	'iq': 'bulb-outline',
	'reasoning': 'bulb-outline',
};

const subjectColors: Record<string, string> = {
	'mathematics': '#F59E0B',
	'math': '#F59E0B',
	'science': '#10B981',
	'physics': '#6366F1',
	'chemistry': '#EC4899',
	'biology': '#22C55E',
	'english': '#3B82F6',
	'nepali': '#8B5CF6',
	'gk': '#EF4444',
	'general knowledge': '#EF4444',
	'computer': '#14B8A6',
	'iq': '#F97316',
	'reasoning': '#F97316',
};

function getSubjectIcon(name: string): keyof typeof Ionicons.glyphMap {
	const key = name.toLowerCase();
	return subjectIcons[key] || 'book-outline';
}

function getSubjectColor(name: string): string {
	const key = name.toLowerCase();
	return subjectColors[key] || '#F59E0B';
}

interface SubjectCardProps {
	subject: SubjectProgress;
	onPress: () => void;
}

function SubjectCard({ subject, onPress }: SubjectCardProps) {
	const icon = subject.icon || getSubjectIcon(subject.name);
	const color = subject.color || getSubjectColor(subject.name);
	const progress = subject.completion || 0;

	return (
		<Pressable
			onPress={onPress}
			className="bg-neutral-900 rounded-2xl p-4 mb-4 border border-neutral-800 active:opacity-80"
		>
			<View className="flex-row items-center">
				<View
					className="w-12 h-12 rounded-full items-center justify-center"
					style={{ backgroundColor: `${color}20` }}
				>
					<Ionicons name={icon as any} size={24} color={color} />
				</View>
				<View className="flex-1 ml-4">
					<Text className="text-white text-lg font-semibold">{subject.name}</Text>
					<Text className="text-neutral-500 text-sm mt-1">
						{subject.totalQuestions} questions • {subject.accuracy}% accuracy
					</Text>
				</View>
				<View className="items-end">
					<Text className="text-amber-500 font-bold">{progress}%</Text>
					<Ionicons name="chevron-forward" size={20} color="#737373" />
				</View>
			</View>
			<View className="mt-4 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
				<View
					className="h-full rounded-full"
					style={{ width: `${progress}%`, backgroundColor: color }}
				/>
			</View>
		</Pressable>
	);
}

export default function PracticeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { data: subjects, isLoading, error, refetch } = useSubjectProgress();

	const handleSubjectPress = (subjectId: string) => {
		router.push({
			pathname: '/(practice)/quiz',
			params: { subjectId },
		});
	};

	return (
		<View
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top }}
		>
			<Animated.View
				entering={FadeInDown.delay(100).duration(400)}
				className="px-6 pt-4 pb-4"
			>
				<Text className="text-white text-2xl font-bold">Practice</Text>
				<Text className="text-neutral-400 text-sm mt-1">
					Choose a subject to start practicing
				</Text>
			</Animated.View>
			<Animated.View
				entering={FadeInDown.delay(200).duration(400)}
				className="mx-6 mb-6"
			>
				<Pressable
					onPress={() => router.push('/(practice)/quiz')}
					className="bg-amber-500 rounded-2xl p-5 flex-row items-center justify-between active:opacity-80"
				>
					<View className="flex-1">
						<Text className="text-black text-lg font-bold">Quick Practice</Text>
						<Text className="text-black/70 text-sm mt-1">
							10 random questions from all subjects
						</Text>
					</View>
					<View className="w-12 h-12 bg-black/20 rounded-full items-center justify-center">
						<Ionicons name="flash" size={24} color="#000" />
					</View>
				</Pressable>
			</Animated.View>
			<ScrollView
				className="flex-1 px-6"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
			>
				<Animated.View entering={FadeInDown.delay(300).duration(400)}>
					<Text className="text-white text-lg font-semibold mb-4">By Subject</Text>

					{isLoading ? (
						<View className="items-center py-10">
							<ActivityIndicator color="#F59E0B" size="large" />
							<Text className="text-neutral-400 mt-4">Loading subjects...</Text>
						</View>
					) : error ? (
						<View className="items-center py-10">
							<Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
							<Text className="text-neutral-400 mt-4 text-center">{error}</Text>
							<Pressable
								onPress={refetch}
								className="mt-4 bg-amber-500 px-6 py-3 rounded-xl"
							>
								<Text className="text-black font-semibold">Retry</Text>
							</Pressable>
						</View>
					) : subjects && subjects.length > 0 ? (
						subjects.map((subject) => (
							<SubjectCard
								key={subject.id}
								subject={subject}
								onPress={() => handleSubjectPress(subject.id)}
							/>
						))
					) : (
						<View className="items-center py-10">
							<Ionicons name="book-outline" size={48} color="#737373" />
							<Text className="text-neutral-400 mt-4 text-center">
								No subjects available yet.{'\n'}Please select an exam first.
							</Text>
							<Pressable
								onPress={() => router.push('/(onboarding)/exam-select')}
								className="mt-4 bg-amber-500 px-6 py-3 rounded-xl"
							>
								<Text className="text-black font-semibold">Select Exam</Text>
							</Pressable>
						</View>
					)}
				</Animated.View>
			</ScrollView>
		</View>
	);
}