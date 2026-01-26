import React, { useState, useEffect, useRef } from 'react';
import {
	View, Text, Pressable, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';
import { Ionicons } from '@expo/vector-icons';

const RESEND_DELAY = 30;

export default function OTPScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const {
		phoneNumber,
		verifyOtp,
		sendOtp,
		isVerifying,
		error,
		clearError,
	} = useAuthStore();

	const [otp, setOtp] = useState('');
	const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
	const [canResend, setCanResend] = useState(false);
	const inputRefs = useRef<(TextInput | null)[]>([]);

	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		} else {
			setCanResend(true);
		}
	}, [resendTimer]);

	const handleOtpChange = (value: string, index: number) => {
		if (error) clearError();
		const newOtp = otp.split('');
		newOtp[index] = value;
		const updatedOtp = newOtp.join('').slice(0, 6);
		setOtp(updatedOtp);
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyPress = (e: any, index: number) => {
		if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handleVerify = async () => {
		if (otp.length !== 6) return;
		const result = await verifyOtp(otp);
		if (result.success) {
			if (result.isNewUser) {
				router.replace('/(onboarding)/username');
			} else {
				router.replace('/(tabs)');
			}
		}
	};

	const handleResend = async () => {
		if (!canResend) return;
		setCanResend(false);
		setResendTimer(RESEND_DELAY);
		setOtp('');
		await sendOtp(phoneNumber);
	};

	const formatPhone = (phone: string) => {
		return `+977 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
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
						<Text className="text-4xl">🔐</Text>
					</View>
				</Animated.View>
				<Animated.View
					entering={FadeInDown.delay(200).duration(500)}
					className="items-center mb-10"
				>
					<Text className="text-2xl font-bold text-neutral-50 text-center mb-2">
						Verification Code
					</Text>
					<Text className="text-base text-neutral-400 text-center">
						Enter the 6-digit code sent to
					</Text>
					<Text className="text-base font-medium text-amber-500 mt-1">
						{formatPhone(phoneNumber)}
					</Text>
				</Animated.View>
				<Animated.View
					entering={FadeInUp.delay(300).duration(500)}
					className="mb-8"
				>
					<View className="flex-row justify-center gap-3">
						{
							[0, 1, 2, 3, 4, 5].map((index) => (
								<TextInput
									key={index}
									ref={(ref) => { inputRefs.current[index] = ref; }}
									value={otp[index] || ''}
									onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
									onKeyPress={(e) => handleKeyPress(e, index)}
									keyboardType="number-pad"
									maxLength={1}
									className={`w-12 h-14 rounded-xl text-center text-xl font-bold border-2 ${otp[index]
										? 'bg-amber-500/20 border-amber-500 text-amber-500'
										: 'bg-neutral-900 border-neutral-800 text-neutral-50'
										}`}
									autoFocus={index === 0}
								/>
							))
						}
					</View>
					{
						error && (
							<Text className="text-red-500 text-sm text-center mt-4">{error}</Text>
						)
					}
				</Animated.View>
				<Animated.View
					entering={FadeInUp.delay(400).duration(500)}
					className="items-center mb-8"
				>
					{
						canResend ? (
							<Pressable onPress={handleResend} className="py-2 px-4">
								<Text className="text-amber-500 font-medium">Resend Code</Text>
							</Pressable>
						) : (
							<View className="flex-row items-center">
								<Text className="text-neutral-400">Resend code in </Text>
								<Text className="text-amber-500 font-medium">{resendTimer}s</Text>
							</View>
						)
					}
				</Animated.View>

				<View className="flex-1" />

				<Animated.View
					entering={FadeInUp.delay(500).duration(500)}
					className="pb-8"
				>
					<Pressable
						onPress={handleVerify}
						disabled={otp.length !== 6 || isVerifying}
						className={`w-full h-14 rounded-xl items-center justify-center ${otp.length === 6 && !isVerifying
							? 'bg-amber-500 active:bg-amber-600'
							: 'bg-neutral-800'
							}`}
					>
						<Text
							className={`text-lg font-semibold ${otp.length === 6 && !isVerifying
								? 'text-neutral-950'
								: 'text-neutral-500'
								}`}
						>
							{isVerifying ? 'Verifying...' : 'Verify'}
						</Text>
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}