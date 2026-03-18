"use server";

import prisma from "@repo/prisma";
import { auth } from "@repo/auth";
import { getSignedAudioUrl, uploadAudioToStorage } from "@/utils/storage";
import { transcribeShortAudio } from "@/utils/sarvam";
import { extractFromTranscript } from "@/utils/openai";

export interface RecordingUploadResult {
    success: boolean;
    message: string;
    recordingId?: string;
}

/**
 * Full recording pipeline:
 * 1. Upload audio to Supabase S3
 * 2. Create Recording in DB
 * 3. Transcribe via Sarvam
 * 4. Extract via OpenAI
 * 5. Save tasks
 */
export async function processRecording(formData: FormData): Promise<RecordingUploadResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated." };
    }

    const userId = session.user.id;

    try {
        const existingRecordingsCount = await prisma.recording.count({
            where: { userId },
        });
        const shouldDebugFlow = existingRecordingsCount === 0;

        const audioFile = formData.get("audio") as File | null;
        const durationStr = formData.get("duration") as string | null;

        if (!audioFile) {
            return { success: false, message: "No audio file provided." };
        }

        const durationSec = parseInt(durationStr || "0", 10);
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        if (shouldDebugFlow) {
            console.log("[recording.flow] First recording pipeline started", {
                userId,
                fileName: audioFile.name,
                mimeType: audioFile.type,
                sizeBytes: audioFile.size,
                durationSec,
            });
        }

        // ── Step 1: Upload to Supabase Storage ──
        const { storagePath, audioUrl } = await uploadAudioToStorage(
            userId,
            audioBuffer,
            audioFile.name || "recording.webm",
            audioFile.type || "audio/webm"
        );

        if (shouldDebugFlow) {
            console.log("[recording.flow] Storage upload completed", {
                storagePath,
                audioUrl,
            });
        }

        // ── Step 2: Create Recording record ──
        const recording = await prisma.recording.create({
            data: {
                userId,
                storagePath,
                audioUrl,
                mimeType: audioFile.type || "audio/webm",
                durationSec: durationSec || 0,
                status: "UPLOADED",
            },
        });

        await createProcessingEvent(recording.id, userId, "uploaded", "Audio saved to storage", 20);

        if (shouldDebugFlow) {
            console.log("[recording.flow] Recording row created", {
                recordingId: recording.id,
                status: recording.status,
            });
        }

        // ── Step 3: Transcribe via Sarvam ──
        await prisma.recording.update({
            where: { 
                id: recording.id 
            },
            data: { 
                status: "TRANSCRIBING" 
            },
        });
        await createProcessingEvent(recording.id, userId, "transcribing", "Transcribing audio with Sarvam AI...", 40);

        let transcript = "";
        let detectedLanguage: string | null = null;

        try {
            const sttResult = await transcribeShortAudio(audioBuffer, audioFile.name || "recording.webm");
            transcript = sttResult.transcript;
            detectedLanguage = sttResult.languageCode;

            if (shouldDebugFlow) {
                console.log("[recording.flow] Transcription completed", {
                    recordingId: recording.id,
                    transcriptChars: transcript.length,
                    detectedLanguage,
                });
            }
        } catch (sttError) {
            console.error("STT failed:", sttError);
            await prisma.recording.update({
                where: { id: recording.id },
                data: {
                    status: "FAILED",
                    errorMessage: "Transcription failed. Please try again.",
                },
            });
            await createProcessingEvent(recording.id, userId, "failed", "Transcription failed", 40);
            return { success: false, message: "Transcription failed.", recordingId: recording.id };
        }

        // Save transcript
        await prisma.recording.update({
            where: { id: recording.id },
            data: {
                transcript,
                language: detectedLanguage,
                status: "PROCESSING",
            },
        });
        await createProcessingEvent(recording.id, userId, "processing", "Extracting summary and tasks...", 70);

        // ── Step 4: Extract via OpenAI ──
        let title = "Untitled Recording";
        let summary: object = {};
        let tags: string[] = [];
        let extractedTasks: { text: string; priority: "HIGH" | "MEDIUM" | "LOW"; dueHint: string | null; timestampHint: number | null }[] = [];

        if (transcript.trim().length > 0) {
            try {
                const extraction = await extractFromTranscript(transcript);
                title = extraction.title;
                summary = { bullets: extraction.summary, confidence: extraction.confidence };
                tags = extraction.tags;
                extractedTasks = extraction.tasks.filter((task) => {
                    const normalizedText = task.text.trim();
                    return normalizedText.length >= 4 && normalizedText.length <= 140;
                }).map((task) => ({
                    text: task.text.trim().replace(/\s+/g, " "),
                    priority: task.priority,
                    dueHint: task.dueHint,
                    timestampHint: task.timestampHint,
                }));

                if (shouldDebugFlow) {
                    console.log("[recording.flow] OpenAI extraction completed", {
                        recordingId: recording.id,
                        extractedTitle: title,
                        summaryPoints: Array.isArray((summary as { bullets?: unknown }).bullets)
                            ? ((summary as { bullets?: unknown[] }).bullets?.length || 0)
                            : 0,
                        tagsCount: tags.length,
                        extractedTasksCount: extractedTasks.length,
                        sampleTask: extractedTasks[0]?.text || null,
                    });
                }
            } catch (extractError) {
                console.error("Extraction failed:", extractError);
                // Non-fatal — we still have the transcript
                summary = { bullets: [], error: "Extraction failed" };
            }
        }

        // ── Step 5: Save everything ──
        await prisma.recording.update({
            where: { id: recording.id },
            data: {
                title,
                summary,
                tags,
                status: "COMPLETED",
                processedAt: new Date(),
            },
        });

        // Create tasks if any were extracted
        if (extractedTasks.length > 0) {
            await prisma.task.createMany({
                data: extractedTasks.map((t) => ({
                    userId,
                    recordingId: recording.id,
                    text: t.text,
                    priority: t.priority,
                    sourceExcerpt: t.dueHint,
                    sourceTimestampSec: t.timestampHint,
                })),
            });

            if (shouldDebugFlow) {
                console.log("[recording.flow] Tasks created", {
                    recordingId: recording.id,
                    taskCount: extractedTasks.length,
                });
            }
        }

        await createProcessingEvent(recording.id, userId, "completed", "Processing complete!", 100);

        if (shouldDebugFlow) {
            console.log("[recording.flow] First recording pipeline completed", {
                recordingId: recording.id,
                finalStatus: "COMPLETED",
            });
        }

        return {
            success: true,
            message: "Recording processed successfully!",
            recordingId: recording.id,
        };
    } catch (error) {
        console.error("Recording pipeline error:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
}

async function createProcessingEvent(
    recordingId: string,
    userId: string,
    stage: string,
    message: string,
    progressPercent: number
) {
    try {
        await prisma.processingEvent.create({
            data: { recordingId, userId, stage, message, progressPercent },
        });
    } catch (e) {
        console.error("Failed to create processing event:", e);
    }
}

/**
 * Get all recordings for the current user.
 */
export async function getUserRecordings() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.recording.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            tasks: { orderBy: { createdAt: "asc" } },
            _count: { select: { tasks: true } },
        },
    });
}

/**
 * Get a single recording by ID.
 */
export async function getRecordingById(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    return prisma.recording.findFirst({
        where: { id, userId: session.user.id },
        include: {
            tasks: { orderBy: { createdAt: "asc" } },
            processingEvents: { orderBy: { createdAt: "asc" } },
        },
    });
}

/**
 * Get a short-lived playback URL for a recording file.
 */
export async function getRecordingPlaybackUrl(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const recording = await prisma.recording.findFirst({
        where: {
            id,
            userId: session.user.id,
        },
        select: {
            storagePath: true,
            audioUrl: true,
        },
    });

    if (!recording) return null;

    try {
        const signedUrl = await getSignedAudioUrl(recording.storagePath, 900);
        return signedUrl;
    } catch (error) {
        console.error("Failed to generate signed URL, falling back to public URL:", error);
        return recording.audioUrl;
    }
}

/**
 * Get recent recordings (for home preview).
 */
export async function getRecentRecordings(limit = 3) {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.recording.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            title: true,
            durationSec: true,
            status: true,
            createdAt: true,
            language: true,
            _count: { select: { tasks: true } },
        },
    });
}
