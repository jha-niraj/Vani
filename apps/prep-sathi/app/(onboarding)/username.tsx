import React, { useState } from 'react';
import {
	View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';

export default function UsernameScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { updateUser, isLoading } = useAuthStore();

	const [username, setUsername] = useState('');
	const [isChecking, setIsChecking] = useState(false);
	const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

	const isValidUsername = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);

	const handleUsernameChange = (value: string) => {
		const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
		setUsername(cleaned);
		setIsAvailable(null);

		// Simulate availability check
		if (cleaned.length >= 3) {
			setIsChecking(true);
			setTimeout(() => {
				setIsAvailable(cleaned !== 'admin' && cleaned !== 'test');
				setIsChecking(false);
			}, 500);
		}
	};

	const handleContinue = async () => {
		if (!isValidUsername || !isAvailable) return;

		updateUser({ username });
		router.push('/(onboarding)/exam-select');
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			className="flex-1 bg-neutral-950"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<View className="flex-1 px-6">
				<Animated.View
					entering={FadeInDown.delay(100).duration(400)}
					className="flex-row gap-2 mt-4 mb-8"
				>
					<View className="flex-1 h-1 bg-amber-500 rounded-full" />
					<View className="flex-1 h-1 bg-neutral-800 rounded-full" />
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(200).duration(400)}
					className="w-20 h-20 bg-amber-500/20 rounded-full items-center justify-center mb-8"
				>
					<Ionicons name="person-outline" size={40} color="#F59E0B" />
				</Animated.View>
				<Animated.View entering={FadeInDown.delay(300).duration(400)}>
					<Text className="text-white text-3xl font-bold mb-2">
						Choose a username
					</Text>
					<Text className="text-neutral-400 text-base leading-relaxed">
						This will be your unique identity on PrepSathi. You can change it later.
					</Text>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(400).duration(400)}
					className="mt-8"
				>
					<View className="flex-row items-center bg-neutral-900 rounded-2xl px-5 py-4 border-2 border-neutral-800">
						<Text className="text-neutral-500 text-lg mr-1">@</Text>
						<TextInput
							value={username}
							onChangeText={handleUsernameChange}
							placeholder="username"
							placeholderTextColor="#525252"
							autoCapitalize="none"
							autoCorrect={false}
							className="flex-1 text-white text-lg"
						/>
						{
							isChecking && (
								<Ionicons name="sync" size={20} color="#737373" />
							)
						}
						{
							!isChecking && isAvailable === true && (
								<Ionicons name="checkmark-circle" size={20} color="#10B981" />
							)
						}
						{
							!isChecking && isAvailable === false && (
								<Ionicons name="close-circle" size={20} color="#EF4444" />
							)
						}
					</View>
					<View className="mt-3">
						{
							username.length > 0 && username.length < 3 && (
								<Text className="text-neutral-500 text-sm">
									Username must be at least 3 characters
								</Text>
							)
						}
						{
							isAvailable === false && (
								<Text className="text-red-500 text-sm">
									This username is already taken
								</Text>
							)
						}
						{
							isAvailable === true && (
								<Text className="text-emerald-500 text-sm">
									Username is available!
								</Text>
							)
						}
					</View>
					<View className="mt-6 p-4 bg-neutral-900/50 rounded-xl">
						<Text className="text-neutral-400 text-sm mb-2">Username can contain:</Text>
						<View className="flex-row flex-wrap gap-2">
							{
								['letters', 'numbers', 'underscores'].map((rule) => (
									<View key={rule} className="flex-row items-center">
										<Ionicons name="checkmark" size={14} color="#10B981" />
										<Text className="text-neutral-500 text-sm ml-1">{rule}</Text>
									</View>
								))
							}
						</View>
					</View>
				</Animated.View>

				<View className="flex-1" />

				<Animated.View
					entering={FadeInUp.delay(500).duration(400)}
					className="pb-4"
				>
					<Pressable
						onPress={handleContinue}
						disabled={!isValidUsername || !isAvailable || isLoading}
						className={`py-4 rounded-2xl items-center ${isValidUsername && isAvailable
							? 'bg-amber-500 active:opacity-80'
							: 'bg-neutral-800'
							}`}
					>
						<Text
							className={`font-bold text-lg ${isValidUsername && isAvailable ? 'text-black' : 'text-neutral-600'
								}`}
						>
							{isLoading ? 'Saving...' : 'Continue'}
						</Text>
					</Pressable>
				</Animated.View>
			</View>
		</KeyboardAvoidingView>
	);
}