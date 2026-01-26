/**
 * BottomSheet Component
 * 
 * A native-like bottom sheet component with smooth animations.
 * Uses react-native-reanimated and gesture handler.
 */

import React, { useCallback, useEffect } from 'react';
import {
    View, StyleSheet, Pressable, Dimensions, ViewStyle, KeyboardAvoidingView, 
    Platform
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, 
    interpolate, Extrapolation
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { 
    BorderRadius, Spacing, ZIndex, Animation, Colors 
} from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50;

export interface BottomSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    snapPoints?: number[]; // As percentages of screen height (e.g., [0.5, 0.8])
    initialSnapIndex?: number;
    enableDrag?: boolean;
    showHandle?: boolean;
    style?: ViewStyle;
    backdropOpacity?: number;
}

export function BottomSheet({
    children,
    isOpen,
    onClose,
    snapPoints = [0.5],
    initialSnapIndex = 0,
    enableDrag = true,
    showHandle = true,
    style,
    backdropOpacity = 0.5,
}: BottomSheetProps) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const active = useSharedValue(false);

    const sortedSnapPoints = [...snapPoints].sort((a, b) => a - b);
    const maxHeight = SCREEN_HEIGHT * Math.max(...sortedSnapPoints);
    const initialHeight = SCREEN_HEIGHT * (sortedSnapPoints[initialSnapIndex] || sortedSnapPoints[0]);

    const scrollTo = useCallback((destination: number) => {
        'worklet';
        translateY.value = withSpring(destination, Animation.spring.default);
    }, [translateY]);

    const closeSheet = useCallback(() => {
        'worklet';
        translateY.value = withTiming(maxHeight + 100, { duration: 200 });
        runOnJS(onClose)();
    }, [maxHeight, onClose, translateY]);

    useEffect(() => {
        if (isOpen) {
            translateY.value = withSpring(
                SCREEN_HEIGHT - initialHeight,
                Animation.spring.default
            );
            active.value = true;
        } else {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
            active.value = false;
        }
    }, [isOpen, initialHeight, translateY, active]);

    const gesture = Gesture.Pan()
        .enabled(enableDrag)
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = Math.max(
                context.value.y + event.translationY,
                SCREEN_HEIGHT - maxHeight - insets.top
            );
        })
        .onEnd((event) => {
            // Determine direction and velocity
            const velocity = event.velocityY;
            const currentPosition = SCREEN_HEIGHT - translateY.value;
            
            // If swiping down fast, close
            if (velocity > 500) {
                closeSheet();
                return;
            }
            
            // Find closest snap point
            const snapPointsInPixels = sortedSnapPoints.map(p => SCREEN_HEIGHT * p);
            let closestPoint = snapPointsInPixels[0];
            let minDistance = Math.abs(currentPosition - closestPoint);
            
            for (const point of snapPointsInPixels) {
                const distance = Math.abs(currentPosition - point);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = point;
                }
            }
            
            // If dragged below minimum snap point, close
            if (currentPosition < (sortedSnapPoints[0] * SCREEN_HEIGHT) / 2) {
                closeSheet();
            } else {
                scrollTo(SCREEN_HEIGHT - closestPoint);
            }
        });

    const rBottomSheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const rBackdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [SCREEN_HEIGHT, SCREEN_HEIGHT - initialHeight],
            [0, backdropOpacity],
            Extrapolation.CLAMP
        ),
    }));

    const rBackdropPointerEvents = useAnimatedStyle(() => ({
        pointerEvents: active.value ? 'auto' : 'none',
    } as ViewStyle));

    if (!isOpen && translateY.value >= SCREEN_HEIGHT) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <Animated.View 
                style={[
                    styles.backdrop, 
                    { backgroundColor: Colors.neutral.gray900 },
                    rBackdropStyle,
                    rBackdropPointerEvents,
                ]}
            >
                <Pressable style={styles.backdropPressable} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <GestureDetector gesture={gesture}>
                <Animated.View
                    style={[
                        styles.bottomSheetContainer,
                        {
                            backgroundColor: colors.background,
                            maxHeight: maxHeight + insets.bottom,
                            paddingBottom: insets.bottom,
                        },
                        rBottomSheetStyle,
                        style,
                    ]}
                >
                    {showHandle && (
                        <View style={styles.handleContainer}>
                            <View 
                                style={[
                                    styles.handle, 
                                    { backgroundColor: isDark ? Colors.neutral.gray600 : Colors.neutral.gray300 }
                                ]} 
                            />
                        </View>
                    )}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.content}
                    >
                        {children}
                    </KeyboardAvoidingView>
                </Animated.View>
            </GestureDetector>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: ZIndex.modal - 1,
    },
    backdropPressable: {
        flex: 1,
    },
    bottomSheetContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: SCREEN_HEIGHT,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        zIndex: ZIndex.modal,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    content: {
        flex: 1,
    },
});

export default BottomSheet;
