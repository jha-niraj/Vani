import { View, Text, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ModalScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View
			className="flex-1 bg-neutral-950 items-center justify-center px-6"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			<Pressable
				onPress={() => router.back()}
				className="absolute top-4 right-4 w-10 h-10 rounded-full bg-neutral-800 items-center justify-center active:opacity-70"
				style={{ top: insets.top + 16 }}
			>
				<Ionicons name="close" size={24} color="#fff" />
			</Pressable>
			<View className="items-center">
				<View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-6">
					<Ionicons name="information-circle-outline" size={40} color="#F59E0B" />
				</View>
				<Text className="text-white text-2xl font-bold text-center mb-2">
					This is a Modal
				</Text>
				<Text className="text-neutral-400 text-center mb-8">
					Modals are useful for displaying important information or
					collecting user input.
				</Text>
				<Link href="/" dismissTo asChild>
					<Pressable className="bg-amber-500 px-8 py-4 rounded-xl active:opacity-80">
						<Text className="text-black font-semibold text-base">
							Go to Home
						</Text>
					</Pressable>
				</Link>
			</View>
		</View>
	);
}