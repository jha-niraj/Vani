/**
 * Profile Screen
 * 
 * User profile with settings and account options.
 */

import React from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Pressable, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    FadeInDown, useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { 
    Screen, Header, Card, Avatar, Badge 
} from '@/components/ui';
import {
    Typography, Spacing, Colors, BorderRadius, Animation
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileScreen() {
    const { colors } = useTheme();
    const router = useRouter();
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
                { icon: '🎯', label: 'Daily Goal', value: user?.dailyGoal || '10 questions', onPress: () => { } },
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
        <Screen safeTop padding={false}>
            <Header title="Profile" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <Card style={styles.profileCard}>
                        <Avatar
                            name={user?.displayName || user?.username}
                            source={user?.avatarUrl}
                            size="xl"
                        />
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.text }]}>
                                {user?.displayName || user?.username || 'Student'}
                            </Text>
                            {user?.username && (
                                <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
                                    @{user.username}
                                </Text>
                            )}
                            <Text style={[styles.profilePhone, { color: colors.textTertiary }]}>
                                +977 {user?.phone}
                            </Text>
                        </View>
                        <Badge variant="primary">
                            {user?.selectedExamId ? 'Loksewa' : 'No exam selected'}
                        </Badge>
                    </Card>
                </Animated.View>

                {/* Menu Sections */}
                {menuItems.map((section, sectionIndex) => (
                    <Animated.View
                        key={section.title}
                        entering={FadeInDown.delay(200 + sectionIndex * 100).duration(500)}
                        style={styles.section}
                    >
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            {section.title}
                        </Text>
                        <Card padding="none">
                            {section.items.map((item, itemIndex) => (
                                <MenuItem
                                    key={item.label}
                                    icon={item.icon}
                                    label={item.label}
                                    value={item.value}
                                    onPress={item.onPress}
                                    isLast={itemIndex === section.items.length - 1}
                                />
                            ))}
                        </Card>
                    </Animated.View>
                ))}

                {/* Logout Button */}
                <Animated.View
                    entering={FadeInDown.delay(600).duration(500)}
                    style={styles.section}
                >
                    <Pressable
                        onPress={handleLogout}
                        style={[styles.logoutButton, { backgroundColor: `${Colors.semantic.error}10` }]}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                    </Pressable>
                </Animated.View>

                <View style={{ height: Spacing['2xl'] }} />
            </ScrollView>
        </Screen>
    );
}

interface MenuItemProps {
    icon: string;
    label: string;
    value?: string;
    onPress: () => void;
    isLast?: boolean;
}

function MenuItem({ icon, label, value, onPress, isLast }: MenuItemProps) {
    const { colors } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={() => {
                scale.value = withSpring(0.98, Animation.spring.stiff);
            }}
            onPressOut={() => {
                scale.value = withSpring(1, Animation.spring.default);
            }}
            style={[
                styles.menuItem,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                animatedStyle,
            ]}
        >
            <Text style={styles.menuIcon}>{icon}</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
            {value && (
                <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{value}</Text>
            )}
            <Text style={{ color: colors.textTertiary }}>›</Text>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.base,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    profileInfo: {
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    profileName: {
        ...Typography.h4,
        marginBottom: 2,
    },
    profileUsername: {
        ...Typography.body,
    },
    profilePhone: {
        ...Typography.caption,
        marginTop: 4,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.overline,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.base,
    },
    menuIcon: {
        fontSize: 18,
        marginRight: Spacing.md,
    },
    menuLabel: {
        ...Typography.body,
        flex: 1,
    },
    menuValue: {
        ...Typography.bodySmall,
        marginRight: Spacing.sm,
    },
    logoutButton: {
        padding: Spacing.base,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    logoutText: {
        ...Typography.bodyMedium,
        color: Colors.semantic.error,
    },
});
