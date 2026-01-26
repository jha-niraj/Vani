/**
 * Practice Screen
 * 
 * Shows subjects and topics for practice selection.
 */

import React, { useEffect, useState } from 'react';
import {
	View, Text, StyleSheet, FlatList, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
	FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { api, Subject, Topic } from '@/lib/api';
import {
	Screen, Header, Loading
} from '@/components/ui';
import {
	Typography, Spacing, Colors, BorderRadius, Shadows, Animation
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PracticeScreen() {
	const { colors } = useTheme();
	const router = useRouter();

	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingTopics, setIsLoadingTopics] = useState(false);

	useEffect(() => {
		async function fetchSubjects() {
			try {
				// For now, using a placeholder level ID
				// In real app, get from user's selected exam
				const data = await api.exam.getSubjects('placeholder-level-id');
				setSubjects(data);
			} catch {
				// Use mock data for demo
				setSubjects([
					{ id: '1', name: 'General Knowledge', slug: 'gk', description: 'Current affairs & GK', icon: '🌍', order: 1, questionCount: 150 },
					{ id: '2', name: 'Nepali', slug: 'nepali', description: 'Language & grammar', icon: '📝', order: 2, questionCount: 100 },
					{ id: '3', name: 'English', slug: 'english', description: 'Language skills', icon: '🔤', order: 3, questionCount: 120 },
					{ id: '4', name: 'Mathematics', slug: 'math', description: 'Numbers & reasoning', icon: '🔢', order: 4, questionCount: 80 },
					{ id: '5', name: 'Reasoning', slug: 'reasoning', description: 'Logic & aptitude', icon: '🧩', order: 5, questionCount: 90 },
					{ id: '6', name: 'Computer', slug: 'computer', description: 'IT fundamentals', icon: '💻', order: 6, questionCount: 60 },
				]);
			}
			setIsLoading(false);
		}
		fetchSubjects();
	}, []);

	const handleSubjectPress = async (subject: Subject) => {
		if (selectedSubject?.id === subject.id) {
			setSelectedSubject(null);
			setTopics([]);
			return;
		}

		setSelectedSubject(subject);
		setIsLoadingTopics(true);

		try {
			const data = await api.exam.getTopics(subject.id);
			setTopics(data);
		} catch {
			// Use mock topics
			setTopics([
				{ id: '1', name: 'Topic 1', slug: 't1', description: '', order: 1, questionCount: 30 },
				{ id: '2', name: 'Topic 2', slug: 't2', description: '', order: 2, questionCount: 25 },
				{ id: '3', name: 'Topic 3', slug: 't3', description: '', order: 3, questionCount: 20 },
			]);
		}
		setIsLoadingTopics(false);
	};

	const handleTopicPress = (topic: Topic) => {
		router.push(`/(practice)/quiz?subjectId=${selectedSubject?.id}&topicId=${topic.id}`);
	};

	const handleSubjectQuiz = (subject: Subject) => {
		router.push(`/(practice)/quiz?subjectId=${subject.id}&type=SUBJECT`);
	};

	if (isLoading) {
		return <Loading fullScreen message="Loading subjects..." />;
	}

	return (
		<Screen safeTop>
			<Header title="Practice" />

			<FlatList
				data={subjects}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				renderItem={({ item, index }) => (
					<SubjectCard
						subject={item}
						isExpanded={selectedSubject?.id === item.id}
						topics={selectedSubject?.id === item.id ? topics : []}
						isLoadingTopics={selectedSubject?.id === item.id && isLoadingTopics}
						onPress={() => handleSubjectPress(item)}
						onTopicPress={handleTopicPress}
						onQuizAll={() => handleSubjectQuiz(item)}
						delay={index * 50}
					/>
				)}
				ListEmptyComponent={
					<View style={styles.empty}>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No subjects available
						</Text>
					</View>
				}
			/>
		</Screen>
	);
}

interface SubjectCardProps {
	subject: Subject;
	isExpanded: boolean;
	topics: Topic[];
	isLoadingTopics: boolean;
	onPress: () => void;
	onTopicPress: (topic: Topic) => void;
	onQuizAll: () => void;
	delay: number;
}

function SubjectCard({
	subject,
	isExpanded,
	topics,
	isLoadingTopics,
	onPress,
	onTopicPress,
	onQuizAll,
	delay,
}: SubjectCardProps) {
	const { colors } = useTheme();
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<Animated.View entering={FadeInDown.delay(delay).duration(400)}>
			<AnimatedPressable
				onPress={onPress}
				onPressIn={() => {
					scale.value = withSpring(0.98, Animation.spring.stiff);
				}}
				onPressOut={() => {
					scale.value = withSpring(1, Animation.spring.default);
				}}
				style={[
					styles.subjectCard,
					{
						backgroundColor: colors.card,
						borderColor: isExpanded ? Colors.brand.primary : colors.border,
					},
					Shadows.sm,
					animatedStyle,
				]}
			>
				<View style={styles.subjectHeader}>
					<Text style={styles.subjectIcon}>{subject.icon || '📚'}</Text>
					<View style={styles.subjectInfo}>
						<Text style={[styles.subjectName, { color: colors.text }]}>
							{subject.name}
						</Text>
						<Text style={[styles.subjectDesc, { color: colors.textSecondary }]}>
							{subject.questionCount} questions
						</Text>
					</View>
					<Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
						{isExpanded ? '▲' : '▼'}
					</Text>
				</View>

				{
					isExpanded && (
						<Animated.View
							entering={FadeInDown.duration(300)}
							style={styles.topicsContainer}
						>
							{
								isLoadingTopics ? (
									<Loading size="small" />
								) : (
									<>
										<Pressable
											onPress={onQuizAll}
											style={[styles.quizAllButton, { backgroundColor: `${Colors.brand.primary}10` }]}
										>
											<Text style={[styles.quizAllText, { color: Colors.brand.primary }]}>
												📝 Practice All {subject.name}
											</Text>
										</Pressable>

										{
											topics.map((topic, idx) => (
												<Animated.View
													key={topic.id}
													entering={FadeInRight.delay(idx * 50).duration(300)}
												>
													<Pressable
														onPress={() => onTopicPress(topic)}
														style={[styles.topicItem, { borderBottomColor: colors.divider }]}
													>
														<View style={styles.topicInfo}>
															<Text style={[styles.topicName, { color: colors.text }]}>
																{topic.name}
															</Text>
															<Text style={[styles.topicCount, { color: colors.textTertiary }]}>
																{topic.questionCount} questions
															</Text>
														</View>
														<Text style={{ color: colors.textSecondary }}>→</Text>
													</Pressable>
												</Animated.View>
											))
										}
									</>
								)
							}
						</Animated.View>
					)
				}
			</AnimatedPressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	list: {
		padding: Spacing.base,
		gap: Spacing.md,
	},
	subjectCard: {
		borderRadius: BorderRadius.lg,
		borderWidth: 2,
		overflow: 'hidden',
	},
	subjectHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: Spacing.base,
	},
	subjectIcon: {
		fontSize: 28,
		marginRight: Spacing.md,
	},
	subjectInfo: {
		flex: 1,
	},
	subjectName: {
		...Typography.bodyMedium,
		marginBottom: 2,
	},
	subjectDesc: {
		...Typography.caption,
	},
	expandIcon: {
		fontSize: 12,
	},
	topicsContainer: {
		borderTopWidth: 1,
		borderTopColor: Colors.neutral.gray200,
		paddingHorizontal: Spacing.base,
		paddingBottom: Spacing.sm,
	},
	quizAllButton: {
		padding: Spacing.md,
		borderRadius: BorderRadius.md,
		marginVertical: Spacing.sm,
		alignItems: 'center',
	},
	quizAllText: {
		...Typography.bodyMedium,
	},
	topicItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: Spacing.md,
		borderBottomWidth: 1,
	},
	topicInfo: {},
	topicName: {
		...Typography.body,
		marginBottom: 2,
	},
	topicCount: {
		...Typography.caption,
	},
	empty: {
		alignItems: 'center',
		paddingVertical: Spacing['3xl'],
	},
	emptyText: {
		...Typography.body,
	},
});