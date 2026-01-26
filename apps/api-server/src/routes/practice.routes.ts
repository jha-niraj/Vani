import { 
    Router, type Request, type Response, type NextFunction, 
    type Router as RouterType 
} from "express";
import { z } from "zod";
import prisma, { Prisma } from "@repo/prisma";
import { 
    authenticate, type AuthenticatedRequest 
} from "../middleware/auth.middleware.js";
import { 
    BadRequestError, NotFoundError, ValidationError 
} from "../middleware/error.middleware.js";

export const practiceRouter: RouterType = Router();

// ============================================================================
// TYPES
// ============================================================================

type DailyGoal = "CASUAL" | "REGULAR" | "SERIOUS" | "INTENSE";
const GOAL_MAP: Record<DailyGoal, number> = { CASUAL: 10, REGULAR: 25, SERIOUS: 50, INTENSE: 100 };

// Helper to get goal value safely
function getGoalValue(dailyGoal: string | null | undefined): number {
    const goal = dailyGoal as DailyGoal | null | undefined;
    return goal && goal in GOAL_MAP ? GOAL_MAP[goal] : GOAL_MAP.REGULAR;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const getQuestionsSchema = z.object({
    subjectId: z.string().optional(),
    topicId: z.string().optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    filter: z.enum(["all", "unattempted", "incorrect", "bookmarked"]).default("all"),
});

const submitAnswerSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    selectedAnswer: z.string().nullable(),
    timeTakenSeconds: z.number().optional(),
    sessionType: z.enum(["practice", "quick_quiz", "mock_test"]).default("practice"),
});

const bookmarkSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    note: z.string().optional(),
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
 * GET /api/v1/practice/questions
 * Get practice questions based on filters
 */
