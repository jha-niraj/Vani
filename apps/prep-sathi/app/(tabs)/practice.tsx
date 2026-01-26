import React, { useState } from 'react';
import {
	View, Text, ScrollView, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Topic {
	id: string;
	name: string;
	questionCount: number;
	completed: number;
}

interface Subject {
	id: string;
	name: string;
	icon: keyof typeof Ionicons.glyphMap;
	color: string;
	topics: Topic[];
}

const subjects: Subject[] = [
	{
		id: '1',
		name: 'Mathematics',
		icon: 'calculator-outline',
		color: '#F59E0B',
		topics: [
			{ id: '1-1', name: 'Algebra', questionCount: 50, completed: 25 },
			{ id: '1-2', name: 'Geometry', questionCount: 40, completed: 10 },
			{ id: '1-3', name: 'Arithmetic', questionCount: 60, completed: 45 },
			{ id: '1-4', name: 'Statistics', questionCount: 30, completed: 0 },
		],
	},
	{
		id: '2',
		name: 'Science',
		icon: 'flask-outline',
		color: '#10B981',
		topics: [
			{ id: '2-1', name: 'Physics', questionCount: 45, completed: 20 },
			{ id: '2-2', name: 'Chemistry', questionCount: 40, completed: 15 },
			{ id: '2-3', name: 'Biology', questionCount: 50, completed: 30 },
		],
	},
	{
		id: '3',
		name: 'English',
		icon: 'book-outline',
		color: '#6366F1',
		topics: [
			{ id: '3-1', name: 'Grammar', questionCount: 40, completed: 35 },
			{ id: '3-2', name: 'Vocabulary', questionCount: 50, completed: 20 },
			{ id: '3-3', name: 'Comprehension', questionCount: 30, completed: 10 },
		],
	},
	{
		id: '4',
		name: 'General Knowledge',
		icon: 'globe-outline',
		color: '#EC4899',
		topics: [
			{ id: '4-1', name: 'Current Affairs', questionCount: 60, completed: 40 },
			{ id: '4-2', name: 'History', questionCount: 40, completed: 15 },
			{ id: '4-3', name: 'Geography', questionCount: 35, completed: 20 },
		],
	},
];

interface SubjectCardProps {
	subject: Subject;
	isExpanded: boolean;
	onToggle: () => void;
	onTopicPress: (topicId: string) => void;
}

function SubjectCard({ subject, isExpanded, onToggle, onTopicPress }: SubjectCardProps) {
	const totalQuestions = subject.topics.reduce((sum, t) => sum + t.questionCount, 0);
	const completedQuestions = subject.topics.reduce((sum, t) => sum + t.completed, 0);
	const progress = Math.round((completedQuestions / totalQuestions) * 100);

	return (
		<View className="mb-4">
			<Pressable
				onPress={onToggle}
				className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 active:opacity-80"
			>
				<View className="flex-row items-center">
					<View
						className="w-12 h-12 rounded-full items-center justify-center"
						style={{ backgroundColor: `${subject.color}20` }}
					>
						<Ionicons name={subject.icon} size={24} color={subject.color} />
					</View>
					<View className="flex-1 ml-4">
						<Text className="text-white text-lg font-semibold">{subject.name}</Text>
						<Text className="text-neutral-500 text-sm mt-1">
							{subject.topics.length} topics • {progress}% complete
						</Text>
					</View>
					<Ionicons
						name={isExpanded ? 'chevron-up' : 'chevron-down'}
						size={20}
						color="#737373"
					/>
				</View>
				<View className="mt-4 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
					<View
						className="h-full rounded-full"
						style={{ width: `${progress}%`, backgroundColor: subject.color }}
					/>
				</View>
			</Pressable>

			{
				isExpanded && (
					<View className="mt-2 ml-4 border-l-2 border-neutral-800 pl-4">
						{
							subject.topics.map((topic) => {
								const topicProgress = Math.round((topic.completed / topic.questionCount) * 100);
								return (
									<Pressable
										key={topic.id}
										onPress={() => onTopicPress(topic.id)}
										className="bg-neutral-900/50 rounded-xl p-4 mb-2 border border-neutral-800/50 active:opacity-70"
									>
										<View className="flex-row items-center justify-between">
											<View className="flex-1">
												<Text className="text-white font-medium">{topic.name}</Text>
												<Text className="text-neutral-500 text-sm mt-1">
													{topic.completed}/{topic.questionCount} questions
												</Text>
											</View>
											<View className="items-center">
												<Text
													className="font-bold"
													style={{ color: subject.color }}
												>
													{topicProgress}%
												</Text>
											</View>
										</View>
									</Pressable>
								);
							})
						}
					</View>
				)
			}
		</View>
	);
}

export default function PracticeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

	const handleTopicPress = (topicId: string) => {
		router.push({
			pathname: '/(practice)/quiz',
			params: { topicId },
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

					{
						subjects.map((subject) => (
							<SubjectCard
								key={subject.id}
								subject={subject}
								isExpanded={expandedSubject === subject.id}
								onToggle={() =>
									setExpandedSubject(
										expandedSubject === subject.id ? null : subject.id
									)
								}
								onTopicPress={handleTopicPress}
							/>
						))
					}
				</Animated.View>
			</ScrollView>
		</View>
	);
}