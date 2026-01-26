/**
 * Root Layout
 * 
 * Handles app initialization, auth state, and navigation structure.
 */

import { useEffect } from 'react';
import { 
	DarkTheme, DefaultTheme, ThemeProvider 
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth-store';
import { Loading } from '@/components/ui';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	anchor: '(tabs)',
};

function useProtectedRoute() {
	const segments = useSegments();
	const router = useRouter();
	const { isAuthenticated, isInitialized, user } = useAuthStore();

	useEffect(() => {
		if (!isInitialized) return;

		const inAuthGroup = segments[0] === '(auth)';
		const inProtectedGroup = segments[0] === '(tabs)' || segments[0] === '(practice)';

		if (!isAuthenticated && inProtectedGroup) {
			// Not logged in, redirect to auth
			router.replace('/(auth)/welcome');
		} else if (isAuthenticated && inAuthGroup) {
			// Logged in, check if onboarding needed
			if (!user?.username || !user?.selectedExamId) {
				router.replace('/(onboarding)/username');
			} else {
				router.replace('/(tabs)');
			}
		}
	}, [isAuthenticated, isInitialized, segments, user, router]);
}

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const { initialize, isInitialized } = useAuthStore();

	useEffect(() => {
		initialize().finally(() => {
			SplashScreen.hideAsync();
		});
	}, [initialize]);

	useProtectedRoute();

	if (!isInitialized) {
		return <Loading fullScreen message="Loading..." />;
	}

	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				{/* Auth screens */}
				<Stack.Screen name="(auth)" />
				
				{/* Onboarding screens */}
				<Stack.Screen name="(onboarding)" />
				
				{/* Main app screens */}
				<Stack.Screen name="(tabs)" />
				
				{/* Practice screens */}
				<Stack.Screen name="(practice)" />
				
				{/* Modal screens */}
				<Stack.Screen 
					name="modal" 
					options={{ 
						presentation: 'modal', 
						title: 'Modal',
						headerShown: true,
					}} 
				/>
			</Stack>
			<StatusBar style="auto" />
		</ThemeProvider>
	);
}