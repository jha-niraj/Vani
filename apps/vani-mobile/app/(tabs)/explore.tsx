import { useState } from 'react';
import { 
	View, Text, ScrollView, Pressable 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface CategoryCardProps {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	subtitle: string;
	count: number;
	onPress: () => void;
}

function CategoryCard({ icon, title, subtitle, count, onPress }: CategoryCardProps) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center p-4 mb-3 bg-neutral-900 rounded-xl border border-neutral-800 active:opacity-70"
		>
			<View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center">
				<Ionicons name={icon} size={24} color="#F59E0B" />
			</View>
			<View className="flex-1 ml-4">
				<Text className="text-white text-base font-semibold">{title}</Text>
				<Text className="text-neutral-400 text-sm mt-0.5">{subtitle}</Text>
			</View>
			<View className="items-center">
				<Text className="text-amber-500 text-lg font-bold">{count}</Text>
				<Text className="text-neutral-500 text-xs">items</Text>
			</View>
		</Pressable>
	);
}

interface FeaturedCardProps {
	title: string;
	description: string;
	badge: string;
	onPress: () => void;
}

function FeaturedCard({ title, description, badge, onPress }: FeaturedCardProps) {
	return (
		<Pressable
			onPress={onPress}
			className="w-64 mr-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl p-5 border border-amber-500/30 active:opacity-70"
		>
			<View className="px-2 py-1 bg-amber-500 rounded-full self-start mb-3">
				<Text className="text-black text-xs font-semibold">{badge}</Text>
			</View>
			<Text className="text-white text-lg font-bold mb-2">{title}</Text>
			<Text className="text-neutral-400 text-sm">{description}</Text>
		</Pressable>
	);
}

export default function ExploreScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState('');

	const categories = [
		{
			icon: 'book-outline' as const,
			title: 'Mock Tests',
			subtitle: 'Full-length practice exams',
			count: 15,
		},
		{
			icon: 'document-text-outline' as const,
			title: 'Previous Year Papers',
			subtitle: 'Past exam questions',
			count: 25,
		},
		{
			icon: 'flash-outline' as const,
			title: 'Quick Quizzes',
			subtitle: 'Topic-wise short tests',
			count: 120,
		},
		{
			icon: 'videocam-outline' as const,
			title: 'Video Lessons',
			subtitle: 'Expert explanations',
			count: 48,
		},
		{
			icon: 'newspaper-outline' as const,
			title: 'Current Affairs',
			subtitle: 'Latest updates',
			count: 30,
		},
	];

	const featured = [
		{
			title: 'TSC Primary Level Mock',
			description: 'Complete simulation with 100 questions',
			badge: 'NEW',
		},
		{
			title: 'Loksewa Weekly Quiz',
			description: 'Test your knowledge every week',
			badge: 'POPULAR',
		},
		{
			title: 'Banking Awareness',
			description: 'Essential topics for banking exams',
			badge: 'TRENDING',
		},
	];

	return (
		<View
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top }}
		>
			<View className="px-6 py-4">
				<Text className="text-white text-2xl font-bold">Explore</Text>
				<Text className="text-neutral-400 text-sm mt-1">
					Discover new ways to learn
				</Text>
			</View>
			<View className="mx-6 mb-4">
				<View className="flex-row items-center bg-neutral-900 rounded-xl px-4 py-3 border border-neutral-800">
					<Ionicons name="search-outline" size={20} color="#737373" />
					<Text className="text-neutral-500 text-base ml-3">
						Search for topics, tests...
					</Text>
				</View>
			</View>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
			>
				<View className="mb-6">
					<Text className="text-white text-lg font-semibold px-6 mb-4">
						Featured
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 24 }}
					>
						{
						featured.map((item, index) => (
							<FeaturedCard
								key={index}
								{...item}
								onPress={() => { }}
							/>
						))
						}
					</ScrollView>
				</View>
				<View className="px-6">
					<Text className="text-white text-lg font-semibold mb-4">
						Categories
					</Text>
					{
					categories.map((category, index) => (
						<CategoryCard
							key={index}
							{...category}
							onPress={() => { }}
						/>
					))
					}
				</View>
				<View className="mx-6 mt-6 p-5 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-700">
					<View className="flex-row items-center mb-2">
						<Ionicons name="rocket-outline" size={24} color="#F59E0B" />
						<Text className="text-white text-lg font-semibold ml-3">
							More Coming Soon
						</Text>
					</View>
					<Text className="text-neutral-400 text-sm">
						We're working on more features including study groups, live quizzes,
						and personalized learning paths.
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}