import React from 'react';
import {
    View, ScrollView, StatusBar, Platform, KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export interface ScreenProps {
    children: React.ReactNode;
    scroll?: boolean;
    padding?: boolean;
    safeTop?: boolean;
    safeBottom?: boolean;
    keyboardAvoiding?: boolean;
    className?: string;
    contentClassName?: string;
}

export function Screen({
    children,
    scroll = false,
    padding = true,
    safeTop = true,
    safeBottom = true,
    keyboardAvoiding = false,
    className = '',
    contentClassName = '',
}: ScreenProps) {
    const { isDark, colors } = useTheme();
    const insets = useSafeAreaInsets();

    const content = scroll ? (
        <ScrollView
            className="flex-1"
            contentContainerClassName={`flex-grow ${padding ? 'px-4' : ''} ${contentClassName}`}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {children}
        </ScrollView>
    ) : (
        <View className={`flex-1 ${padding ? 'px-4' : ''} ${contentClassName}`}>
            {children}
        </View>
    );

    const wrappedContent = keyboardAvoiding ? (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {content}
        </KeyboardAvoidingView>
    ) : (
        content
    );

    return (
        <View 
            className={`flex-1 bg-neutral-950 ${className}`}
            style={{
                paddingTop: safeTop ? insets.top : 0,
                paddingBottom: safeBottom ? insets.bottom : 0,
            }}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />
            {wrappedContent}
        </View>
    );
}