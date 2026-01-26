/**
 * API Client
 * 
 * Centralized API client for PrepSathi mobile app.
 * Handles authentication, request/response, and error handling.
 */

import * as SecureStore from 'expo-secure-store';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

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
    const url = `${API_BASE_URL}${endpoint}`;

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
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        await setTokens(data.accessToken, data.refreshToken);
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
        return request<{ message: string; expiresAt: string }>(
            '/api/auth/send-otp',
            {
                method: 'POST',
                body: JSON.stringify({ phone }),
            },
            false
        );
    },

    verifyOTP: async (phone: string, otp: string) => {
        const data = await request<{
            accessToken: string;
            refreshToken: string;
            user: {
                id: string;
                phone: string;
                username: string | null;
                isNewUser: boolean;
            };
        }>(
            '/api/auth/verify-otp',
            {
                method: 'POST',
                body: JSON.stringify({ phone, otp }),
            },
            false
        );

        await setTokens(data.accessToken, data.refreshToken);
        return data;
    },

    logout: async () => {
        try {
            await request('/api/auth/logout', { method: 'POST' });
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
    displayName: string | null;
    avatarUrl: string | null;
    dailyGoal: string;
    selectedExamId: string | null;
    selectedLevelId: string | null;
    createdAt: string;
}

export const userApi = {
    getMe: async () => {
        return request<User>('/api/users/me');
    },

    updateProfile: async (data: {
        displayName?: string;
        avatarUrl?: string;
        dailyGoal?: string;
    }) => {
        return request<User>('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    setUsername: async (username: string) => {
        return request<{ username: string }>('/api/users/username', {
            method: 'POST',
            body: JSON.stringify({ username }),
        });
    },

    checkUsername: async (username: string) => {
        return request<{ available: boolean; suggestions?: string[] }>(
            `/api/users/check-username?username=${encodeURIComponent(username)}`,
            { method: 'GET' }
        );
    },

    selectExam: async (examTypeId: string, levelId?: string) => {
        return request<{ examTypeId: string; levelId?: string }>(
            '/api/users/select-exam',
            {
                method: 'POST',
                body: JSON.stringify({ examTypeId, levelId }),
            }
        );
    },
};

// =============================================================================
// EXAM API
// =============================================================================

export interface ExamType {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    hasLevels: boolean;
    isActive: boolean;
}

export interface ExamLevel {
    id: string;
    name: string;
    slug: string;
    description: string;
    order: number;
}

export interface Subject {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    order: number;
    questionCount: number;
}

export interface Topic {
    id: string;
    name: string;
    slug: string;
    description: string;
    order: number;
    questionCount: number;
}

export const examApi = {
    getExamTypes: async () => {
        return request<ExamType[]>('/api/exams/types', { method: 'GET' }, false);
    },

    getLevels: async (examTypeId: string) => {
        return request<ExamLevel[]>(`/api/exams/levels/${examTypeId}`, { method: 'GET' }, false);
    },

    getSubjects: async (levelId: string) => {
        return request<Subject[]>(`/api/exams/subjects/${levelId}`, { method: 'GET' });
    },

    getTopics: async (subjectId: string) => {
        return request<Topic[]>(`/api/exams/topics/${subjectId}`, { method: 'GET' });
    },
};

// =============================================================================
// PRACTICE API
// =============================================================================

export interface Question {
    id: string;
    questionNumber: number;
    text: string;
    options: { key: string; text: string }[];
    difficulty: string;
    explanation?: string;
    correctAnswer?: string;
}

export interface QuizSession {
    id: string;
    quizType: string;
    questionCount: number;
    timeLimit: number | null;
    status: string;
    startedAt: string;
}

export interface QuizResult {
    sessionId: string;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    skipped: number;
    accuracy: number;
    timeSpent: number;
}

export const practiceApi = {
    startSession: async (params: {
        quizType: string;
        subjectId?: string;
        topicId?: string;
        questionCount?: number;
        timeLimit?: number;
        difficulty?: string;
    }) => {
        return request<QuizSession>('/api/practice/start', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    },

    getQuestions: async (sessionId: string) => {
        return request<Question[]>(`/api/practice/questions?sessionId=${sessionId}`, {
            method: 'GET',
        });
    },

    submitAnswer: async (data: {
        sessionId: string;
        questionId: string;
        answer: string;
        timeSpent: number;
    }) => {
        return request<{
            isCorrect: boolean;
            correctAnswer: string;
            explanation?: string;
        }>('/api/practice/answer', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    completeSession: async (sessionId: string) => {
        return request<QuizResult>('/api/practice/complete', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
        });
    },
};

// =============================================================================
// PROGRESS API
// =============================================================================

export interface DashboardStats {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    longestStreak: number;
    todayQuestions: number;
    todayGoal: number;
    weeklyProgress: { date: string; questions: number; correct: number }[];
}

export interface SubjectProgress {
    subjectId: string;
    subjectName: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    lastPracticed: string | null;
}

export interface WeakTopic {
    topicId: string;
    topicName: string;
    subjectName: string;
    accuracy: number;
    totalAttempts: number;
}

export const progressApi = {
    getDashboard: async () => {
        return request<DashboardStats>('/api/progress/dashboard', { method: 'GET' });
    },

    getSubjectProgress: async () => {
        return request<SubjectProgress[]>('/api/progress/subjects', { method: 'GET' });
    },

    getHistory: async (params?: { page?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());

        return request<{
            sessions: QuizResult[];
            total: number;
            page: number;
            limit: number;
        }>(`/api/progress/history?${query.toString()}`, { method: 'GET' });
    },

    getWeakTopics: async () => {
        return request<WeakTopic[]>('/api/progress/weak-topics', { method: 'GET' });
    },
};

// Export all APIs
export const api = {
    auth: authApi,
    user: userApi,
    exam: examApi,
    practice: practiceApi,
    progress: progressApi,
};