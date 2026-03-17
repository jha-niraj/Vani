import { useState, useEffect, useCallback } from 'react';
import { api, ApiException } from '@/lib/api';
import type {
    User, ExamType, ExamLevel, Subject, Topic, Question, 
    ProgressOverview, SubjectProgress, WeeklyProgress,
} from '@/lib/api';

// =============================================================================
// GENERIC HOOK
// =============================================================================

interface UseApiState<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

function useApi<T>(
    fetcher: () => Promise<T>,
    dependencies: unknown[] = []
): UseApiState<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
        } catch (err) {
            if (err instanceof ApiException) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    }, dependencies);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, isLoading, error, refetch: fetch };
}

// =============================================================================
// USER HOOKS
// =============================================================================

export function useUser() {
    return useApi<User>(() => api.user.getMe(), []);
}

// =============================================================================
// EXAM HOOKS
// =============================================================================

export function useExamTypes() {
    return useApi<ExamType[]>(() => api.exam.getExamTypes(), []);
}

export function useExamLevels(examTypeId: string | null) {
    return useApi<ExamLevel[]>(
        async () => {
            if (!examTypeId) return [];
            return api.exam.getLevels(examTypeId);
        },
        [examTypeId]
    );
}

export function useSubjects(levelId: string | null) {
    return useApi<Subject[]>(
        async () => {
            if (!levelId) return [];
            return api.exam.getSubjects(levelId);
        },
        [levelId]
    );
}

export function useTopics(subjectId: string | null) {
    return useApi<Topic[]>(
        async () => {
            if (!subjectId) return [];
            return api.exam.getTopics(subjectId);
        },
        [subjectId]
    );
}

// =============================================================================
// PRACTICE HOOKS
// =============================================================================

interface UseQuestionsOptions {
    subjectId?: string;
    topicId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    limit?: number;
    filter?: 'all' | 'unattempted' | 'incorrect' | 'bookmarked';
}

export function useQuestions(options: UseQuestionsOptions = {}) {
    return useApi<{ questions: Question[]; total: number }>(
        () => api.practice.getQuestions(options),
        [options.subjectId, options.topicId, options.difficulty, options.limit, options.filter]
    );
}

// =============================================================================
// PROGRESS HOOKS
// =============================================================================

export function useProgressOverview() {
    return useApi<ProgressOverview>(() => api.progress.getOverview(), []);
}

export function useSubjectProgress() {
    return useApi<SubjectProgress[]>(() => api.progress.getSubjectProgress(), []);
}

export function useWeeklyProgress() {
    return useApi<WeeklyProgress[]>(() => api.progress.getWeeklyProgress(), []);
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

interface UseMutationState<TData, TVariables> {
    mutate: (variables: TVariables) => Promise<TData>;
    data: TData | null;
    isLoading: boolean;
    error: string | null;
    reset: () => void;
}

export function useMutation<TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>
): UseMutationState<TData, TVariables> {
    const [data, setData] = useState<TData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = async (variables: TVariables): Promise<TData> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutationFn(variables);
            setData(result);
            return result;
        } catch (err) {
            if (err instanceof ApiException) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setData(null);
        setError(null);
        setIsLoading(false);
    };

    return { mutate, data, isLoading, error, reset };
}

// Pre-built mutation hooks
export function useSubmitAnswer() {
    return useMutation(api.practice.submitAnswer);
}

export function useToggleBookmark() {
    return useMutation((questionId: string) => api.practice.toggleBookmark(questionId));
}

export function useSelectExam() {
    return useMutation(({ examTypeId, examLevelId }: { examTypeId: string; examLevelId: string }) =>
        api.user.selectExam(examTypeId, examLevelId)
    );
}

export function useSetUsername() {
    return useMutation((username: string) => api.user.setUsername(username));
}

export function useUpdateProfile() {
    return useMutation(api.user.updateProfile);
}
