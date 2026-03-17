import React, { useState } from 'react';
import {
	View, Text, ScrollView, Pressable, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { useExamTypes, useExamLevels } from '@/hooks/use-api';
import { api, type ExamType, type ExamLevel } from '@/lib/api';

// Default icons for exam types
const examIcons: Record<string, string> = {
	'loksewa': '�️',
	'tsc': '📚',
	'banking': '🏦',
	'neb': '🎓',
};

function getExamIcon(name: string): string {
	const key = name.toLowerCase();
	return examIcons[key] || '📝';
}

interface ExamCardProps {
	exam: ExamType;
	isSelected: boolean;
	onSelect: () => void;
}

function ExamCard({ exam, isSelected, onSelect }: ExamCardProps) {
	return (
		<Pressable
			onPress={onSelect}
			className={`p-5 rounded-2xl mb-3 border-2 active:opacity-80 ${isSelected
				? 'bg-amber-500/10 border-amber-500'
				: 'bg-neutral-900 border-neutral-800'
				}`}
		>
			<View className="flex-row items-center">
				<Text className="text-3xl mr-4">{exam.icon || getExamIcon(exam.name)}</Text>
				<View className="flex-1">
					<Text className="text-white text-lg font-semibold">{exam.name}</Text>
					<Text className="text-neutral-400 text-sm mt-1">{exam.description}</Text>
				</View>
				{
					isSelected && (
						<Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
					)
				}
			</View>
		</Pressable>
	);
}

interface LevelChipProps {
	level: ExamLevel;
	isSelected: boolean;
	onSelect: () => void;
}

function LevelChip({ level, isSelected, onSelect }: LevelChipProps) {
	return (
		<Pressable
			onPress={onSelect}
			className={`px-5 py-3 rounded-xl mr-3 mb-3 border-2 active:opacity-80 ${isSelected
				? 'bg-amber-500 border-amber-500'
				: 'bg-neutral-900 border-neutral-800'
				}`}
		>
			<Text
				className={`font-medium ${isSelected ? 'text-black' : 'text-white'}`}
			>
				{level.name}
			</Text>
		</Pressable>
	);
}

export default function ExamSelectScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { updateUser } = useAuthStore();

	const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
	const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch exam types and levels from API
	const { data: examTypes, isLoading: examTypesLoading, error: examTypesError } = useExamTypes();
	const { data: examLevels, isLoading: levelsLoading } = useExamLevels(selectedExamId);

	const handleContinue = async () => {
		if (!selectedExamId || !selectedLevelId) return;

		setIsSubmitting(true);
		try {
			// Call the API to set the user's selected exam
			await api.user.selectExam(selectedExamId, selectedLevelId);
			
			// Update local auth store with the updated user info
			const selectedExamType = examTypes?.find(e => e.id === selectedExamId);
			const selectedLevel = examLevels?.find(l => l.id === selectedLevelId);
			
			updateUser({
				currentExam: {
					type: selectedExamType ? { id: selectedExamType.id, name: selectedExamType.name, nameNp: null } : null,
					level: selectedLevel ? { id: selectedLevel.id, name: selectedLevel.name, nameNp: null } : null,
				},
				onboardingComplete: true
			});
			router.replace('/(tabs)');
		} catch (error) {
			console.error('Failed to select exam:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleExamSelect = (examId: string) => {
		setSelectedExamId(examId);
		setSelectedLevelId(null); // Reset level when exam changes
	};

	return (
		<View
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<ScrollView
				className="flex-1 px-6"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				<Animated.View
					entering={FadeInDown.delay(100).duration(400)}
					className="flex-row gap-2 mt-4 mb-8"
				>
					<View className="flex-1 h-1 bg-amber-500 rounded-full" />
					<View className="flex-1 h-1 bg-amber-500 rounded-full" />
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(200).duration(400)}
					className="w-20 h-20 bg-amber-500/20 rounded-full items-center justify-center mb-8"
				>
					<Ionicons name="school-outline" size={40} color="#F59E0B" />
				</Animated.View>
				<Animated.View entering={FadeInDown.delay(300).duration(400)}>
					<Text className="text-white text-3xl font-bold mb-2">
						Select your exam
					</Text>
					<Text className="text-neutral-400 text-base leading-relaxed">
						Choose the exam you're preparing for to get personalized content.
					</Text>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(400).duration(400)}
					className="mt-8"
				>
					<Text className="text-white text-lg font-semibold mb-4">Exam Type</Text>
					{examTypesLoading ? (
						<View className="items-center py-8">
							<ActivityIndicator color="#F59E0B" size="large" />
							<Text className="text-neutral-400 mt-4">Loading exams...</Text>
						</View>
					) : examTypesError ? (
						<View className="items-center py-8">
							<Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
							<Text className="text-red-400 mt-4">{examTypesError}</Text>
						</View>
					) : examTypes && examTypes.length > 0 ? (
						examTypes.map((exam) => (
							<ExamCard
								key={exam.id}
								exam={exam}
								isSelected={selectedExamId === exam.id}
								onSelect={() => handleExamSelect(exam.id)}
							/>
						))
					) : (
						<View className="items-center py-8">
							<Text className="text-neutral-400">No exams available</Text>
						</View>
					)}
				</Animated.View>

				{selectedExamId && (
					<Animated.View
						entering={FadeInDown.duration(400)}
						className="mt-6"
					>
						<Text className="text-white text-lg font-semibold mb-4">
							Select Level
						</Text>
						{levelsLoading ? (
							<View className="items-center py-4">
								<ActivityIndicator color="#F59E0B" />
							</View>
						) : examLevels && examLevels.length > 0 ? (
							<View className="flex-row flex-wrap">
								{examLevels.map((level) => (
									<LevelChip
										key={level.id}
										level={level}
										isSelected={selectedLevelId === level.id}
										onSelect={() => setSelectedLevelId(level.id)}
									/>
								))}
							</View>
						) : (
							<Text className="text-neutral-400">No levels available</Text>
						)}
					</Animated.View>
				)}
			</ScrollView>
			<Animated.View
				entering={FadeInUp.delay(500).duration(400)}
				className="px-6 pb-4"
			>
				<Pressable
					onPress={handleContinue}
					disabled={!selectedExamId || !selectedLevelId || isSubmitting}
					className={`py-4 rounded-2xl items-center ${selectedExamId && selectedLevelId
						? 'bg-amber-500 active:opacity-80'
						: 'bg-neutral-800'
						}`}
				>
					<Text
						className={`font-bold text-lg ${selectedExamId && selectedLevelId ? 'text-black' : 'text-neutral-600'
							}`}
					>
						{isSubmitting ? 'Setting up...' : 'Get Started'}
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}