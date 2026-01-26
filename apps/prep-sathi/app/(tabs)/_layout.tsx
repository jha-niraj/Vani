import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
	const icons: Record<string, string> = {
		home: '🏠',
		practice: '📝',
		progress: '📊',
		profile: '👤',
	};

	return (
		<View
			className={`items-center justify-center w-10 h-8 rounded-lg ${
				focused ? 'bg-amber-500/20' : ''
			}`}
		>
			<Text className="text-xl">{icons[name] || '•'}</Text>
		</View>
	);
}

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#f59e0b',
				tabBarInactiveTintColor: '#737373',
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarStyle: {
					backgroundColor: '#171717',
					borderTopColor: '#262626',
					borderTopWidth: 0.5,
					height: 64,
					paddingBottom: 8,
					paddingTop: 4,
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: '500',
					marginTop: 2,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ focused }) => (
						<TabIcon name="home" focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="practice"
				options={{
					title: 'Practice',
					tabBarIcon: ({ focused }) => (
						<TabIcon name="practice" focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="progress"
				options={{
					title: 'Progress',
					tabBarIcon: ({ focused }) => (
						<TabIcon name="progress" focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ focused }) => (
						<TabIcon name="profile" focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	);
}