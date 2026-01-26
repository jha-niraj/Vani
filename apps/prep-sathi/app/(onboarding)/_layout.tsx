/**
 * Onboarding Layout
 * 
 * Layout for onboarding screens (username, exam selection).
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
	return (
		<Stack 
			screenOptions={{ 
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<Stack.Screen name="username" />
			<Stack.Screen name="exam-select" />
		</Stack>
	);
}
