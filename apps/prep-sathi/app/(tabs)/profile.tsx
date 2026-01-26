import React from 'react';
import {
    View, Text, ScrollView, Pressable, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth-store';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/welcome');
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            title: 'Account',
            items: [
                { icon: '👤', label: 'Edit Profile', onPress: () => { } },
                { icon: '🎯', label: 'Daily Goal', value: user?.preferences?.dailyGoal || '10 questions', onPress: () => { } },
                { icon: '📚', label: 'Change Exam', onPress: () => router.push('/(onboarding)/exam-select') },
            ],
        },
        {
            title: 'App Settings',
            items: [
                { icon: '🔔', label: 'Notifications', onPress: () => { } },
                { icon: '🌙', label: 'Appearance', value: 'System', onPress: () => { } },
                { icon: '🌐', label: 'Language', value: 'English', onPress: () => { } },
            ],
        },
        {
            title: 'Support',
            items: [
                { icon: '❓', label: 'Help & FAQ', onPress: () => { } },
                { icon: '📧', label: 'Contact Us', onPress: () => { } },
                { icon: '⭐', label: 'Rate App', onPress: () => { } },
            ],
        },
        {
            title: 'About',
            items: [
                { icon: '📜', label: 'Terms of Service', onPress: () => { } },
                { icon: '🔒', label: 'Privacy Policy', onPress: () => { } },
                { icon: 'ℹ️', label: 'App Version', value: '1.0.0', onPress: () => { } },
            ],
        },
    ];

    return (
        <View className="flex-1 bg-neutral-950" style={{ paddingTop: insets.top }}>
            <View className="px-4 py-4 border-b border-neutral-800">
                <Text className="text-2xl font-bold text-neutral-50">Profile</Text>
            </View>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <View className="bg-neutral-900 rounded-2xl p-6 mb-6 border border-neutral-800 items-center">
                        <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4">
                            <Text className="text-3xl">
                                {(user?.name || user?.username || 'S')[0].toUpperCase()}
                            </Text>
                        </View>
                        <Text className="text-xl font-bold text-neutral-50 mb-1">
                            {user?.name || user?.username || 'Student'}
                        </Text>
                        {
                            user?.username && (
                                <Text className="text-base text-neutral-400">@{user.username}</Text>
                            )
                        }
                        <Text className="text-sm text-neutral-500 mt-1">
                            +977 {user?.phone}
                        </Text>
                        <View className="bg-amber-500/20 px-4 py-1 rounded-full mt-4">
                            <Text className="text-amber-500 text-sm font-medium">
                                {user?.currentExam?.type?.name || 'No exam selected'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {
                    menuItems.map((section, sectionIndex) => (
                        <Animated.View
                            key={section.title}
                            entering={FadeInDown.delay(200 + sectionIndex * 100).duration(500)}
                            className="mb-6"
                        >
                            <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 ml-1">
                                {section.title}
                            </Text>
                            <View className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                                {
                                    section.items.map((item, itemIndex) => (
                                        <Pressable
                                            key={item.label}
                                            onPress={item.onPress}
                                            className={`flex-row items-center px-4 py-4 active:bg-neutral-800 ${itemIndex < section.items.length - 1
                                                    ? 'border-b border-neutral-800'
                                                    : ''
                                                }`}
                                        >
                                            <Text className="text-lg mr-4">{item.icon}</Text>
                                            <Text className="flex-1 text-base text-neutral-50">{item.label}</Text>
                                            {
                                                item.value && (
                                                    <Text className="text-sm text-neutral-400 mr-2">{item.value}</Text>
                                                )
                                            }
                                            <Text className="text-neutral-500">›</Text>
                                        </Pressable>
                                    ))
                                }
                            </View>
                        </Animated.View>
                    ))
                }

                <Animated.View
                    entering={FadeInDown.delay(600).duration(500)}
                    className="mb-8"
                >
                    <Pressable
                        onPress={handleLogout}
                        className="bg-red-500/10 p-4 rounded-xl items-center active:bg-red-500/20"
                    >
                        <Text className="text-red-500 font-medium">Logout</Text>
                    </Pressable>
                </Animated.View>

                <View className="h-8" />
            </ScrollView>
        </View>
    );
}