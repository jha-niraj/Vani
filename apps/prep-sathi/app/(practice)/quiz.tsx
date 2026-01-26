/**
 * Quiz Screen
 * 
 * Interactive quiz with question display and answer selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
	View, Text, StyleSheet, BackHandler, Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
	FadeIn, FadeInRight, SlideInRight, SlideOutLeft
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { api, Question, QuizSession } from '@/lib/api';
import { 
	Screen, Button, QuizOption, ProgressBar, Loading, Card 
} from '@/components/ui';
import {
	Typography, Spacing, Colors
} from '@/constants/theme';

type AnswerState = 'unanswered' | 'selected' | 'revealed';

interface QuestionState {
	selectedAnswer: string | null;
	isCorrect: boolean | null;
	correctAnswer: string | null;
	timeSpent: number;
}

export default function QuizScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams<{
		type?: string;
		subjectId?: string;
		topicId?: string;
	}>();

	const [session, setSession] = useState<QuizSession | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
	const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [startTime, setStartTime] = useState<number>(Date.now());

	// Initialize quiz session
	useEffect(() => {
		async function initQuiz() {
			try {
				// Start session
				const sessionData = await api.practice.startSession({
					quizType: params.type || 'QUICK',
					subjectId: params.subjectId,
					topicId: params.topicId,
					questionCount: 10,
				});
				setSession(sessionData);

				// Get questions
				const questionsData = await api.practice.getQuestions(sessionData.id);
				setQuestions(questionsData);
				setQuestionStates(questionsData.map(() => ({
					selectedAnswer: null,
					isCorrect: null,
					correctAnswer: null,
					timeSpent: 0,
				})));
			} catch {
				// Use mock questions for demo
				setQuestions([
					{
						id: '1',
						questionNumber: 1,
						text: 'What is the capital of Nepal?',
						options: [
							{ key: 'A', text: 'Pokhara' },
							{ key: 'B', text: 'Kathmandu' },
							{ key: 'C', text: 'Biratnagar' },
							{ key: 'D', text: 'Lalitpur' },
						],
						difficulty: 'EASY',
					},
					{
						id: '2',
						questionNumber: 2,
						text: 'Which is the highest mountain in the world?',
						options: [
							{ key: 'A', text: 'K2' },
							{ key: 'B', text: 'Kanchenjunga' },
							{ key: 'C', text: 'Mount Everest' },
							{ key: 'D', text: 'Makalu' },
						],
						difficulty: 'EASY',
					},
					{
						id: '3',
						questionNumber: 3,
						text: 'Who is known as the Father of Nepali Literature?',
						options: [
							{ key: 'A', text: 'Laxmi Prasad Devkota' },
							{ key: 'B', text: 'Bhanubhakta Acharya' },
							{ key: 'C', text: 'Motiram Bhatta' },
							{ key: 'D', text: 'Parijat' },
						],
						difficulty: 'MEDIUM',
					},
				]);
				setQuestionStates(Array(3).fill(null).map(() => ({
					selectedAnswer: null,
					isCorrect: null,
					correctAnswer: null,
					timeSpent: 0,
				})));
				setSession({ id: 'mock', quizType: 'QUICK', questionCount: 3, timeLimit: null, status: 'IN_PROGRESS', startedAt: new Date().toISOString() });
			}
			setIsLoading(false);
			setStartTime(Date.now());
		}
		initQuiz();
	}, [params.type, params.subjectId, params.topicId]);

	const currentQuestion = questions[currentIndex];
	const progress = ((currentIndex + 1) / questions.length) * 100;

	const handleExit = useCallback(() => {
		Alert.alert(
			'Exit Quiz',
			'Are you sure you want to exit? Your progress will be lost.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Exit', style: 'destructive', onPress: () => router.back() },
			]
		);
	}, [router]);

	// Handle back button
	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			handleExit();
			return true;
		});
		return () => backHandler.remove();
	}, [handleExit]);

	const handleSelectAnswer = async (key: string) => {
		if (answerState !== 'unanswered') return;

		const timeSpent = Math.floor((Date.now() - startTime) / 1000);
		setAnswerState('selected');

		// Update state optimistically
		const newStates = [...questionStates];
		newStates[currentIndex] = {
			...newStates[currentIndex],
			selectedAnswer: key,
			timeSpent,
		};
		setQuestionStates(newStates);

		// Submit answer
		setIsSubmitting(true);
		try {
			const result = await api.practice.submitAnswer({
				sessionId: session?.id || 'mock',
				questionId: currentQuestion.id,
				answer: key,
				timeSpent,
			});

			newStates[currentIndex] = {
				selectedAnswer: key,
				isCorrect: result.isCorrect,
				correctAnswer: result.correctAnswer,
				timeSpent,
			};
			setQuestionStates(newStates);
		} catch {
			// Mock response
			const mockCorrect = { '1': 'B', '2': 'C', '3': 'B' }[currentQuestion.id] || 'B';
			newStates[currentIndex] = {
				selectedAnswer: key,
				isCorrect: key === mockCorrect,
				correctAnswer: mockCorrect,
				timeSpent,
			};
			setQuestionStates(newStates);
		}

		setIsSubmitting(false);
		setAnswerState('revealed');
	};

	const handleNext = () => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex(currentIndex + 1);
			setAnswerState('unanswered');
			setStartTime(Date.now());
		} else {
			// Quiz complete - navigate to results
			const correct = questionStates.filter(s => s.isCorrect).length;
			const wrong = questionStates.filter(s => s.isCorrect === false).length;
			const skipped = questionStates.filter(s => s.selectedAnswer === null).length;

			router.replace({
				pathname: '/(practice)/result',
				params: {
					sessionId: session?.id || 'mock',
					total: questions.length.toString(),
					correct: correct.toString(),
					wrong: wrong.toString(),
					skipped: skipped.toString(),
				},
			});
		}
	};

	const getOptionState = (key: string) => {
		const state = questionStates[currentIndex];
		if (answerState === 'unanswered') return 'default';
		if (answerState === 'selected' && state.selectedAnswer === key) return 'selected';
		if (answerState === 'revealed') {
			if (key === state.correctAnswer) return 'correct';
			if (key === state.selectedAnswer && !state.isCorrect) return 'incorrect';
		}
		return 'default';
	};

	if (isLoading) {
		return <Loading fullScreen message="Preparing quiz..." />;
	}

	if (!currentQuestion) {
		return <Loading fullScreen message="Loading question..." />;
	}

	return (
		<Screen safeTop padding>
			{/* Header */}
			<View style={styles.header}>
				<Button variant="ghost" onPress={handleExit}>
					✕
				</Button>
				<View style={styles.progressContainer}>
					<ProgressBar progress={progress} height={6} />
					<Text style={[styles.progressText, { color: colors.textSecondary }]}>
						{currentIndex + 1} / {questions.length}
					</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Question */}
			<Animated.View
				key={currentQuestion.id}
				entering={SlideInRight.duration(300)}
				exiting={SlideOutLeft.duration(300)}
				style={styles.questionContainer}
			>
				<View style={styles.difficultyBadge}>
					<Text style={[styles.difficulty, {
						color: currentQuestion.difficulty === 'EASY'
							? Colors.semantic.success
							: currentQuestion.difficulty === 'HARD'
								? Colors.semantic.error
								: Colors.semantic.warning
					}]}>
						{currentQuestion.difficulty}
					</Text>
				</View>

				<Text style={[styles.questionText, { color: colors.text }]}>
					{currentQuestion.text}
				</Text>
			</Animated.View>

			{/* Options */}
			<View style={styles.optionsContainer}>
				{currentQuestion.options.map((option, index) => (
					<Animated.View
						key={option.key}
						entering={FadeInRight.delay(index * 100).duration(300)}
					>
						<QuizOption
							label={option.key}
							text={option.text}
							state={getOptionState(option.key)}
							disabled={answerState !== 'unanswered' || isSubmitting}
							onPress={() => handleSelectAnswer(option.key)}
						/>
					</Animated.View>
				))}
			</View>

			{/* Explanation (if revealed and has explanation) */}
			{answerState === 'revealed' && questionStates[currentIndex]?.correctAnswer && (
				<Animated.View entering={FadeIn.duration(300)}>
					<Card variant="filled" style={styles.explanationCard}>
						<Text style={[styles.explanationTitle, { color: colors.text }]}>
							{questionStates[currentIndex].isCorrect ? '✓ Correct!' : '✗ Incorrect'}
						</Text>
						<Text style={[styles.explanationText, { color: colors.textSecondary }]}>
							The correct answer is {questionStates[currentIndex].correctAnswer}.
						</Text>
					</Card>
				</Animated.View>
			)}

			{/* Next Button */}
			<View style={styles.footer}>
				{answerState === 'revealed' && (
					<Button
						variant="primary"
						size="lg"
						fullWidth
						onPress={handleNext}
					>
						{currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
					</Button>
				)}
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: Spacing.xl,
	},
	progressContainer: {
		flex: 1,
		marginHorizontal: Spacing.md,
	},
	progressText: {
		...Typography.caption,
		textAlign: 'center',
		marginTop: Spacing.xs,
	},
	questionContainer: {
		marginBottom: Spacing.xl,
	},
	difficultyBadge: {
		marginBottom: Spacing.sm,
	},
	difficulty: {
		...Typography.overline,
	},
	questionText: {
		...Typography.h4,
		lineHeight: 28,
	},
	optionsContainer: {
		flex: 1,
	},
	explanationCard: {
		marginTop: Spacing.md,
	},
	explanationTitle: {
		...Typography.bodyMedium,
		marginBottom: Spacing.xs,
	},
	explanationText: {
		...Typography.body,
	},
	footer: {
		paddingTop: Spacing.md,
		paddingBottom: Spacing.xl,
	},
});
