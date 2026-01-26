import React, { useState } from 'react';
import {
	View, Text, ScrollView, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';

interface Exam {
	id: string;
	name: string;
	description: string;
	icon: string;
	levels: string[];
}

const exams: Exam[] = [
	{
		id: 'loksewa',
		name: 'Loksewa',
		description: 'Nepal Public Service Commission exams',
		icon: '🏛️',
		levels: ['Officer Level', 'Assistant Level', 'Non-Gazetted'],
	},
	{
		id: 'tsc',
		name: 'TSC',
		description: 'Teacher Service Commission exams',
		icon: '📚',
		levels: ['Primary', 'Lower Secondary', 'Secondary'],
	},
	{
		id: 'banking',
		name: 'Banking',
		description: 'Bank and financial institution exams',
		icon: '🏦',
		levels: ['Officer', 'Assistant', 'Trainee'],
	},
	{
		id: 'neb',
		name: 'NEB',
		description: 'National Examination Board',
		icon: '🎓',
		levels: ['Class 10 SEE', 'Class 11', 'Class 12'],
	},
];

interface ExamCardProps {
	exam: Exam;
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
				<Text className="text-3xl mr-4">{exam.icon}</Text>
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
	level: string;
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
				{level}
			</Text>
		</Pressable>
	);
}

export default function ExamSelectScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { updateUser, isLoading } = useAuthStore();

	const [selectedExam, setSelectedExam] = useState<string | null>(null);
	const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

	const selectedExamData = exams.find((e) => e.id === selectedExam);

	const handleContinue = () => {
		if (!selectedExam || !selectedLevel) return;

		updateUser({
			selectedExamId: selectedExam,
			selectedLevelId: selectedLevel
		});
		router.replace('/(tabs)');
	};

	const handleExamSelect = (examId: string) => {
		setSelectedExam(examId);
		setSelectedLevel(null); // Reset level when exam changes
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
					{
						exams.map((exam) => (
							<ExamCard
								key={exam.id}
								exam={exam}
								isSelected={selectedExam === exam.id}
								onSelect={() => handleExamSelect(exam.id)}
							/>
						))
					}
				</Animated.View>

				{
					selectedExamData && (
						<Animated.View
							entering={FadeInDown.duration(400)}
							className="mt-6"
						>
							<Text className="text-white text-lg font-semibold mb-4">
								Select Level
							</Text>
							<View className="flex-row flex-wrap">
								{
									selectedExamData.levels.map((level) => (
										<LevelChip
											key={level}
											level={level}
											isSelected={selectedLevel === level}
											onSelect={() => setSelectedLevel(level)}
										/>
									))
								}
							</View>
						</Animated.View>
					)
				}
			</ScrollView>
			<Animated.View
				entering={FadeInUp.delay(500).duration(400)}
				className="px-6 pb-4"
			>
				<Pressable
					onPress={handleContinue}
					disabled={!selectedExam || !selectedLevel || isLoading}
					className={`py-4 rounded-2xl items-center ${selectedExam && selectedLevel
						? 'bg-amber-500 active:opacity-80'
						: 'bg-neutral-800'
						}`}
				>
					<Text
						className={`font-bold text-lg ${selectedExam && selectedLevel ? 'text-black' : 'text-neutral-600'
							}`}
					>
						{isLoading ? 'Setting up...' : 'Get Started'}
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}