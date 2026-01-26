import React, { useState, useEffect } from 'react';
import {
	View, Text, ScrollView, Pressable, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import type { Question, SubmitAnswerResult } from '@/lib/api';

export default function QuizScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams<{ subjectId?: string; topicId?: string }>();

	const [questions, setQuestions] = useState<Question[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [isAnswered, setIsAnswered] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<SubmitAnswerResult | null>(null);
	const [score, setScore] = useState(0);
	const [answers, setAnswers] = useState<Array<{ questionId: string; selected: string | null; correct: boolean }>>([]);

	// Fetch questions on mount
	useEffect(() => {
		async function fetchQuestions() {
			setIsLoading(true);
			setError(null);
			try {
				const data = await api.practice.getQuestions({
					subjectId: params.subjectId,
					topicId: params.topicId,
					limit: 10,
				});
				if (data.questions.length === 0) {
					setError('No questions available for this selection.');
				} else {
					setQuestions(data.questions);
				}
			} catch (err: any) {
				setError(err.message || 'Failed to load questions');
			} finally {
				setIsLoading(false);
			}
		}
		fetchQuestions();
	}, [params.subjectId, params.topicId]);

	const currentQuestion = questions[currentIndex];
	const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

	const handleOptionSelect = async (optionKey: string) => {
		if (isAnswered || isSubmitting) return;

		setSelectedOption(optionKey);
		setIsSubmitting(true);

		try {
			const submitResult = await api.practice.submitAnswer({
				questionId: currentQuestion.id,
				selectedAnswer: optionKey,
			});
			setResult(submitResult);
			setIsAnswered(true);

			const newAnswers = [...answers];
			newAnswers[currentIndex] = {
				questionId: currentQuestion.id,
				selected: optionKey,
				correct: submitResult.isCorrect,
			};
			setAnswers(newAnswers);

			if (submitResult.isCorrect) {
				setScore(score + 1);
			}
		} catch (err: any) {
			Alert.alert('Error', err.message || 'Failed to submit answer');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleNext = () => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex(currentIndex + 1);
			setSelectedOption(null);
			setIsAnswered(false);
			setResult(null);
		} else {
			// Quiz finished
			router.replace({
				pathname: '/(practice)/result',
				params: {
					score: score.toString(),
					total: questions.length.toString(),
				},
			});
		}
	};

	const handleExit = () => {
		Alert.alert(
			'Exit Quiz',
			'Are you sure you want to exit? Your progress will be saved.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Exit', style: 'destructive', onPress: () => router.back() },
			]
		);
	};

	const getOptionStyle = (optionKey: string) => {
		if (!isAnswered) {
			return selectedOption === optionKey
				? 'border-amber-500 bg-amber-500/10'
				: 'border-neutral-800 bg-neutral-900';
		}

		if (optionKey === result?.correctAnswer) {
			return 'border-emerald-500 bg-emerald-500/10';
		}

		if (selectedOption === optionKey && optionKey !== result?.correctAnswer) {
			return 'border-red-500 bg-red-500/10';
		}

		return 'border-neutral-800 bg-neutral-900 opacity-50';
	};

	const getOptionIcon = (optionKey: string) => {
		if (!isAnswered) return null;

		if (optionKey === result?.correctAnswer) {
			return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
		}

		if (selectedOption === optionKey && optionKey !== result?.correctAnswer) {
			return <Ionicons name="close-circle" size={24} color="#EF4444" />;
		}

		return null;
	};

	// Loading state
	if (isLoading) {
		return (
			<View className="flex-1 bg-neutral-950 items-center justify-center" style={{ paddingTop: insets.top }}>
				<ActivityIndicator color="#F59E0B" size="large" />
				<Text className="text-neutral-400 mt-4">Loading questions...</Text>
			</View>
		);
	}

	// Error state
	if (error || questions.length === 0) {
		return (
			<View className="flex-1 bg-neutral-950 items-center justify-center px-6" style={{ paddingTop: insets.top }}>
				<Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
				<Text className="text-white text-xl font-semibold mt-4 text-center">
					{error || 'No questions available'}
				</Text>
				<Text className="text-neutral-400 mt-2 text-center">
					Please try a different subject or topic.
				</Text>
				<Pressable
					onPress={() => router.back()}
					className="mt-6 bg-amber-500 px-8 py-4 rounded-2xl"
				>
					<Text className="text-black font-bold text-lg">Go Back</Text>
				</Pressable>
			</View>
		);
	}

	const options = Object.entries(currentQuestion.options);

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
						/{questions.length}
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
					{
						currentQuestion.subject && (
							<Text className="text-amber-500 text-sm font-medium mb-2">
								{currentQuestion.subject.name}
								{currentQuestion.topic && ` • ${currentQuestion.topic.name}`}
							</Text>
						)
					}
					<Text className="text-white text-xl font-semibold leading-relaxed">
						{currentQuestion.question}
					</Text>
				</Animated.View>

				{
					options.map(([key, value], index) => (
						<Animated.View
							key={key}
							entering={FadeInDown.delay(100 + index * 50).duration(300)}
						>
							<Pressable
								onPress={() => handleOptionSelect(key)}
								disabled={isAnswered || isSubmitting}
								className={`flex-row items-center p-4 mb-3 rounded-2xl border-2 ${getOptionStyle(key)}`}
							>
								<View className="w-8 h-8 rounded-full border-2 border-neutral-600 items-center justify-center mr-4">
									<Text className="text-neutral-400 font-semibold">
										{key.toUpperCase()}
									</Text>
								</View>
								<Text className="flex-1 text-white text-base">{value}</Text>
								{
									isSubmitting && selectedOption === key ? (
										<ActivityIndicator size="small" color="#F59E0B" />
									) : (
										getOptionIcon(key)
									)
								}
							</Pressable>
						</Animated.View>
					))
				}

				{
					isAnswered && result && (
						<Animated.View
							entering={FadeInDown.delay(300).duration(400)}
							className="mt-4 p-4 bg-neutral-900 rounded-2xl border border-neutral-800"
						>
							<View className="flex-row items-center mb-2">
								<Ionicons name="bulb-outline" size={20} color="#F59E0B" />
								<Text className="text-amber-500 font-semibold ml-2">Explanation</Text>
							</View>
							<Text className="text-neutral-300 leading-relaxed">
								{result.explanation || 'No explanation available for this question.'}
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
								{currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
							</Text>
						</Pressable>
					</Animated.View>
				)
			}
		</View>
	);
}