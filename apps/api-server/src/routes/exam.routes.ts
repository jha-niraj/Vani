import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from "express";
import prisma from "@repo/prisma";
import { optionalAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { NotFoundError } from "../middleware/error.middleware.js";

export const examRouter: RouterType = Router();

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/exams/types
 * Get all exam types
 */
examRouter.get(
    "/types",
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const examTypes = await prisma.examType.findMany({
                where: { isActive: true },
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    name: true,
                    nameNp: true,
                    description: true,
                    descriptionNp: true,
                    icon: true,
                },
            });

            res.json({
                success: true,
                data: examTypes,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/exams/types/:typeId/levels
 * Get exam levels for a specific exam type
 */
examRouter.get(
    "/types/:typeId/levels",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { typeId } = req.params;

            const examType = await prisma.examType.findUnique({
                where: { id: typeId, isActive: true },
            });

            if (!examType) {
                throw new NotFoundError("Exam type not found");
            }

            const levels = await prisma.examLevel.findMany({
                where: {
                    examTypeId: typeId,
                    isActive: true,
                },
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    name: true,
                    nameNp: true,
                    description: true,
                    descriptionNp: true,
                    code: true,
                    icon: true,
                },
            });

            res.json({
                success: true,
                data: levels,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/exams/levels/:levelId
 * Get exam level details with phases and subjects
 */
examRouter.get(
    "/levels/:levelId",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { levelId } = req.params;
            const userId = (req as AuthenticatedRequest).user?.userId;

            const level = await prisma.examLevel.findUnique({
                where: { id: levelId, isActive: true },
                include: {
                    examType: {
                        select: {
                            id: true,
                            name: true,
                            nameNp: true,
                        },
                    },
                    phases: {
                        where: { isActive: true },
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            name: true,
                            nameNp: true,
                            description: true,
                            type: true,
                            isActive: true,
                        },
                    },
                    subjects: {
                        where: { isActive: true },
                        orderBy: { order: "asc" },
                        include: {
                            _count: {
                                select: {
                                    questions: {
                                        where: { isActive: true, isVerified: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!level) {
                throw new NotFoundError("Exam level not found");
            }

            // Get user progress for each subject if authenticated
            let userProgress: Record<string, { attempted: number; correct: number }> = {};
            if (userId) {
                const progress = await prisma.userProgress.findUnique({
                    where: { userId },
                });
                if (progress?.subjectProgress) {
                    userProgress = progress.subjectProgress as Record<string, { attempted: number; correct: number }>;
                }
            }

            const subjects = level.subjects.map((subject) => ({
                id: subject.id,
                name: subject.name,
                nameNp: subject.nameNp,
                description: subject.description,
                icon: subject.icon,
                color: subject.color,
                questionCount: subject._count.questions,
                progress: userProgress[subject.id] || { attempted: 0, correct: 0 },
            }));

            res.json({
                success: true,
                data: {
                    id: level.id,
                    name: level.name,
                    nameNp: level.nameNp,
                    description: level.description,
                    code: level.code,
                    examType: level.examType,
                    phases: level.phases,
                    subjects,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/v1/exams/subjects/:subjectId/topics
 * Get topics for a subject
 */
examRouter.get(
    "/subjects/:subjectId/topics",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { subjectId } = req.params;
            const userId = (req as AuthenticatedRequest).user?.userId;

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId, isActive: true },
                include: {
                    topics: {
                        where: { isActive: true, parentTopicId: null },
                        orderBy: { order: "asc" },
                        include: {
                            _count: {
                                select: {
                                    questions: {
                                        where: { isActive: true, isVerified: true },
                                    },
                                },
                            },
                            subTopics: {
                                where: { isActive: true },
                                orderBy: { order: "asc" },
                                include: {
                                    _count: {
                                        select: {
                                            questions: {
                                                where: { isActive: true, isVerified: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!subject) {
                throw new NotFoundError("Subject not found");
            }

            // Get user progress for topics if authenticated
            let topicProgress: Record<string, { attempted: number; correct: number }> = {};
            if (userId) {
                const progress = await prisma.userProgress.findUnique({
                    where: { userId },
                });
                if (progress?.topicProgress) {
                    topicProgress = progress.topicProgress as Record<string, { attempted: number; correct: number }>;
                }
            }

            const topics = subject.topics.map((topic) => ({
                id: topic.id,
                name: topic.name,
                nameNp: topic.nameNp,
                description: topic.description,
                questionCount: topic._count.questions,
                progress: topicProgress[topic.id] || { attempted: 0, correct: 0 },
                subTopics: topic.subTopics.map((subTopic) => ({
                    id: subTopic.id,
                    name: subTopic.name,
                    nameNp: subTopic.nameNp,
                    questionCount: subTopic._count.questions,
                    progress: topicProgress[subTopic.id] || { attempted: 0, correct: 0 },
                })),
            }));

            res.json({
                success: true,
                data: {
                    subject: {
                        id: subject.id,
                        name: subject.name,
                        nameNp: subject.nameNp,
                    },
                    topics,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);
