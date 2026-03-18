"use server";

import prisma from "@repo/prisma";
import { auth } from "@repo/auth";
import { askAboutRecordings } from "@/utils/openai";
import { transcribeShortAudio } from "@/utils/sarvam";

export interface InteractResponse {
    success: boolean;
    message?: string;
    answer?: string;
    threadId?: string;
}

async function getScopedThread(threadId: string, userId: string) {
    return prisma.chatThread.findFirst({
        where: {
            id: threadId,
            userId,
        },
    });
}

export async function getUserChatThreads() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.chatThread.findMany({
        where: { userId: session.user.id },
        include: {
            _count: {
                select: { messages: true },
            },
            recording: {
                select: {
                    id: true,
                    title: true,
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    content: true,
                    role: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getThreadMessages(threadId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const thread = await getScopedThread(threadId, session.user.id);
    if (!thread) return [];

    return prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
    });
}

export async function transcribeInteractAudio(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated." };
    }

    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) {
        return { success: false, message: "No audio file provided." };
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    try {
        const result = await transcribeShortAudio(buffer, audioFile.name || "interact.webm", {
            model: "saaras:v3",
            languageCode: "unknown",
        });

        return {
            success: true,
            transcript: result.transcript,
            languageCode: result.languageCode,
        };
    } catch (error) {
        console.error("Interact audio transcription failed:", error);
        return {
            success: false,
            message: "Could not transcribe audio. Please try again.",
        };
    }
}

export async function askInteractQuestion(input: {
    question: string;
    threadId?: string;
    recordingId?: string;
    inputTranscript?: string;
}): Promise<InteractResponse> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated." };
    }

    const question = input.question.trim();
    if (!question) {
        return { success: false, message: "Question is empty." };
    }

    const userId = session.user.id;

    try {
        let thread = input.threadId
            ? await getScopedThread(input.threadId, userId)
            : null;

        if (!thread) {
            const initialTitle = question.length > 60 ? `${question.slice(0, 57)}...` : question;
            thread = await prisma.chatThread.create({
                data: {
                    userId,
                    recordingId: input.recordingId || null,
                    title: initialTitle,
                },
            });
        }

        await prisma.chatMessage.create({
            data: {
                threadId: thread.id,
                userId,
                role: "USER",
                content: question,
                inputTranscript: input.inputTranscript || null,
            },
        });

        const transcriptContext = await prisma.recording.findMany({
            where: {
                userId,
                transcript: { not: null },
                status: "COMPLETED",
                ...(thread.recordingId
                    ? { id: thread.recordingId }
                    : {}),
            },
            orderBy: { createdAt: "desc" },
            take: thread.recordingId ? 1 : 8,
            select: {
                title: true,
                transcript: true,
                createdAt: true,
            },
        });

        const formattedContext = transcriptContext.map((recording) => ({
            title: recording.title || "Untitled Recording",
            transcript: recording.transcript || "",
            date: recording.createdAt.toISOString(),
        }));

        const previousMessages = await prisma.chatMessage.findMany({
            where: {
                threadId: thread.id,
            },
            orderBy: { createdAt: "asc" },
            take: 12,
        });

        const questionWithHistory = [
            ...previousMessages
                .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
                .map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`),
            `User: ${question}`,
        ].join("\n");

        const answer = await askAboutRecordings(questionWithHistory, formattedContext);

        await prisma.chatMessage.create({
            data: {
                threadId: thread.id,
                userId,
                role: "ASSISTANT",
                content: answer,
            },
        });

        await prisma.chatThread.update({
            where: { id: thread.id },
            data: {
                updatedAt: new Date(),
                title: thread.title || (question.length > 60 ? `${question.slice(0, 57)}...` : question),
            },
        });

        return {
            success: true,
            answer,
            threadId: thread.id,
        };
    } catch (error) {
        console.error("Interact question failed:", error);
        return {
            success: false,
            message: "Unable to get an answer right now. Please try again.",
        };
    }
}
