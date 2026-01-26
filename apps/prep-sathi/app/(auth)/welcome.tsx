import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
	FadeInDown, FadeInUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const handleContinue = () => {
		router.push('/(auth)/phone');
	};

	return (
		<View
			className="flex-1 bg-neutral-950 px-6"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<View className="flex-1 justify-between py-8">
				<Animated.View
					entering={FadeInDown.delay(200).duration(600)}
					className="items-center pt-12"
				>
					<View className="relative mb-8">
						<View className="absolute -inset-3 rounded-full" />
						<View className="w-24 h-24 rounded-3xl bg-amber-500/20 border border-amber-500/40 items-center justify-center">
							<Text className="text-5xl">📚</Text>
						</View>
					</View>
					<Animated.Text
						entering={FadeInUp.delay(400).duration(600)}
						className="text-4xl font-bold text-amber-500 mb-1"
					>
						PrepSathi
					</Animated.Text>
					<Animated.Text
						entering={FadeInUp.delay(500).duration(600)}
						className="text-base text-neutral-400 text-center"
					>
						Your Exam Preparation Companion
					</Animated.Text>
				</Animated.View>
				<Animated.View
					entering={FadeInUp.delay(600).duration(600)}
					className="py-6 gap-5"
				>
					<FeatureItem
						icon="✓"
						iconColor="text-amber-500"
						iconBg="bg-amber-500/20"
						title="Practice MCQs"
						description="Thousands of questions from past exams"
					/>
					<FeatureItem
						icon="📊"
						iconColor="text-orange-400"
						iconBg="bg-orange-400/20"
						title="Track Progress"
						description="Monitor your improvement over time"
					/>
					<FeatureItem
						icon="🎯"
						iconColor="text-amber-600"
						iconBg="bg-amber-600/20"
						title="Focus on Weak Areas"
						description="AI identifies topics you need to work on"
					/>
				</Animated.View>
				<Animated.View
					entering={FadeInUp.delay(800).duration(600)}
					className="pt-6"
				>
					<Pressable
						onPress={handleContinue}
						className="w-full h-14 bg-amber-500 rounded-xl items-center justify-center active:bg-amber-600 shadow-lg"
					>
						<Text className="text-lg font-semibold text-neutral-950">
							Get Started
						</Text>
					</Pressable>
					<Text className="text-xs text-neutral-500 text-center mt-4 px-6">
						By continuing, you agree to our Terms of Service and Privacy Policy
					</Text>
				</Animated.View>
			</View>
		</View>
	);
}

interface FeatureItemProps {
	icon: string;
	iconColor: string;
	iconBg: string;
	title: string;
	description: string;
}

function FeatureItem({ icon, iconColor, iconBg, title, description }: FeatureItemProps) {
	return (
		<View className="flex-row items-center py-2 px-2">
			<View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${iconBg}`}>
				<Text className={`text-xl ${iconColor}`}>{icon}</Text>
			</View>
			<View className="flex-1">
				<Text className="text-base font-medium text-neutral-50 mb-1">
					{title}
				</Text>
				<Text className="text-sm text-neutral-400">
					{description}
				</Text>
			</View>
		</View>
	);
}