practiceRouter.get(
    "/questions",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const params = validateRequest(getQuestionsSchema, req.query) as z.infer<typeof getQuestionsSchema>;

            // Get user's current exam level for validation
            const user = await prisma.prepUser.findUnique({
                where: { id: userId },
                select: { currentExamLevelId: true },
            });

            if (!user?.currentExamLevelId) {
                throw new BadRequestError("Please select an exam first");
            }

            // Build where clause
            const whereClause: Record<string, unknown> = {
                isActive: true,
                isVerified: true,
            };

            if (params.subjectId) {
                whereClause.subjectId = params.subjectId;
            }
            if (params.topicId) {
                whereClause.topicId = params.topicId;
            }
            if (params.difficulty) {
                whereClause.difficulty = params.difficulty;
            }

            // Handle special filters
            let questionIds: string[] | undefined;

            if (params.filter === "unattempted") {
                const attemptedIds = await prisma.questionAttempt.findMany({
                    where: { userId },
                    select: { questionId: true },
                    distinct: ["questionId"],
                });
                const attemptedSet = new Set(attemptedIds.map((a: { questionId: string }) => a.questionId));
                
                const allQuestions = await prisma.question.findMany({
                    where: whereClause as Prisma.QuestionWhereInput,
                    select: { id: true },
                });
                questionIds = allQuestions.filter((q: { id: string }) => !attemptedSet.has(q.id)).map((q: { id: string }) => q.id);
            } else if (params.filter === "incorrect") {
                const incorrectAttempts = await prisma.questionAttempt.findMany({
                    where: { userId, isCorrect: false },
                    select: { questionId: true },
                    distinct: ["questionId"],
                });
                questionIds = incorrectAttempts.map((a: { questionId: string }) => a.questionId);
            } else if (params.filter === "bookmarked") {
                const bookmarks = await prisma.bookmark.findMany({
                    where: { userId },
                    select: { questionId: true },
                });
                questionIds = bookmarks.map((b: { questionId: string }) => b.questionId);
            }

            if (questionIds) {
                whereClause.id = { in: questionIds };
            }

            // Get questions
            const questions = await prisma.question.findMany({
                where: whereClause as Prisma.QuestionWhereInput,
                take: params.limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    question: true,
                    questionNp: true,
                    options: true,
                    optionsNp: true,
                    difficulty: true,
                    subject: {
                        select: { id: true, name: true },
                    },
                    topic: {
                        select: { id: true, name: true },
                    },
                },
            });

            // Shuffle questions for randomness
            const shuffled = questions.sort(() => Math.random() - 0.5);

            // Check bookmarks
            const bookmarks = await prisma.bookmark.findMany({
                where: {
                    userId,
                    questionId: { in: shuffled.map((q: { id: string }) => q.id) },
                },
                select: { questionId: true },
            });
            const bookmarkedIds = new Set(bookmarks.map((b: { questionId: string }) => b.questionId));

            const result = shuffled.map((q: typeof questions[number]) => ({
                ...q,
                isBookmarked: bookmarkedIds.has(q.id),
            }));

            res.json({
                success: true,
                data: {
                    questions: result,
                    total: result.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/practice/questions/:questionId
 * Get single question with answer (for review)
 */
practiceRouter.get(
    "/questions/:questionId",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const questionId = req.params.questionId as string;

            const question = await prisma.question.findUnique({
                where: { id: questionId, isActive: true },
                include: {
                    subject: { select: { id: true, name: true, nameNp: true } },
                    topic: { select: { id: true, name: true, nameNp: true } },
                },
            });

            if (!question) {
                throw new NotFoundError("Question not found");
            }

            // Check if bookmarked
            const bookmark = await prisma.bookmark.findUnique({
                where: {
                    userId_questionId: { userId, questionId },
                },
            });

            // Get user's last attempt
            const lastAttempt = await prisma.questionAttempt.findFirst({
                where: { userId, questionId },
                orderBy: { attemptedAt: "desc" },
            });

            res.json({
                success: true,
                data: {
                    id: question.id,
                    question: question.question,
                    questionNp: question.questionNp,
                    options: question.options,
                    optionsNp: question.optionsNp,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    explanationNp: question.explanationNp,
                    difficulty: question.difficulty,
                    subject: question.subject,
                    topic: question.topic,
                    isBookmarked: !!bookmark,
                    lastAttempt: lastAttempt ? {
                        selectedAnswer: lastAttempt.selectedAnswer,
                        isCorrect: lastAttempt.isCorrect,
                        attemptedAt: lastAttempt.attemptedAt,
                    } : null,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/practice/submit
 * Submit answer for a question
 */
practiceRouter.post(
    "/submit",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const { questionId, selectedAnswer, timeTakenSeconds, sessionType } = 
                validateRequest(submitAnswerSchema, req.body) as z.infer<typeof submitAnswerSchema>;

            // Get question to check answer
            const question = await prisma.question.findUnique({
                where: { id: questionId, isActive: true },
            });

            if (!question) {
                throw new NotFoundError("Question not found");
            }

            const isSkipped = selectedAnswer === null;
            const isCorrect = !isSkipped && selectedAnswer === question.correctAnswer;

            // Create attempt record
            const attempt = await prisma.questionAttempt.create({
                data: {
                    userId,
                    questionId,
                    selectedAnswer,
                    isCorrect,
                    isSkipped,
                    timeTakenSeconds,
                    sessionType,
                },
            });

            // Update user progress
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Update overall progress
                await tx.userProgress.upsert({
                    where: { userId },
                    create: {
                        userId,
                        totalQuestionsAttempted: 1,
                        totalCorrect: isCorrect ? 1 : 0,
                        totalIncorrect: !isCorrect && !isSkipped ? 1 : 0,
                        totalSkipped: isSkipped ? 1 : 0,
                        totalTimeSpentSeconds: timeTakenSeconds || 0,
                    },
                    update: {
                        totalQuestionsAttempted: { increment: 1 },
                        totalCorrect: { increment: isCorrect ? 1 : 0 },
                        totalIncorrect: { increment: !isCorrect && !isSkipped ? 1 : 0 },
                        totalSkipped: { increment: isSkipped ? 1 : 0 },
                        totalTimeSpentSeconds: { increment: timeTakenSeconds || 0 },
                        lastPracticeDate: new Date(),
                    },
                });

                // Update daily progress
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const user = await tx.prepUser.findUnique({
                    where: { id: userId },
                    select: { dailyGoal: true },
                });

                const goal = getGoalValue(user?.dailyGoal);

                await tx.dailyProgress.upsert({
                    where: { userId_date: { userId, date: today } },
                    create: {
                        userId,
                        date: today,
                        questionsCompleted: 1,
                        questionsCorrect: isCorrect ? 1 : 0,
                        goal,
                        timeSpentSeconds: timeTakenSeconds || 0,
                    },
                    update: {
                        questionsCompleted: { increment: 1 },
                        questionsCorrect: { increment: isCorrect ? 1 : 0 },
                        timeSpentSeconds: { increment: timeTakenSeconds || 0 },
                    },
                });

                // Check if goal met
                const dailyProgress = await tx.dailyProgress.findUnique({
                    where: { userId_date: { userId, date: today } },
                });

                if (dailyProgress && dailyProgress.questionsCompleted >= goal && !dailyProgress.goalMet) {
                    await tx.dailyProgress.update({
                        where: { id: dailyProgress.id },
                        data: { goalMet: true },
                    });

                    // Update streak
                    const progress = await tx.userProgress.findUnique({
                        where: { userId },
                    });

                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const yesterdayProgress = await tx.dailyProgress.findUnique({
                        where: { userId_date: { userId, date: yesterday } },
                    });

                    let newStreak = 1;
                    if (yesterdayProgress?.goalMet) {
                        newStreak = (progress?.currentStreak || 0) + 1;
                    }

                    await tx.userProgress.update({
                        where: { userId },
                        data: {
                            currentStreak: newStreak,
                            longestStreak: Math.max(newStreak, progress?.longestStreak || 0),
                        },
                    });
                }
            });

            // Update question statistics
            await prisma.question.update({
                where: { id: questionId },
                data: {
                    attemptCount: { increment: 1 },
                    correctCount: { increment: isCorrect ? 1 : 0 },
                },
            });

            res.json({
                success: true,
                data: {
                    attemptId: attempt.id,
                    isCorrect,
                    isSkipped,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    explanationNp: question.explanationNp,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/practice/bookmark
 * Add bookmark
 */
practiceRouter.post(
    "/bookmark",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const { questionId, note } = validateRequest(bookmarkSchema, req.body) as z.infer<typeof bookmarkSchema>;

            // Check if question exists
            const question = await prisma.question.findUnique({
                where: { id: questionId, isActive: true },
            });

            if (!question) {
                throw new NotFoundError("Question not found");
            }

            // Create or update bookmark
            const bookmark = await prisma.bookmark.upsert({
                where: { userId_questionId: { userId, questionId } },
                create: { userId, questionId, note },
                update: { note },
            });

            res.json({
                success: true,
                message: "Question bookmarked",
                data: { id: bookmark.id },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/v1/practice/bookmark/:questionId
 * Remove bookmark
 */
practiceRouter.delete(
    "/bookmark/:questionId",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const questionId = req.params.questionId as string;

            await prisma.bookmark.deleteMany({
                where: { userId, questionId },
            });

            res.json({
                success: true,
                message: "Bookmark removed",
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/practice/bookmarks
 * Get all bookmarked questions
 */
practiceRouter.get(
    "/bookmarks",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            const bookmarks = await prisma.bookmark.findMany({
                where: { userId },
                include: {
                    question: {
                        select: {
                            id: true,
                            question: true,
                            questionNp: true,
                            difficulty: true,
                            subject: { select: { id: true, name: true } },
                            topic: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            // Get last attempt status for each
            const questionIds = bookmarks.map((b) => b.questionId);
            const lastAttempts = await prisma.questionAttempt.findMany({
                where: {
                    userId,
                    questionId: { in: questionIds },
                },
                orderBy: { attemptedAt: "desc" },
                distinct: ["questionId"],
            });

            const attemptMap = new Map(lastAttempts.map((a) => [a.questionId, a]));

            const result = bookmarks.map((b) => ({
                id: b.id,
                note: b.note,
                createdAt: b.createdAt,
                question: {
                    ...b.question,
                    lastAttempt: attemptMap.get(b.questionId) ? {
                        isCorrect: attemptMap.get(b.questionId)!.isCorrect,
                        attemptedAt: attemptMap.get(b.questionId)!.attemptedAt,
                    } : null,
                },
            }));

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);
