/**
 * Badge Component
 * 
 * Small badge for labels, counts, and status indicators.
 */

import React from 'react';
import {
	View, Text, Pressable, ViewStyle, TextStyle
} from 'react-native';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
	size?: BadgeSize;
	outline?: boolean;
	style?: ViewStyle;
	textStyle?: TextStyle;
	onPress?: () => void;
}

export function Badge({
	children,
	variant = 'default',
	size = 'md',
	outline = false,
	style,
	textStyle,
	onPress,
}: BadgeProps) {
	const getVariantClasses = () => {
		const baseOutline = outline ? 'border' : '';
		switch (variant) {
			case 'primary':
				return {
					container: outline ? 'bg-transparent border-amber-500' : 'bg-amber-500/20',
					text: 'text-amber-500',
				};
			case 'success':
				return {
					container: outline ? 'bg-transparent border-emerald-500' : 'bg-emerald-500/20',
					text: 'text-emerald-500',
				};
			case 'warning':
				return {
					container: outline ? 'bg-transparent border-yellow-500' : 'bg-yellow-500/20',
					text: 'text-yellow-600',
				};
			case 'error':
				return {
					container: outline ? 'bg-transparent border-red-500' : 'bg-red-500/20',
					text: 'text-red-500',
				};
			case 'info':
				return {
					container: outline ? 'bg-transparent border-blue-500' : 'bg-blue-500/20',
					text: 'text-blue-500',
				};
			default:
				return {
					container: outline ? 'bg-transparent border-neutral-600' : 'bg-neutral-800',
					text: 'text-neutral-400',
				};
		}
	};

	const sizeClasses = size === 'sm'
		? 'px-2 py-0.5'
		: 'px-3 py-1';

	const textSizeClass = size === 'sm' ? 'text-[10px]' : 'text-xs';

	const variantClasses = getVariantClasses();
	const outlineClass = outline ? 'border' : '';

	const containerClasses = `rounded-full self-start ${sizeClasses} ${variantClasses.container} ${outlineClass}`;
	const textClasses = `${textSizeClass} font-semibold ${variantClasses.text}`;

	const content = (
		<Text className={textClasses} style={textStyle}>
			{children}
		</Text>
	);

	if (onPress) {
		return (
			<Pressable onPress={onPress} className={containerClasses} style={style}>
				{content}
			</Pressable>
		);
	}

	return (
		<View className={containerClasses} style={style}>
			{content}
		</View>
	);
}