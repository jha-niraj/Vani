import React from 'react';
import {
	View, Text, Image, ViewStyle, ImageStyle
} from 'react-native';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
	source?: string | null;
	name?: string | null;
	size?: AvatarSize;
	style?: ViewStyle;
	imageStyle?: ImageStyle;
}

export function Avatar({
	source,
	name,
	size = 'md',
	style,
	imageStyle,
}: AvatarProps) {
	const getSizeClasses = () => {
		switch (size) {
			case 'sm': return { container: 'w-8 h-8', text: 'text-xs' };
			case 'lg': return { container: 'w-14 h-14', text: 'text-xl' };
			case 'xl': return { container: 'w-20 h-20', text: 'text-3xl' };
			default: return { container: 'w-11 h-11', text: 'text-base' };
		}
	};

	const getInitials = (name: string): string => {
		const parts = name.trim().split(' ');
		if (parts.length === 1) {
			return parts[0].charAt(0).toUpperCase();
		}
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	};

	const sizeClasses = getSizeClasses();

	if (source) {
		return (
			<Image
				source={{ uri: source }}
				className={`${sizeClasses.container} rounded-full`}
				style={imageStyle}
			/>
		);
	}

	return (
		<View
			className={`${sizeClasses.container} rounded-full bg-amber-500 items-center justify-center`}
			style={style}
		>
			<Text className={`${sizeClasses.text} text-white font-semibold`}>
				{name ? getInitials(name) : '?'}
			</Text>
		</View>
	);
}