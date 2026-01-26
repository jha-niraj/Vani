import React, { useState } from 'react';
import {
	View, Text, ScrollView, Pressable, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Question {
	id: string;
	text: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

const sampleQuestions: Question[] = [
	{
		id: '1',
		text: 'What is the capital of Nepal?',
		options: ['Pokhara', 'Kathmandu', 'Biratnagar', 'Lalitpur'],
		correctIndex: 1,
		explanation: 'Kathmandu is the capital and largest city of Nepal.',
	},
	{
		id: '2',
		text: 'Which river is the longest in Nepal?',
		options: ['Koshi', 'Gandaki', 'Karnali', 'Bagmati'],
		correctIndex: 2,
		explanation: 'The Karnali River is the longest river in Nepal at 507 km.',
	},
	{
		id: '3',
		text: 'What is the highest peak in the world?',
		options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'],
		correctIndex: 2,
		explanation: 'Mount Everest at 8,848.86m is the highest peak in the world.',
	},
	{
		id: '4',
		text: 'In which year was Nepal declared a Federal Democratic Republic?',
		options: ['2006', '2007', '2008', '2009'],
		correctIndex: 2,
		explanation: 'Nepal was declared a Federal Democratic Republic on May 28, 2008.',
	},
	{
		id: '5',
		text: 'What is the national animal of Nepal?',
		options: ['Tiger', 'Cow', 'Elephant', 'Rhino'],
		correctIndex: 1,
		explanation: 'The cow is the national animal of Nepal.',
	},
];

export default function QuizScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [isAnswered, setIsAnswered] = useState(false);
	const [score, setScore] = useState(0);
	const [answers, setAnswers] = useState<(number | null)[]>([]);

	const currentQuestion = sampleQuestions[currentIndex];
	const progress = ((currentIndex + 1) / sampleQuestions.length) * 100;

	const handleOptionSelect = (index: number) => {
		if (isAnswered) return;

		setSelectedOption(index);
		setIsAnswered(true);

		const newAnswers = [...answers];
		newAnswers[currentIndex] = index;
		setAnswers(newAnswers);

		if (index === currentQuestion.correctIndex) {
			setScore(score + 1);
		}
	};

	const handleNext = () => {
		if (currentIndex < sampleQuestions.length - 1) {
			setCurrentIndex(currentIndex + 1);
			setSelectedOption(null);
			setIsAnswered(false);
		} else {
			// Quiz finished
			router.replace({
				pathname: '/(practice)/result',
				params: {
					score: score.toString(),
					total: sampleQuestions.length.toString(),
				},
			});
		}
	};

	const handleExit = () => {
		Alert.alert(
			'Exit Quiz',
			'Are you sure you want to exit? Your progress will be lost.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Exit', style: 'destructive', onPress: () => router.back() },
			]
		);
	};

	const getOptionStyle = (index: number) => {
		if (!isAnswered) {
			return selectedOption === index
				? 'border-amber-500 bg-amber-500/10'
				: 'border-neutral-800 bg-neutral-900';
		}

		if (index === currentQuestion.correctIndex) {
			return 'border-emerald-500 bg-emerald-500/10';
		}

		if (selectedOption === index && index !== currentQuestion.correctIndex) {
			return 'border-red-500 bg-red-500/10';
		}

		return 'border-neutral-800 bg-neutral-900 opacity-50';
	};

	const getOptionIcon = (index: number) => {
		if (!isAnswered) return null;

		if (index === currentQuestion.correctIndex) {
			return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
		}

		if (selectedOption === index && index !== currentQuestion.correctIndex) {
			return <Ionicons name="close-circle" size={24} color="#EF4444" />;
		}

		return null;
	};

	return (
		<View
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<View className="flex-row items-center justify-between px-6 py-4">
				<Pressable
					onPress={handleExit}
					className="w-10 h-10 rounded-full bg-neutral-900 items-center justify-center"
				>
					<Ionicons name="close" size={20} color="#a3a3a3" />
				</Pressable>
				<View className="flex-row items-center">
					<Text className="text-white font-semibold">
						{currentIndex + 1}
					</Text>
					<Text className="text-neutral-500">
						/{sampleQuestions.length}
					</Text>
				</View>
				<View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center">
					<Text className="text-amber-500 font-bold">{score}</Text>
				</View>
			</View>
			<View className="mx-6 mb-6">
				<View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
					<Animated.View
						className="h-full bg-amber-500 rounded-full"
						style={{ width: `${progress}%` }}
					/>
				</View>
			</View>
			<ScrollView
				className="flex-1 px-6"
				showsVerticalScrollIndicator={false}
			>
				<Animated.View
					key={currentQuestion.id}
					entering={FadeInRight.duration(300)}
					className="mb-8"
				>
					<Text className="text-white text-xl font-semibold leading-relaxed">
						{currentQuestion.text}
					</Text>
				</Animated.View>

				{
					currentQuestion.options.map((option, index) => (
						<Animated.View
							key={index}
							entering={FadeInDown.delay(100 + index * 50).duration(300)}
						>
							<Pressable
								onPress={() => handleOptionSelect(index)}
								disabled={isAnswered}
								className={`flex-row items-center p-4 mb-3 rounded-2xl border-2 ${getOptionStyle(index)}`}
							>
								<View className="w-8 h-8 rounded-full border-2 border-neutral-600 items-center justify-center mr-4">
									<Text className="text-neutral-400 font-semibold">
										{String.fromCharCode(65 + index)}
									</Text>
								</View>
								<Text className="flex-1 text-white text-base">{option}</Text>
								{getOptionIcon(index)}
							</Pressable>
						</Animated.View>
					))
				}
				{
					isAnswered && (
						<Animated.View
							entering={FadeInDown.delay(300).duration(400)}
							className="mt-4 p-4 bg-neutral-900 rounded-2xl border border-neutral-800"
						>
							<View className="flex-row items-center mb-2">
								<Ionicons name="bulb-outline" size={20} color="#F59E0B" />
								<Text className="text-amber-500 font-semibold ml-2">Explanation</Text>
							</View>
							<Text className="text-neutral-300 leading-relaxed">
								{currentQuestion.explanation}
							</Text>
						</Animated.View>
					)
				}
			</ScrollView>

			{
				isAnswered && (
					<Animated.View
						entering={FadeInDown.duration(300)}
						className="px-6 pb-4"
					>
						<Pressable
							onPress={handleNext}
							className="bg-amber-500 rounded-2xl py-4 items-center active:opacity-80"
						>
							<Text className="text-black font-bold text-lg">
								{currentIndex < sampleQuestions.length - 1 ? 'Next Question' : 'See Results'}
							</Text>
						</Pressable>
					</Animated.View>
				)
			}
		</View>
	);
}