/**
 * Auth Store
 * 
 * Global authentication state using Zustand.
 * Handles user session and auth flow.
 */

import { create } from 'zustand';
import { 
    api, User, clearTokens, getAccessToken 
} from './api';

export interface AuthState {
    // State
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Auth flow state
    phoneNumber: string;
    isOtpSent: boolean;
    isVerifying: boolean;

    // Actions
    initialize: () => Promise<void>;
    setPhoneNumber: (phone: string) => void;
    sendOtp: (phone: string) => Promise<boolean>;
    verifyOtp: (otp: string) => Promise<{ success: boolean; isNewUser?: boolean }>;
    logout: () => Promise<void>;
    updateUser: (user: Partial<User>) => void;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
    phoneNumber: '',
    isOtpSent: false,
    isVerifying: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
    ...initialState,

    initialize: async () => {
        try {
            const token = await getAccessToken();
            if (!token) {
                set({ isInitialized: true });
                return;
            }

            // Validate token by fetching user
            const user = await api.user.getMe();
            set({
                user,
                isAuthenticated: true,
                isInitialized: true,
            });
        } catch (error) {
            // Token invalid or expired
            await clearTokens();
            set({ isInitialized: true });
        }
    },

    setPhoneNumber: (phone: string) => {
        set({ phoneNumber: phone, error: null });
    },

    sendOtp: async (phone: string) => {
        set({ isLoading: true, error: null, phoneNumber: phone });
        try {
            await api.auth.sendOTP(phone);
            set({ isOtpSent: true, isLoading: false });
            return true;
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to send OTP',
            });
            return false;
        }
    },

    verifyOtp: async (otp: string) => {
        const { phoneNumber } = get();
        set({ isVerifying: true, error: null });

        try {
            const response = await api.auth.verifyOTP(phoneNumber, otp);

            // After OTP verification, fetch full user data
            const user = await api.user.getMe();
            
            const isNewUser = !response.user.onboardingComplete;

            set({
                user,
                isAuthenticated: true,
                isVerifying: false,
                isOtpSent: false,
            });

            return { success: true, isNewUser };
        } catch (error: any) {
            set({
                isVerifying: false,
                error: error.message || 'Invalid OTP',
            });
            return { success: false };
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await api.auth.logout();
        } catch {
            // Ignore logout errors
        }
        set({
            ...initialState,
            isInitialized: true,
        });
    },

    updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
            set({ user: { ...user, ...updates } });
        }
    },

    clearError: () => {
        set({ error: null });
    },

    reset: () => {
        set({
            phoneNumber: '',
            isOtpSent: false,
            isVerifying: false,
            error: null,
        });
    },
}));