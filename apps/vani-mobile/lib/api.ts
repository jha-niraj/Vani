import * as SecureStore from 'expo-secure-store';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const API_VERSION = '/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'prepsathi_access_token';
const REFRESH_TOKEN_KEY = 'prepsathi_refresh_token';

// Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ApiError {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
}

export class ApiException extends Error {
    statusCode: number;
    errors?: Record<string, string[]>;

    constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
        super(message);
        this.name = 'ApiException';
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

// Token management
export async function getAccessToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// Request helper
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
): Promise<T> {
    const url = `${API_BASE_URL}${API_VERSION}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    // Add auth header if required
    if (requiresAuth) {
        const token = await getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle 401 - try to refresh token
            if (response.status === 401 && requiresAuth) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    // Retry the request with new token
                    return request(endpoint, options, requiresAuth);
                }
                // Refresh failed - clear tokens and throw
                await clearTokens();
            }

            throw new ApiException(
                data.message || 'An error occurred',
                response.status,
                data.errors
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiException) {
            throw error;
        }
        throw new ApiException('Network error. Please check your connection.', 0);
    }
}

// Refresh token
async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        await setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
    } catch {
        return false;
    }
}

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
    sendOTP: async (phone: string) => {
        const response = await request<{ success: boolean; data: { message: string; expiresAt: string } }>(
            '/auth/send-otp',
            {
                method: 'POST',
                body: JSON.stringify({ phone }),
            },
            false
        );
        return response.data;
    },

    verifyOTP: async (phone: string, otp: string) => {
        const response = await request<{
            success: boolean;
            data: {
                accessToken: string;
                refreshToken: string;
                user: {
                    id: string;
                    phone: string;
                    username: string | null;
                    name: string | null;
                    onboardingComplete: boolean;
                };
            };
        }>(
            '/auth/verify-otp',
            {
                method: 'POST',
                body: JSON.stringify({ phone, otp }),
            },
            false
        );

        await setTokens(response.data.accessToken, response.data.refreshToken);
        return response.data;
    },

    logout: async () => {
        try {
            await request('/auth/logout', { method: 'POST' });
        } finally {
            await clearTokens();
        }
    },
};

// =============================================================================
// USER API
// =============================================================================

export interface User {
    id: string;
    phone: string;
    username: string | null;
    name: string | null;
    email: string | null;
    avatar: string | null;
    preferences: {
        dailyGoal: string;
        reminderEnabled: boolean;
        reminderTime: string | null;
        language: string;
        theme: string;
    };
    currentExam: {
        type: { id: string; name: string; nameNp: string | null } | null;
        level: { id: string; name: string; nameNp: string | null } | null;
    } | null;
    progress: {
        totalQuestionsAttempted: number;
        totalCorrect: number;
        currentStreak: number;
        longestStreak: number;
    } | null;
    onboardingComplete: boolean;
    createdAt: string;
}

export const userApi = {
    getMe: async () => {
        const response = await request<{ success: boolean; data: User }>('/users/me');
        return response.data;
    },

    updateProfile: async (data: {
        name?: string;
        email?: string | null;
    }) => {
        const response = await request<{ success: boolean; data: User }>('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    setUsername: async (username: string) => {
        const response = await request<{ success: boolean; data: { username: string } }>(
            '/users/username',
            {
                method: 'POST',
                body: JSON.stringify({ username }),
            }
        );
        return response.data;
    },

    checkUsername: async (username: string) => {
        const response = await request<{ success: boolean; data: { available: boolean; suggestions?: string[] } }>(
            `/users/check-username?username=${encodeURIComponent(username)}`,
            { method: 'GET' }
        );
        return response.data;
    },

    updatePreferences: async (data: {
        dailyGoal?: string;
        reminderEnabled?: boolean;
        reminderTime?: string;
        language?: string;
        theme?: string;
    }) => {
        const response = await request<{ success: boolean; data: User['preferences'] }>(
            '/users/preferences',
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        );
        return response.data;
    },

    selectExam: async (examTypeId: string, examLevelId: string) => {
        const response = await request<{ success: boolean; data: { examTypeId: string; examLevelId: string } }>(
            '/users/select-exam',
            {
                method: 'POST',
                body: JSON.stringify({ examTypeId, examLevelId }),
            }
        );
        return response.data;
    },
};

// =============================================================================
// EXAM API
// =============================================================================

export interface ExamType {
    id: string;
    name: string;
    nameNp: string | null;
    description: string | null;
    descriptionNp: string | null;
    icon: string | null;
}

export interface ExamLevel {
    id: string;
    name: string;
    nameNp: string | null;
    description: string | null;
    descriptionNp: string | null;
    code: string | null;
    icon: string | null;
}

export interface Subject {
    id: string;
    name: string;
    nameNp: string | null;
    description: string | null;
    icon: string | null;
    color: string | null;
    order: number;
    totalQuestions: number;
    progress?: {
        attempted: number;
        correct: number;
        accuracy: number;
    };
}

export interface Topic {
    id: string;
    name: string;
    nameNp: string | null;
    description: string | null;
    order: number;
    totalQuestions: number;
    progress?: {
        attempted: number;
        correct: number;
    };
}

export const examApi = {
    getExamTypes: async () => {
        const response = await request<{ success: boolean; data: ExamType[] }>(
            '/exams/types',
            { method: 'GET' },
            false
        );
        return response.data;
    },

    getLevels: async (examTypeId: string) => {
        const response = await request<{ success: boolean; data: ExamLevel[] }>(
            `/exams/types/${examTypeId}/levels`,
            { method: 'GET' },
            false
        );
        return response.data;
    },

    getLevelDetails: async (levelId: string) => {
        const response = await request<{
            success: boolean;
            data: {
                id: string;
                name: string;
                nameNp: string | null;
                examType: { id: string; name: string; nameNp: string | null };
                phases: Array<{
                    id: string;
                    name: string;
                    nameNp: string | null;
                    description: string | null;
                    type: string;
                }>;
                subjects: Subject[];
            };
        }>(`/exams/levels/${levelId}`, { method: 'GET' });
        return response.data;
    },

    getSubjects: async (levelId: string) => {
        const response = await request<{ success: boolean; data: Subject[] }>(
            `/exams/levels/${levelId}/subjects`,
            { method: 'GET' }
        );
        return response.data;
    },

    getTopics: async (subjectId: string) => {
        const response = await request<{ success: boolean; data: Topic[] }>(
            `/exams/subjects/${subjectId}/topics`,
            { method: 'GET' }
        );
        return response.data;
    },
};

// =============================================================================
// PRACTICE API
// =============================================================================

export interface Question {
    id: string;
    question: string;
    questionNp: string | null;
    options: Record<string, string>;
    optionsNp: Record<string, string> | null;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    subject: { id: string; name: string };
    topic: { id: string; name: string } | null;
    isBookmarked: boolean;
    // Only available after answering
    correctAnswer?: string;
    explanation?: string;
    explanationNp?: string | null;
}

export interface SubmitAnswerResult {
    isCorrect: boolean;
    isSkipped: boolean;
    correctAnswer: string;
    explanation: string | null;
    explanationNp: string | null;
    stats: {
        today: {
            questionsCompleted: number;
            questionsCorrect: number;
            goal: number;
            goalMet: boolean;
        };
        streak: number;
    };
}

export const practiceApi = {
    getQuestions: async (params: {
        subjectId?: string;
        topicId?: string;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        limit?: number;
        filter?: 'all' | 'unattempted' | 'incorrect' | 'bookmarked';
    }) => {
        const query = new URLSearchParams();
        if (params.subjectId) query.set('subjectId', params.subjectId);
        if (params.topicId) query.set('topicId', params.topicId);
        if (params.difficulty) query.set('difficulty', params.difficulty);
        if (params.limit) query.set('limit', params.limit.toString());
        if (params.filter) query.set('filter', params.filter);

        const response = await request<{
            success: boolean;
            data: { questions: Question[]; total: number };
        }>(`/practice/questions?${query.toString()}`, { method: 'GET' });
        return response.data;
    },

    getQuestionWithAnswer: async (questionId: string) => {
        const response = await request<{ success: boolean; data: Question & { correctAnswer: string; explanation: string } }>(
            `/practice/questions/${questionId}`,
            { method: 'GET' }
        );
        return response.data;
    },

    submitAnswer: async (data: {
        questionId: string;
        selectedAnswer: string | null;
        timeTakenSeconds?: number;
        sessionType?: 'practice' | 'quick_quiz' | 'mock_test';
    }) => {
        const response = await request<{ success: boolean; data: SubmitAnswerResult }>(
            '/practice/submit',
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        );
        return response.data;
    },

    toggleBookmark: async (questionId: string, note?: string) => {
        const response = await request<{
            success: boolean;
            data: { isBookmarked: boolean; bookmark: { id: string } | null };
        }>('/practice/bookmark', {
            method: 'POST',
            body: JSON.stringify({ questionId, note }),
        });
        return response.data;
    },

    getBookmarks: async (page = 1, limit = 20) => {
        const response = await request<{
            success: boolean;
            data: {
                bookmarks: Array<{
                    id: string;
                    note: string | null;
                    createdAt: string;
                    question: Question;
                }>;
                total: number;
                page: number;
                limit: number;
            };
        }>(`/practice/bookmarks?page=${page}&limit=${limit}`, { method: 'GET' });
        return response.data;
    },

    getDailyChallenge: async () => {
        const response = await request<{
            success: boolean;
            data: {
                questions: Question[];
                total: number;
                completed: number;
                correct: number;
            };
        }>('/practice/daily-challenge', { method: 'GET' });
        return response.data;
    },
};

// =============================================================================
// PROGRESS API
// =============================================================================

export interface ProgressOverview {
    overall: {
        totalQuestionsAttempted: number;
        totalCorrect: number;
        totalIncorrect: number;
        totalSkipped: number;
        accuracy: number;
        totalTimeSpentMinutes: number;
    };
    streak: {
        current: number;
        longest: number;
        lastPracticeDate: string | null;
    };
    today: {
        questionsCompleted: number;
        questionsCorrect: number;
        goal: number;
        goalMet: boolean;
        timeSpentMinutes: number;
    };
}

export interface SubjectProgress {
    id: string;
    name: string;
    nameNp: string | null;
    icon: string | null;
    color: string | null;
    totalQuestions: number;
    attempted: number;
    correct: number;
    accuracy: number;
    completion: number;
}

export interface WeeklyProgress {
    date: string;
    dayOfWeek: string;
    questionsCompleted: number;
    questionsCorrect: number;
    goalMet: boolean;
    timeSpentMinutes: number;
}

export interface RecentActivity {
    id: string;
    questionId: string;
    isCorrect: boolean;
    isSkipped: boolean;
    attemptedAt: string;
    subject: { name: string };
    topic: { name: string } | null;
}

export const progressApi = {
    getOverview: async () => {
        const response = await request<{ success: boolean; data: ProgressOverview }>(
            '/progress/overview',
            { method: 'GET' }
        );
        return response.data;
    },

    getSubjectProgress: async () => {
        const response = await request<{ success: boolean; data: SubjectProgress[] }>(
            '/progress/subjects',
            { method: 'GET' }
        );
        return response.data;
    },

    getWeeklyProgress: async () => {
        const response = await request<{ success: boolean; data: WeeklyProgress[] }>(
            '/progress/weekly',
            { method: 'GET' }
        );
        return response.data;
    },

    getRecentActivity: async (limit = 10) => {
        const response = await request<{ success: boolean; data: RecentActivity[] }>(
            `/progress/recent?limit=${limit}`,
            { method: 'GET' }
        );
        return response.data;
    },

    getLeaderboard: async (period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly') => {
        const response = await request<{
            success: boolean;
            data: {
                leaderboard: Array<{
                    userId: string;
                    username: string;
                    name: string | null;
                    avatar: string | null;
                    questionsCompleted: number;
                    accuracy: number;
                    rank: number;
                }>;
                userRank: number | null;
            };
        }>(`/progress/leaderboard?period=${period}`, { method: 'GET' });
        return response.data;
    },
};

// =============================================================================
// AI API
// =============================================================================

export interface AIExplanation {
    questionId: string;
    explanation: string;
    correctAnswer: string;
    subject: string;
    topic: string;
}

export interface AITranslation {
    questionId: string;
    question: string;
    options: { a: string; b: string; c: string; d: string };
    explanation: string | null;
    cached: boolean;
}

export interface AIAskResponse {
    questionId: string;
    query: string;
    response: string;
}

export interface AIStatus {
    available: boolean;
    features: {
        explain: boolean;
        ask: boolean;
        translate: boolean;
    };
}

export const aiApi = {
    /**
     * Check if AI features are available
     */
    getStatus: async () => {
        const response = await request<{ success: boolean; data: AIStatus }>(
            '/ai/status',
            { method: 'GET' },
            false
        );
        return response.data;
    },

    /**
     * Get AI explanation for a question
     */
    explainQuestion: async (questionId: string) => {
        const response = await request<{ success: boolean; data: AIExplanation }>(
            '/ai/explain',
            {
                method: 'POST',
                body: JSON.stringify({ questionId }),
            }
        );
        return response.data;
    },

    /**
     * Ask a follow-up question about a specific MCQ
     */
    askQuestion: async (questionId: string, query: string, context?: string) => {
        const response = await request<{ success: boolean; data: AIAskResponse }>(
            '/ai/ask',
            {
                method: 'POST',
                body: JSON.stringify({ questionId, query, context }),
            }
        );
        return response.data;
    },

    /**
     * Translate a question to Nepali
     */
    translateQuestion: async (questionId: string, targetLanguage: 'np' | 'en' = 'np') => {
        const response = await request<{ success: boolean; data: AITranslation }>(
            '/ai/translate',
            {
                method: 'POST',
                body: JSON.stringify({ questionId, targetLanguage }),
            }
        );
        return response.data;
    },
};

// Export all APIs
export const api = {
    auth: authApi,
    user: userApi,
    exam: examApi,
    practice: practiceApi,
    progress: progressApi,
    ai: aiApi,
};