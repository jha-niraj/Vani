import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TextInput, Pressable, ActivityIndicator
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './ui/bottom-sheet';
import { Button } from './ui/button';
import { aiApi, type AIExplanation, type AITranslation } from '@/lib/api';

export interface QuestionData {
    id: string;
    question: string;
    options: { a: string; b: string; c: string; d: string };
    correctAnswer: string;
    explanation?: string | null;
    subject?: string;
    topic?: string;
}

export interface AIExplanationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    question: QuestionData | null;
}

type TabType = 'explain' | 'translate' | 'ask';

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function AIExplanationSheet({
    isOpen,
    onClose,
    question,
}: AIExplanationSheetProps) {
    const [activeTab, setActiveTab] = useState<TabType>('explain');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Explanation state
    const [explanation, setExplanation] = useState<AIExplanation | null>(null);

    // Translation state
    const [translation, setTranslation] = useState<AITranslation | null>(null);
    const [isNepali, setIsNepali] = useState(false);

    // Ask state
    const [askQuery, setAskQuery] = useState('');
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);

    const resetState = useCallback(() => {
        setActiveTab('explain');
        setLoading(false);
        setError(null);
        setExplanation(null);
        setTranslation(null);
        setIsNepali(false);
        setAskQuery('');
        setConversation([]);
    }, []);

    const handleClose = useCallback(() => {
        onClose();
        setTimeout(resetState, 300);
    }, [onClose, resetState]);

    // Fetch AI explanation
    const fetchExplanation = useCallback(async () => {
        if (!question || loading || explanation) return;

        setLoading(true);
        setError(null);

        try {
            const response = await aiApi.explainQuestion(question.id);
            setExplanation(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get explanation');
        } finally {
            setLoading(false);
        }
    }, [question, loading, explanation]);

    // Fetch translation
    const fetchTranslation = useCallback(async () => {
        if (!question || loading) return;

        setLoading(true);
        setError(null);

        try {
            const targetLang = isNepali ? 'en' : 'np';
            const response = await aiApi.translateQuestion(question.id, targetLang);
            setTranslation(response);
            setIsNepali(!isNepali);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to translate');
        } finally {
            setLoading(false);
        }
    }, [question, loading, isNepali]);

    // Send follow-up question
    const sendQuestion = useCallback(async () => {
        if (!question || loading || !askQuery.trim()) return;

        const userMessage = askQuery.trim();
        setAskQuery('');
        setConversation((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);
        setError(null);

        try {
            const context = conversation
                .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
                .join('\n');

            const response = await aiApi.askQuestion(question.id, userMessage, context);
            setConversation((prev) => [
                ...prev,
                { role: 'assistant', content: response.response },
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get response');
            setConversation((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    }, [question, loading, askQuery, conversation]);

    // Auto-fetch explanation when sheet opens
    React.useEffect(() => {
        if (isOpen && question && activeTab === 'explain' && !explanation) {
            fetchExplanation();
        }
    }, [isOpen, question, activeTab, explanation, fetchExplanation]);

    if (!question) return null;

    const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
        { key: 'explain', label: 'Explain', icon: 'bulb-outline' },
        { key: 'translate', label: 'नेपाली', icon: 'language-outline' },
        { key: 'ask', label: 'Ask', icon: 'chatbubble-outline' },
    ];

    const renderExplainTab = () => (
        <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
            {
                loading ? (
                    <View className="flex-1 items-center justify-center py-16">
                        <ActivityIndicator size="large" color="#F59E0B" />
                        <Text className="text-neutral-400 text-sm mt-3">
                            Getting AI explanation...
                        </Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center py-16 gap-3">
                        <Ionicons name="alert-circle" size={48} color="#EF4444" />
                        <Text className="text-red-500 text-sm text-center">{error}</Text>
                        <Button variant="outline" size="sm" onPress={fetchExplanation}>
                            Try Again
                        </Button>
                    </View>
                ) : explanation ? (
                    <Animated.View entering={FadeIn.duration(300)}>
                        <View className="bg-neutral-800 rounded-xl p-4 mb-4">
                            <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-1">
                                Question
                            </Text>
                            <Text className="text-white text-base leading-6">
                                {question.question}
                            </Text>
                            <View className="mt-3">
                                <Text className="text-emerald-500 text-sm font-semibold">
                                    Correct: {explanation.correctAnswer.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <View className="mb-6">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Ionicons name="bulb" size={20} color="#F59E0B" />
                                <Text className="text-white text-base font-semibold">
                                    AI Explanation
                                </Text>
                            </View>
                            <Text className="text-white text-base leading-7">
                                {explanation.explanation}
                            </Text>
                        </View>
                    </Animated.View>
                ) : null
            }
        </ScrollView>
    );

    const renderTranslateTab = () => (
        <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
            {
                loading ? (
                    <View className="flex-1 items-center justify-center py-16">
                        <ActivityIndicator size="large" color="#F59E0B" />
                        <Text className="text-neutral-400 text-sm mt-3">Translating...</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center py-16 gap-3">
                        <Ionicons name="alert-circle" size={48} color="#EF4444" />
                        <Text className="text-red-500 text-sm text-center">{error}</Text>
                        <Button variant="outline" size="sm" onPress={fetchTranslation}>
                            Try Again
                        </Button>
                    </View>
                ) : translation ? (
                    <Animated.View entering={FadeIn.duration(300)}>
                        <View className="bg-neutral-800 rounded-xl p-4">
                            <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-1">
                                {isNepali ? 'नेपालीमा' : 'In Nepali'}
                            </Text>
                            <Text className="text-white text-lg leading-7 mb-4">
                                {translation.question}
                            </Text>
                            <View className="gap-2">
                                {
                                    (['a', 'b', 'c', 'd'] as const).map((key) => (
                                        <View key={key} className="flex-row gap-2">
                                            <Text
                                                className={`text-sm font-semibold w-6 ${question.correctAnswer === key
                                                    ? 'text-emerald-500'
                                                    : 'text-neutral-500'
                                                    }`}
                                            >
                                                {key.toUpperCase()})
                                            </Text>
                                            <Text className="text-white text-base flex-1">
                                                {translation.options[key]}
                                            </Text>
                                        </View>
                                    ))
                                }
                            </View>

                            {
                                translation.explanation && (
                                    <View className="mt-4 pt-4 border-t border-neutral-700">
                                        <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-1">
                                            Explanation
                                        </Text>
                                        <Text className="text-white text-base leading-7">
                                            {translation.explanation}
                                        </Text>
                                    </View>
                                )
                            }
                        </View>
                    </Animated.View>
                ) : (
                    <View className="flex-1 items-center justify-center py-16 gap-4">
                        <Ionicons name="language" size={64} color="#F59E0B" />
                        <Text className="text-white text-base text-center">
                            Translate this question to Nepali
                        </Text>
                        <Button variant="primary" onPress={fetchTranslation}>
                            Translate to नेपाली
                        </Button>
                    </View>
                )
            }
        </ScrollView>
    );

    const renderAskTab = () => (
        <View className="flex-1 mt-4">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {
                    conversation.length === 0 ? (
                        <View className="items-center py-8 gap-3">
                            <Ionicons name="chatbubbles-outline" size={48} color="#737373" />
                            <Text className="text-neutral-500 text-base text-center">
                                Ask any follow-up question about this topic
                            </Text>
                            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
                                {
                                    [
                                        'Why is this the correct answer?',
                                        'Give me a memory tip',
                                        'Explain in simpler terms',
                                    ].map((suggestion, idx) => (
                                        <Pressable
                                            key={idx}
                                            onPress={() => setAskQuery(suggestion)}
                                            className="px-4 py-2 bg-neutral-800 rounded-full active:opacity-70"
                                        >
                                            <Text className="text-amber-500 text-sm">{suggestion}</Text>
                                        </Pressable>
                                    ))
                                }
                            </View>
                        </View>
                    ) : (
                        conversation.map((msg, idx) => (
                            <Animated.View
                                key={idx}
                                entering={FadeIn.duration(200)}
                                className={`max-w-[80%] p-3 rounded-2xl mb-2 ${msg.role === 'user'
                                    ? 'self-end bg-amber-500 rounded-br-sm'
                                    : 'self-start bg-neutral-800 rounded-bl-sm'
                                    }`}
                            >
                                <Text
                                    className={`text-base leading-6 ${msg.role === 'user' ? 'text-black' : 'text-white'
                                        }`}
                                >
                                    {msg.content}
                                </Text>
                            </Animated.View>
                        ))
                    )
                }

                {
                    loading && (
                        <View className="self-start bg-neutral-800 p-3 rounded-2xl rounded-bl-sm mb-2">
                            <ActivityIndicator size="small" color="#F59E0B" />
                        </View>
                    )
                }
            </ScrollView>

            <View className="flex-row items-end gap-2 p-2 bg-neutral-900 rounded-xl border border-neutral-800 mt-3 mb-3">
                <TextInput
                    className="flex-1 text-white text-base max-h-24 px-2 py-1"
                    placeholder="Ask a follow-up question..."
                    placeholderTextColor="#737373"
                    value={askQuery}
                    onChangeText={setAskQuery}
                    multiline
                    maxLength={500}
                />
                <Pressable
                    onPress={sendQuestion}
                    disabled={!askQuery.trim() || loading}
                    className={`w-9 h-9 rounded-full items-center justify-center ${askQuery.trim() ? 'bg-amber-500' : 'bg-neutral-700 opacity-50'
                        }`}
                >
                    <Ionicons name="send" size={18} color="#fff" />
                </Pressable>
            </View>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'explain':
                return renderExplainTab();
            case 'translate':
                return renderTranslateTab();
            case 'ask':
                return renderAskTab();
        }
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={handleClose}
            snapPoints={[0.65, 0.9]}
            initialSnapIndex={0}
        >
            <View className="flex-1 px-4">
                <View className="flex-row items-center justify-between py-3 border-b border-neutral-800">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="sparkles" size={24} color="#F59E0B" />
                        <Text className="text-white text-lg font-semibold">AI Assistant</Text>
                    </View>
                    <Pressable onPress={handleClose} hitSlop={10}>
                        <Ionicons name="close" size={24} color="#737373" />
                    </Pressable>
                </View>
                <View className="flex-row bg-neutral-900 rounded-xl p-1 mt-3">
                    {
                        tabs.map((tab) => (
                            <Pressable
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key)}
                                className={`flex-1 flex-row items-center justify-center gap-1 py-2 rounded-lg ${activeTab === tab.key ? 'bg-neutral-800' : ''
                                    }`}
                            >
                                <Ionicons
                                    name={tab.icon}
                                    size={18}
                                    color={activeTab === tab.key ? '#F59E0B' : '#737373'}
                                />
                                <Text
                                    className={`text-sm font-medium ${activeTab === tab.key ? 'text-amber-500' : 'text-neutral-500'
                                        }`}
                                >
                                    {tab.label}
                                </Text>
                            </Pressable>
                        ))
                    }
                </View>

                {renderTabContent()}
            </View>
        </BottomSheet>
    );
}

export default AIExplanationSheet;