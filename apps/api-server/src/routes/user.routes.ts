import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from "express";
import { z } from "zod";
import prisma from "@repo/prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { BadRequestError, NotFoundError, ConflictError, ValidationError } from "../middleware/error.middleware.js";

export const userRouter: RouterType = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional().nullable(),
    dateOfBirth: z.string().datetime().optional().nullable(),
});

const setUsernameSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters")
        .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
});

const updatePreferencesSchema = z.object({
    dailyGoal: z.enum(["CASUAL", "REGULAR", "SERIOUS", "INTENSE"]).optional(),
    reminderEnabled: z.boolean().optional(),
    reminderTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
    language: z.enum(["EN", "NP"]).optional(),
    theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
});

const selectExamSchema = z.object({
    examTypeId: z.string().min(1, "Exam type is required"),
    examLevelId: z.string().min(1, "Exam level is required"),
});

// ============================================================================
// HELPERS
// ============================================================================

function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.errors.forEach((err) => {
            const path = err.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(err.message);
        });
        throw new ValidationError("Validation failed", errors);
    }
    return result.data;
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
userRouter.get(
    "/me",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            const user = await prisma.prepUser.findUnique({
                where: { id: userId },
                include: {
                    currentExamType: true,
                    currentExamLevel: true,
                    progress: true,
                },
            });

            if (!user) {
                throw new NotFoundError("User not found");
            }

            res.json({
                success: true,
                data: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    dateOfBirth: user.dateOfBirth,
                    preferences: {
                        dailyGoal: user.dailyGoal,
                        reminderEnabled: user.reminderEnabled,
                        reminderTime: user.reminderTime,
                        language: user.language,
                        theme: user.theme,
                    },
                    currentExam: user.currentExamType ? {
                        type: {
                            id: user.currentExamType.id,
                            name: user.currentExamType.name,
                            nameNp: user.currentExamType.nameNp,
                        },
                        level: user.currentExamLevel ? {
                            id: user.currentExamLevel.id,
                            name: user.currentExamLevel.name,
                            nameNp: user.currentExamLevel.nameNp,
                        } : null,
                    } : null,
                    progress: user.progress ? {
                        totalQuestionsAttempted: user.progress.totalQuestionsAttempted,
                        totalCorrect: user.progress.totalCorrect,
                        currentStreak: user.progress.currentStreak,
                        longestStreak: user.progress.longestStreak,
                    } : null,
                    onboardingComplete: !!(user.name && user.currentExamTypeId),
                    createdAt: user.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/v1/users/me
 * Update current user profile
 */
userRouter.patch(
    "/me",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const data = validateRequest(updateProfileSchema, req.body);

            const user = await prisma.prepUser.update({
                where: { id: userId },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.email !== undefined && { email: data.email }),
                    ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
                },
            });

            res.json({
                success: true,
                message: "Profile updated successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    dateOfBirth: user.dateOfBirth,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/users/check-username/:username
 * Check if username is available
 */
userRouter.get(
    "/check-username/:username",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const username = req.params.username as string;

            // Validate format
            const validation = setUsernameSchema.safeParse({ username });
            if (!validation.success) {
                throw new BadRequestError("Invalid username format");
            }

            const existingUser = await prisma.prepUser.findUnique({
                where: { username: username.toLowerCase() },
            });

            res.json({
                success: true,
                data: {
                    username,
                    available: !existingUser,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/users/username
 * Set username for current user
 */
userRouter.post(
    "/username",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const { username } = validateRequest(setUsernameSchema, req.body);

            // Check if already taken
            const existingUser = await prisma.prepUser.findUnique({
                where: { username: username.toLowerCase() },
            });

            if (existingUser && existingUser.id !== userId) {
                throw new ConflictError("Username is already taken");
            }

            const user = await prisma.prepUser.update({
                where: { id: userId },
                data: { username: username.toLowerCase() },
            });

            res.json({
                success: true,
                message: "Username set successfully",
                data: {
                    username: user.username,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/v1/users/preferences
 * Update user preferences
 */
userRouter.patch(
    "/preferences",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const data = validateRequest(updatePreferencesSchema, req.body);

            const user = await prisma.prepUser.update({
                where: { id: userId },
                data,
            });

            res.json({
                success: true,
                message: "Preferences updated successfully",
                data: {
                    dailyGoal: user.dailyGoal,
                    reminderEnabled: user.reminderEnabled,
                    reminderTime: user.reminderTime,
                    language: user.language,
                    theme: user.theme,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/users/exam
 * Select exam type and level
 */
userRouter.post(
    "/exam",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const { examTypeId, examLevelId } = validateRequest(selectExamSchema, req.body);

            // Verify exam type exists
            const examType = await prisma.examType.findUnique({
                where: { id: examTypeId, isActive: true },
            });

            if (!examType) {
                throw new NotFoundError("Exam type not found");
            }

            // Verify exam level exists and belongs to the exam type
            const examLevel = await prisma.examLevel.findFirst({
                where: {
                    id: examLevelId,
                    examTypeId: examTypeId,
                    isActive: true,
                },
            });

            if (!examLevel) {
                throw new NotFoundError("Exam level not found");
            }

            const user = await prisma.prepUser.update({
                where: { id: userId },
                data: {
                    currentExamTypeId: examTypeId,
                    currentExamLevelId: examLevelId,
                },
                include: {
                    currentExamType: true,
                    currentExamLevel: true,
                },
            });

            res.json({
                success: true,
                message: "Exam selection saved",
                data: {
                    examType: {
                        id: user.currentExamType!.id,
                        name: user.currentExamType!.name,
                        nameNp: user.currentExamType!.nameNp,
                    },
                    examLevel: {
                        id: user.currentExamLevel!.id,
                        name: user.currentExamLevel!.name,
                        nameNp: user.currentExamLevel!.nameNp,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/users/username-suggestions
 * Get username suggestions based on name
 */
userRouter.get(
    "/username-suggestions",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            const user = await prisma.prepUser.findUnique({
                where: { id: userId },
            });

            const name = (user?.name || "user").toLowerCase().replace(/\s+/g, "_");
            const year = new Date().getFullYear().toString().slice(-2);
            const random = Math.floor(Math.random() * 100);

            const suggestions = [
                name,
                `${name}_${year}`,
                `${name}${random}`,
                `${name}_prep`,
                `${name.split("_")[0]}_${random}`,
            ];

            // Check availability
            const availableSuggestions: string[] = [];
            for (const suggestion of suggestions) {
                const exists = await prisma.prepUser.findUnique({
                    where: { username: suggestion },
                });
                if (!exists) {
                    availableSuggestions.push(suggestion);
                }
            }

            res.json({
                success: true,
                data: {
                    suggestions: availableSuggestions.slice(0, 3),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);
