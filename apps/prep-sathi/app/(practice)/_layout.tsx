/**
 * Practice Layout
 * 
 * Layout for practice/quiz screens.
 */

import { Stack } from 'expo-router';

export default function PracticeLayout() {
	return (
		<Stack 
			screenOptions={{ 
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<Stack.Screen name="quiz" />
			<Stack.Screen 
				name="result" 
				options={{ 
					animation: 'fade',
					gestureEnabled: false,
				}} 
			/>
		</Stack>
	);
}
