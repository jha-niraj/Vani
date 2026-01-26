import { 
    Router, type Request, type Response, type NextFunction, 
    type Router as RouterType 
} from "express";
import prisma from "@repo/prisma";
import { 
    authenticate, type AuthenticatedRequest 
} from "../middleware/auth.middleware.js";

export const progressRouter: RouterType = Router();

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/progress/overview
 * Get overall progress overview
 */
progressRouter.get(
    "/overview",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            const progress = await prisma.userProgress.findUnique({
                where: { userId },
            });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { dailyGoal: true },
            });

            const goalMap: Record<string, number> = { CASUAL: 10, REGULAR: 25, SERIOUS: 50, INTENSE: 100 };
            const dailyGoal = goalMap[user?.dailyGoal || "REGULAR"];

            // Get today's progress
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayProgress = await prisma.dailyProgress.findUnique({
                where: { userId_date: { userId, date: today } },
            });

            // Calculate accuracy
            const accuracy = progress?.totalQuestionsAttempted
                ? Math.round((progress.totalCorrect / progress.totalQuestionsAttempted) * 100)
                : 0;

            res.json({
                success: true,
                data: {
                    overall: {
                        totalQuestionsAttempted: progress?.totalQuestionsAttempted || 0,
                        totalCorrect: progress?.totalCorrect || 0,
                        totalIncorrect: progress?.totalIncorrect || 0,
                        totalSkipped: progress?.totalSkipped || 0,
                        accuracy,
                        totalTimeSpentMinutes: Math.round((progress?.totalTimeSpentSeconds || 0) / 60),
                    },
                    streak: {
                        current: progress?.currentStreak || 0,
                        longest: progress?.longestStreak || 0,
                        lastPracticeDate: progress?.lastPracticeDate,
                    },
                    today: {
                        questionsCompleted: todayProgress?.questionsCompleted || 0,
                        questionsCorrect: todayProgress?.questionsCorrect || 0,
                        goal: dailyGoal,
                        goalMet: todayProgress?.goalMet || false,
                        timeSpentMinutes: Math.round((todayProgress?.timeSpentSeconds || 0) / 60),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/progress/subjects
 * Get subject-wise progress
 */
progressRouter.get(
    "/subjects",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { currentExamLevelId: true },
            });

            if (!user?.currentExamLevelId) {
                res.json({ success: true, data: [] });
                return;
            }

            // Get subjects for user's exam level
            const subjects = await prisma.subject.findMany({
                where: { examLevelId: user.currentExamLevelId, isActive: true },
                include: {
                    _count: {
                        select: {
                            questions: { where: { isActive: true, isVerified: true } },
                        },
                    },
                },
                orderBy: { order: "asc" },
            });

            // Get progress
            const progress = await prisma.userProgress.findUnique({
                where: { userId },
            });

            const subjectProgress = (progress?.subjectProgress as Record<string, { attempted: number; correct: number }>) || {};

            const result = subjects.map((subject) => {
                const sp = subjectProgress[subject.id] || { attempted: 0, correct: 0 };
                const accuracy = sp.attempted ? Math.round((sp.correct / sp.attempted) * 100) : 0;
                const completion = subject._count.questions
                    ? Math.round((sp.attempted / subject._count.questions) * 100)
                    : 0;

                return {
                    id: subject.id,
                    name: subject.name,
                    nameNp: subject.nameNp,
                    icon: subject.icon,
                    color: subject.color,
                    totalQuestions: subject._count.questions,
                    attempted: sp.attempted,
                    correct: sp.correct,
                    accuracy,
                    completion,
                };
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/progress/weekly
 * Get weekly activity data
 */
progressRouter.get(
    "/weekly",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            // Get last 7 days of progress
            const dates: Date[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                dates.push(date);
            }

            const dailyProgress = await prisma.dailyProgress.findMany({
                where: {
                    userId,
                    date: { gte: dates[0] },
                },
            });

            const progressMap = new Map(
                dailyProgress.map((p) => [p.date.toISOString().split("T")[0], p])
            );

            const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const result = dates.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const progress = progressMap.get(dateStr);

                return {
                    date: dateStr,
                    dayName: weekDays[date.getDay()],
                    questionsCompleted: progress?.questionsCompleted || 0,
                    questionsCorrect: progress?.questionsCorrect || 0,
                    goalMet: progress?.goalMet || false,
                };
            });

            // Calculate totals
            const totalQuestions = result.reduce((sum, day) => sum + day.questionsCompleted, 0);
            const totalCorrect = result.reduce((sum, day) => sum + day.questionsCorrect, 0);
            const daysWithGoalMet = result.filter((day) => day.goalMet).length;

            res.json({
                success: true,
                data: {
                    days: result,
                    summary: {
                        totalQuestions,
                        totalCorrect,
                        accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
                        daysWithGoalMet,
                        averagePerDay: Math.round(totalQuestions / 7),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/progress/weak-areas
 * Get topics that need more practice
 */
progressRouter.get(
    "/weak-areas",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;

            const progress = await prisma.userProgress.findUnique({
                where: { userId },
            });

            if (!progress?.topicProgress) {
                res.json({ success: true, data: [] });
                return;
            }

            const topicProgress = progress.topicProgress as Record<
                string,
                { attempted: number; correct: number }
            >;

            // Find topics with low accuracy (< 60%) and at least 5 attempts
            const weakTopicIds = Object.entries(topicProgress)
                .filter(([_, stats]) => {
                    if (stats.attempted < 5) return false;
                    const accuracy = (stats.correct / stats.attempted) * 100;
                    return accuracy < 60;
                })
                .sort((a, b) => {
                    const accA = (a[1].correct / a[1].attempted) * 100;
                    const accB = (b[1].correct / b[1].attempted) * 100;
                    return accA - accB;
                })
                .slice(0, 5)
                .map(([id]) => id);

            if (weakTopicIds.length === 0) {
                res.json({ success: true, data: [] });
                return;
            }

            const weakTopics = await prisma.topic.findMany({
                where: { id: { in: weakTopicIds } },
                include: {
                    subject: { select: { id: true, name: true } },
                },
            });

            const result = weakTopics.map((topic) => {
                const stats = topicProgress[topic.id];
                return {
                    id: topic.id,
                    name: topic.name,
                    nameNp: topic.nameNp,
                    subject: topic.subject,
                    attempted: stats.attempted,
                    correct: stats.correct,
                    accuracy: Math.round((stats.correct / stats.attempted) * 100),
                };
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/progress/history
 * Get practice history
 */
progressRouter.get(
    "/history",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = (req as AuthenticatedRequest).user;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const attempts = await prisma.questionAttempt.findMany({
                where: { userId },
                include: {
                    question: {
                        select: {
                            id: true,
                            question: true,
                            subject: { select: { name: true } },
                            topic: { select: { name: true } },
                        },
                    },
                },
                orderBy: { attemptedAt: "desc" },
                take: limit,
                skip: offset,
            });

            const total = await prisma.questionAttempt.count({
                where: { userId },
            });

            res.json({
                success: true,
                data: {
                    attempts: attempts.map((a) => ({
                        id: a.id,
                        questionId: a.questionId,
                        questionPreview: a.question.question.substring(0, 100),
                        subject: a.question.subject.name,
                        topic: a.question.topic.name,
                        selectedAnswer: a.selectedAnswer,
                        isCorrect: a.isCorrect,
                        isSkipped: a.isSkipped,
                        timeTakenSeconds: a.timeTakenSeconds,
                        attemptedAt: a.attemptedAt,
                    })),
                    pagination: {
                        total,
                        limit,
                        offset,
                        hasMore: offset + limit < total,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);
