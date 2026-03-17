import React, { useState } from 'react';
import {
	View, Text, Pressable, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';

export default function PhoneScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { sendOtp, isLoading, error, clearError } = useAuthStore();
	const [phone, setPhone] = useState('');

	const isValidPhone = phone.length === 10 && /^9[78]\d{8}$/.test(phone);

	const handleContinue = async () => {
		if (!isValidPhone) return;
		const success = await sendOtp(phone);
		if (success) {
			router.push('/(auth)/otp');
		}
	};

	const handlePhoneChange = (value: string) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 10);
		setPhone(cleaned);
		if (error) clearError();
	};

	return (
		<View
			className="flex-1 bg-neutral-950 px-6"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<Animated.View entering={FadeInDown.delay(100).duration(400)}>
				<Pressable
					onPress={() => router.back()}
					className="w-10 h-10 rounded-full bg-neutral-900 items-center justify-center mt-2"
				>
					<Ionicons name="chevron-back" size={20} color="#a3a3a3" />
				</Pressable>
			</Animated.View>
			<View className="flex-1 pt-8">
				<Animated.View
					entering={FadeInDown.delay(150).duration(500)}
					className="items-center mb-8"
				>
					<View className="w-[72px] h-[72px] rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center">
						<Text className="text-4xl">📱</Text>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(200).duration(500)}
					className="items-center mb-10"
				>
					<Text className="text-2xl font-bold text-neutral-50 text-center mb-2">
						Enter your phone number
					</Text>
					<Text className="text-base text-neutral-400 text-center px-4">
						We will send you a verification code to confirm your identity
					</Text>
				</Animated.View>
				<Animated.View
					entering={FadeInUp.delay(300).duration(500)}
					className="mb-6"
				>
					<View className="flex-row items-center bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
						<View className="px-4 py-4 border-r border-neutral-800">
							<Text className="text-neutral-50 text-base font-medium">+977</Text>
						</View>
						<TextInput
							value={phone}
							onChangeText={handlePhoneChange}
							placeholder="98XXXXXXXX"
							placeholderTextColor="#525252"
							keyboardType="phone-pad"
							autoFocus
							className="flex-1 px-4 py-4 text-neutral-50 text-base"
						/>
					</View>

					{
						error && (
							<Text className="text-red-500 text-sm text-center mt-3">
								{error}
							</Text>
						)
					}

					<Text className="text-neutral-500 text-xs text-center mt-3">
						Nepal phone numbers only (97... or 98...)
					</Text>
				</Animated.View>

				<View className="flex-1" />

				<Animated.View
					entering={FadeInUp.delay(400).duration(500)}
					className="pb-8"
				>
					<Pressable
						onPress={handleContinue}
						disabled={!isValidPhone || isLoading}
						className={`w-full h-14 rounded-xl items-center justify-center ${isValidPhone && !isLoading
							? 'bg-amber-500 active:bg-amber-600'
							: 'bg-neutral-800'
							}`}
					>
						<Text
							className={`text-lg font-semibold ${isValidPhone && !isLoading ? 'text-neutral-950' : 'text-neutral-500'
								}`}
						>
							{isLoading ? 'Sending...' : 'Continue'}
						</Text>
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}