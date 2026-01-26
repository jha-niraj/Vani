import { 
    Router, type Request, type Response, type NextFunction, 
    type Router as RouterType 
} from "express";
import { z } from "zod";
import prisma from "@repo/prisma";
import { 
    authenticate 
} from "../middleware/auth.middleware.js";
import { 
    NotFoundError, ValidationError 
} from "../middleware/error.middleware.js";

export const aiRouter: RouterType = Router();

// ============================================================================
// OPENAI CLIENT SETUP
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

async function callOpenAI(messages: OpenAIMessage[], model: string = "gpt-4o-mini"): Promise<string> {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.json() as { error?: { message?: string } };
        throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0]?.message?.content || "";
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const explainQuestionSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    includeAlternatives: z.boolean().optional().default(false)
});

const askFollowUpSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    query: z.string().min(1, "Query is required").max(500, "Query too long"),
    context: z.string().optional()
});

const translateQuestionSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    targetLanguage: z.enum(["np", "en"]).default("np")
});

// ============================================================================
// GET AI EXPLANATION FOR A QUESTION
// ============================================================================

/**
 * POST /ai/explain
 * Get detailed AI explanation for a question
 */
aiRouter.post(
    "/explain",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validation = explainQuestionSchema.safeParse(req.body);
            if (!validation.success) {
                throw new ValidationError(validation.error.errors[0].message);
            }

            const { questionId } = validation.data;

            // Get the question
            const question = await prisma.question.findUnique({
                where: { id: questionId },
                include: {
                    subject: { select: { name: true } },
                    topic: { select: { name: true } }
                }
            });

            if (!question) {
                throw new NotFoundError("Question not found");
            }

            const options = question.options as { a: string; b: string; c: string; d: string };

            // Build the prompt
            const systemPrompt = `You are an expert exam tutor for Nepal's Loksewa (Public Service Commission) examinations. 
Your role is to provide clear, concise, and accurate explanations for multiple-choice questions.
Always explain WHY the correct answer is correct and briefly mention why other options are incorrect.
Keep your explanation educational but concise (2-3 paragraphs max).
If relevant, mention any tips or memory aids for the exam.`;

            const userPrompt = `Please explain this ${question.subject.name} question from the ${question.topic.name} topic:

Question: ${question.question}

Options:
A) ${options.a}
B) ${options.b}
C) ${options.c}
D) ${options.d}

Correct Answer: ${question.correctAnswer.toUpperCase()}

${question.explanation ? `Existing explanation: ${question.explanation}` : ""}

Please provide a detailed but concise explanation of why option ${question.correctAnswer.toUpperCase()} is correct, and briefly explain why the other options are incorrect.`;

            const explanation = await callOpenAI([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]);

            res.json({
                success: true,
                data: {
                    questionId,
                    explanation,
                    correctAnswer: question.correctAnswer,
                    subject: question.subject.name,
                    topic: question.topic.name
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// ASK FOLLOW-UP QUESTION
// ============================================================================

/**
 * POST /ai/ask
 * Ask a follow-up question about a specific MCQ
 */
aiRouter.post(
    "/ask",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validation = askFollowUpSchema.safeParse(req.body);
            if (!validation.success) {
                throw new ValidationError(validation.error.errors[0].message);
            }

            const { questionId, query, context } = validation.data;

            // Get the question
            const question = await prisma.question.findUnique({
                where: { id: questionId },
                include: {
                    subject: { select: { name: true } },
                    topic: { select: { name: true } }
                }
            });

            if (!question) {
                throw new NotFoundError("Question not found");
            }

            const options = question.options as { a: string; b: string; c: string; d: string };

            const systemPrompt = `You are an expert exam tutor for Nepal's Loksewa examinations.
You are helping a student understand a specific question they're studying.
Be helpful, accurate, and educational. Keep answers focused and concise.
If asked about something unrelated to the question or exam preparation, politely redirect the conversation.`;

            const questionContext = `
The student is asking about this question:
Subject: ${question.subject.name}
Topic: ${question.topic.name}
Question: ${question.question}
Options: A) ${options.a}, B) ${options.b}, C) ${options.c}, D) ${options.d}
Correct Answer: ${question.correctAnswer.toUpperCase()}
`;

            const messages: OpenAIMessage[] = [
                { role: "system", content: systemPrompt },
                { role: "user", content: questionContext },
                { role: "assistant", content: "I understand. I'll help you with any questions about this topic." }
            ];

            if (context) {
                messages.push({ role: "user", content: context });
                messages.push({ role: "assistant", content: "I see, let me help you understand this better." });
            }

            messages.push({ role: "user", content: query });

            const response = await callOpenAI(messages);

            res.json({
                success: true,
                data: {
                    questionId,
                    query,
                    response
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// TRANSLATE QUESTION TO NEPALI
// ============================================================================

/**
 * POST /ai/translate
 * Translate a question and its options to Nepali (or back to English)
 */
aiRouter.post(
    "/translate",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validation = translateQuestionSchema.safeParse(req.body);
            if (!validation.success) {
                throw new ValidationError(validation.error.errors[0].message);
            }

            const { questionId, targetLanguage } = validation.data;

            // Get the question
            const question = await prisma.question.findUnique({
                where: { id: questionId }
            });

            if (!question) {
                throw new NotFoundError("Question not found");
            }

            const options = question.options as { a: string; b: string; c: string; d: string };

            // Check if translation already exists
            if (targetLanguage === "np" && question.questionNp && question.optionsNp) {
                const optionsNp = question.optionsNp as { a: string; b: string; c: string; d: string };
                return res.json({
                    success: true,
                    data: {
                        questionId,
                        question: question.questionNp,
                        options: optionsNp,
                        explanation: question.explanationNp,
                        cached: true
                    }
                });
            }

            // If translating to English and original is in English, return original
            if (targetLanguage === "en") {
                return res.json({
                    success: true,
                    data: {
                        questionId,
                        question: question.question,
                        options: options,
                        explanation: question.explanation,
                        cached: true
                    }
                });
            }

            // Generate translation using OpenAI
            const systemPrompt = `You are a professional translator specializing in educational content translation between English and Nepali.
Translate the given exam question and options accurately while maintaining the educational context.
Return the translation in valid JSON format only, no additional text.`;

            const userPrompt = `Translate this Loksewa exam question to Nepali. Return as JSON with keys: question, optionA, optionB, optionC, optionD, explanation (if provided).

Question: ${question.question}
Option A: ${options.a}
Option B: ${options.b}
Option C: ${options.c}
Option D: ${options.d}
${question.explanation ? `Explanation: ${question.explanation}` : ""}

Return only valid JSON.`;

            const translation = await callOpenAI([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], "gpt-4o-mini");

            // Parse the JSON response
            let translatedData;
            try {
                // Clean the response - remove markdown code blocks if present
                let cleanedResponse = translation.trim();
                if (cleanedResponse.startsWith("```json")) {
                    cleanedResponse = cleanedResponse.slice(7);
                }
                if (cleanedResponse.startsWith("```")) {
                    cleanedResponse = cleanedResponse.slice(3);
                }
                if (cleanedResponse.endsWith("```")) {
                    cleanedResponse = cleanedResponse.slice(0, -3);
                }
                translatedData = JSON.parse(cleanedResponse.trim());
            } catch (parseError) {
                throw new Error("Failed to parse translation response");
            }

            const translatedQuestion = translatedData.question;
            const translatedOptions = {
                a: translatedData.optionA,
                b: translatedData.optionB,
                c: translatedData.optionC,
                d: translatedData.optionD
            };
            const translatedExplanation = translatedData.explanation || null;

            // Save the translation to the database for caching
            await prisma.question.update({
                where: { id: questionId },
                data: {
                    questionNp: translatedQuestion,
                    optionsNp: translatedOptions,
                    explanationNp: translatedExplanation
                }
            });

            return res.json({
                success: true,
                data: {
                    questionId,
                    question: translatedQuestion,
                    options: translatedOptions,
                    explanation: translatedExplanation,
                    cached: false
                }
            });
        } catch (error) {
            return next(error);
        }
    }
);

// ============================================================================
// CHECK AI STATUS
// ============================================================================

/**
 * GET /ai/status
 * Check if AI features are available
 */
aiRouter.get(
    "/status",
    async (_req: Request, res: Response) => {
        const isConfigured = !!OPENAI_API_KEY;
        
        res.json({
            success: true,
            data: {
                available: isConfigured,
                features: {
                    explain: isConfigured,
                    ask: isConfigured,
                    translate: isConfigured
                }
            }
        });
    }
);
