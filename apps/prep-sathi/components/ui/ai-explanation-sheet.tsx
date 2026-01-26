/**
 * AIExplanationSheet Component
 * 
 * A bottom sheet that shows AI-powered explanations for questions.
 * Includes explanation, translation, and follow-up question features.
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { 
    Spacing, 
    BorderRadius, 
    FontSizes,
} from '@/constants/theme';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
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
    const { colors, brand } = useTheme();
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
            setExplanation(response.data);
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
            setTranslation(response.data);
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
        setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);
        setError(null);
        
        try {
            const context = conversation
                .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
                .join('\n');
            
            const response = await aiApi.askQuestion(question.id, userMessage, context);
            setConversation(prev => [...prev, { role: 'assistant', content: response.data.response }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get response');
            setConversation(prev => prev.slice(0, -1));
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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'explain':
                return (
                    <ScrollView 
                        style={styles.tabContent} 
                        showsVerticalScrollIndicator={false}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={brand.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Getting AI explanation...
                                </Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color={colors.error} />
                                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                                <Button variant="outline" size="sm" onPress={fetchExplanation}>
                                    Try Again
                                </Button>
                            </View>
                        ) : explanation ? (
                            <Animated.View entering={FadeIn.duration(300)}>
                                <View style={[styles.questionBox, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
                                        Question
                                    </Text>
                                    <Text style={[styles.questionText, { color: colors.text }]}>
                                        {question.question}
                                    </Text>
                                    <View style={styles.answerBadge}>
                                        <Text style={[styles.answerLabel, { color: colors.success }]}>
                                            Correct: {explanation.correctAnswer.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.explanationSection}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="bulb" size={20} color={colors.warning} />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            AI Explanation
                                        </Text>
                                    </View>
                                    <Text style={[styles.explanationText, { color: colors.text }]}>
                                        {explanation.explanation}
                                    </Text>
                                </View>
                            </Animated.View>
                        ) : null}
                    </ScrollView>
                );
                
            case 'translate':
                return (
                    <ScrollView 
                        style={styles.tabContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={brand.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Translating...
                                </Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color={colors.error} />
                                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                                <Button variant="outline" size="sm" onPress={fetchTranslation}>
                                    Try Again
                                </Button>
                            </View>
                        ) : translation ? (
                            <Animated.View entering={FadeIn.duration(300)}>
                                <View style={[styles.translatedBox, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.translatedLabel, { color: colors.textSecondary }]}>
                                        {isNepali ? 'नेपालीमा' : 'In Nepali'}
                                    </Text>
                                    <Text style={[styles.translatedQuestion, { color: colors.text }]}>
                                        {translation.question}
                                    </Text>
                                    
                                    <View style={styles.optionsList}>
                                        {(['a', 'b', 'c', 'd'] as const).map((key) => (
                                            <View key={key} style={styles.optionRow}>
                                                <Text style={[
                                                    styles.optionKey, 
                                                    { 
                                                        color: question.correctAnswer === key 
                                                            ? colors.success 
                                                            : colors.textSecondary 
                                                    }
                                                ]}>
                                                    {key.toUpperCase()})
                                                </Text>
                                                <Text style={[styles.optionText, { color: colors.text }]}>
                                                    {translation.options[key]}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                    
                                    {translation.explanation && (
                                        <View style={styles.translatedExplanation}>
                                            <Text style={[styles.translatedLabel, { color: colors.textSecondary }]}>
                                                Explanation
                                            </Text>
                                            <Text style={[styles.explanationText, { color: colors.text }]}>
                                                {translation.explanation}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        ) : (
                            <View style={styles.translatePrompt}>
                                <Ionicons name="language" size={64} color={brand.primary} />
                                <Text style={[styles.translatePromptText, { color: colors.text }]}>
                                    Translate this question to Nepali
                                </Text>
                                <Button variant="primary" onPress={fetchTranslation}>
                                    Translate to नेपाली
                                </Button>
                            </View>
                        )}
                    </ScrollView>
                );
                
            case 'ask':
                return (
                    <View style={styles.askContainer}>
                        <ScrollView 
                            style={styles.conversationList}
                            showsVerticalScrollIndicator={false}
                        >
                            {conversation.length === 0 ? (
                                <View style={styles.askPrompt}>
                                    <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                                    <Text style={[styles.askPromptText, { color: colors.textSecondary }]}>
                                        Ask any follow-up question about this topic
                                    </Text>
                                    <View style={styles.suggestionChips}>
                                        {[
                                            'Why is this the correct answer?',
                                            'Give me a memory tip',
                                            'Explain in simpler terms',
                                        ].map((suggestion, idx) => (
                                            <Pressable
                                                key={idx}
                                                style={[
                                                    styles.suggestionChip,
                                                    { backgroundColor: colors.backgroundSecondary }
                                                ]}
                                                onPress={() => setAskQuery(suggestion)}
                                            >
                                                <Text style={[styles.suggestionText, { color: brand.primary }]}>
                                                    {suggestion}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                conversation.map((msg, idx) => (
                                    <Animated.View
                                        key={idx}
                                        entering={FadeIn.duration(200)}
                                        style={[
                                            styles.messageBubble,
                                            msg.role === 'user' 
                                                ? [styles.userBubble, { backgroundColor: brand.primary }]
                                                : [styles.assistantBubble, { backgroundColor: colors.backgroundSecondary }]
                                        ]}
                                    >
                                        <Text style={[
                                            styles.messageText,
                                            { color: msg.role === 'user' ? '#fff' : colors.text }
                                        ]}>
                                            {msg.content}
                                        </Text>
                                    </Animated.View>
                                ))
                            )}
                            {loading && (
                                <View style={[styles.assistantBubble, styles.messageBubble, { backgroundColor: colors.backgroundSecondary }]}>
                                    <ActivityIndicator size="small" color={brand.primary} />
                                </View>
                            )}
                        </ScrollView>
                        
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Ask a follow-up question..."
                                placeholderTextColor={colors.textSecondary}
                                value={askQuery}
                                onChangeText={setAskQuery}
                                multiline
                                maxLength={500}
                            />
                            <Pressable
                                style={[
                                    styles.sendButton,
                                    { 
                                        backgroundColor: askQuery.trim() ? brand.primary : colors.border,
                                        opacity: askQuery.trim() ? 1 : 0.5
                                    }
                                ]}
                                onPress={sendQuestion}
                                disabled={!askQuery.trim() || loading}
                            >
                                <Ionicons name="send" size={18} color="#fff" />
                            </Pressable>
                        </View>
                    </View>
                );
        }
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={handleClose}
            snapPoints={[0.65, 0.9]}
            initialSnapIndex={0}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <View style={styles.headerContent}>
                        <Ionicons name="sparkles" size={24} color={brand.secondary} />
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            AI Assistant
                        </Text>
                    </View>
                    <Pressable onPress={handleClose} hitSlop={10}>
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </Pressable>
                </View>

                {/* Tabs */}
                <View style={[styles.tabBar, { backgroundColor: colors.backgroundSecondary }]}>
                    {tabs.map((tab) => (
                        <Pressable
                            key={tab.key}
                            style={[
                                styles.tab,
                                activeTab === tab.key && [
                                    styles.activeTab, 
                                    { backgroundColor: colors.background }
                                ]
                            ]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons 
                                name={tab.icon} 
                                size={18} 
                                color={activeTab === tab.key ? brand.primary : colors.textSecondary} 
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: activeTab === tab.key ? brand.primary : colors.textSecondary }
                            ]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Tab Content */}
                {renderTabContent()}
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.base,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        borderRadius: BorderRadius.lg,
        padding: 4,
        marginTop: Spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    activeTab: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    tabContent: {
        flex: 1,
        marginTop: Spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
    },
    loadingText: {
        fontSize: FontSizes.sm,
        marginTop: Spacing.sm,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
        gap: Spacing.sm,
    },
    errorText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
    questionBox: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    questionLabel: {
        fontSize: FontSizes.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    questionText: {
        fontSize: FontSizes.base,
        lineHeight: 24,
    },
    answerBadge: {
        marginTop: Spacing.sm,
    },
    answerLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    explanationSection: {
        marginTop: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    explanationText: {
        fontSize: FontSizes.base,
        lineHeight: 26,
    },
    translatedBox: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    translatedLabel: {
        fontSize: FontSizes.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    translatedQuestion: {
        fontSize: FontSizes.lg,
        lineHeight: 28,
        marginBottom: Spacing.md,
    },
    optionsList: {
        gap: Spacing.xs,
    },
    optionRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    optionKey: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        width: 24,
    },
    optionText: {
        fontSize: FontSizes.base,
        flex: 1,
    },
    translatedExplanation: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    translatePrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
        gap: Spacing.md,
    },
    translatePromptText: {
        fontSize: FontSizes.base,
        textAlign: 'center',
    },
    askContainer: {
        flex: 1,
        marginTop: Spacing.md,
    },
    conversationList: {
        flex: 1,
    },
    askPrompt: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
    },
    askPromptText: {
        fontSize: FontSizes.base,
        textAlign: 'center',
    },
    suggestionChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    suggestionChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    suggestionText: {
        fontSize: FontSizes.sm,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: Spacing.sm,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xs,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: FontSizes.base,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.xs,
        padding: Spacing.xs,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSizes.base,
        maxHeight: 100,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AIExplanationSheet;
