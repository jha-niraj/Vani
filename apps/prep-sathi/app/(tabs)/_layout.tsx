/**
 * Tabs Layout
 * 
 * Main app tab navigation with Home, Practice, and Profile tabs.
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, Spacing, Typography,  Layout } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Tab icons as simple text (you can replace with actual icons)
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
	const icons: Record<string, string> = {
		home: '🏠',
		practice: '📝',
		progress: '📊',
		profile: '👤',
	};
	
	return (
		<View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
			<Text style={{ fontSize: 22 }}>{icons[name] || '•'}</Text>
		</View>
	);
}

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.tint,
				tabBarInactiveTintColor: colors.tabIconDefault,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarStyle: {
					backgroundColor: colors.tabBackground,
					borderTopColor: colors.divider,
					height: Layout.height.tabBar,
					paddingBottom: Spacing.xs,
					paddingTop: Spacing.xs,
				},
				tabBarLabelStyle: {
					...Typography.caption,
					marginTop: 2,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name="home" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="practice"
				options={{
					title: 'Practice',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name="practice" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="progress"
				options={{
					title: 'Progress',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name="progress" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, focused }) => (
						<TabIcon name="profile" color={color} focused={focused} />
					),
				}}
			/>
			{/* Hide explore from tabs */}
			<Tabs.Screen
				name="explore"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabIcon: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	tabIconFocused: {
		transform: [{ scale: 1.1 }],
	},
});