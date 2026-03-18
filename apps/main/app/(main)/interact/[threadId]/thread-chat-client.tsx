"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, Loader2, MessageSquareText, Mic, Send, Sparkles, Volume2
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { toast } from "@repo/ui/components/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import {
    askInteractQuestion, getThreadMessages, getUserChatThreads,
    transcribeInteractAudio,
} from "@/actions/interact.action";

type Thread = {
    id: string;
    title: string | null;
    updatedAt: Date | string;
    recording: { id: string; title: string | null } | null;
    messages: { content: string; role: "USER" | "ASSISTANT" | "SYSTEM"; createdAt: Date | string }[];
    _count: { messages: number };
};

type Message = {
    id: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    createdAt: Date | string;
    inputTranscript: string | null;
};

function formatTime(value: Date | string) {
    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ThreadChatClient({
    initialThreads,
    initialThreadId,
    initialMessages,
}: {
    initialThreads: Thread[];
    initialThreadId: string;
    initialMessages: Message[];
}) {
    const router = useRouter();

    const [threads, setThreads] = useState(initialThreads);
    const [currentThreadId, setCurrentThreadId] = useState(initialThreadId);
    const [messages, setMessages] = useState(initialMessages);
    const [question, setQuestion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const frameRef = useRef<number | null>(null);
    const endRef = useRef<HTMLDivElement | null>(null);

    const currentThread = useMemo(
        () => threads.find((thread) => thread.id === currentThreadId),
        [threads, currentThreadId]
    );

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const refreshThreads = async () => {
        const latest = await getUserChatThreads();
        setThreads(latest);
    };

    const loadThread = async (threadId: string) => {
        if (threadId === currentThreadId) return;
        const nextMessages = await getThreadMessages(threadId);
        setCurrentThreadId(threadId);
        setMessages(nextMessages);
        router.push(`/interact/${threadId}`);
    };

    const sendQuestion = async (value: string, inputTranscript?: string) => {
        const text = value.trim();
        if (!text || isSubmitting) return;

        const optimisticUserMessage: Message = {
            id: `temp-user-${Date.now()}`,
            role: "USER",
            content: text,
            createdAt: new Date().toISOString(),
            inputTranscript: inputTranscript || null,
        };
        const optimisticAssistantMessage: Message = {
            id: `temp-assistant-${Date.now()}`,
            role: "ASSISTANT",
            content: "Thinking...",
            createdAt: new Date().toISOString(),
            inputTranscript: null,
        };

        const previous = messages;
        setMessages((prev) => [...prev, optimisticUserMessage, optimisticAssistantMessage]);
        setQuestion("");
        setIsSubmitting(true);

        try {
            const result = await askInteractQuestion({
                question: text,
                threadId: currentThreadId,
                inputTranscript,
            });

            if (!result.success || !result.threadId) {
                setMessages(previous);
                toast.error(result.message || "Could not get an answer.");
                return;
            }

            const latestMessages = await getThreadMessages(result.threadId);
            setCurrentThreadId(result.threadId);
            setMessages(latestMessages);
            await refreshThreads();
            router.replace(`/interact/${result.threadId}`);

            if (result.tasksCreated && result.tasksCreated > 0) {
                toast.success(`${result.tasksCreated} task${result.tasksCreated > 1 ? "s" : ""} added to your task list.`);
            }
        } catch (error) {
            console.error(error);
            setMessages(previous);
            toast.error("Something went wrong while sending your question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
        setAudioLevel(avg / 255);
        frameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            updateAudioLevel();

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });

            chunksRef.current = [];
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(200);
            setIsRecording(true);
        } catch (error) {
            console.error(error);
            toast.error("Microphone permission is required.");
        }
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

        mediaRecorderRef.current.onstop = async () => {
            setIsRecording(false);
            setAudioLevel(0);

            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
            if (audioBlob.size < 1200) {
                toast.error("Voice input is too short.");
                return;
            }

            const formData = new FormData();
            formData.append("audio", audioBlob, `interact_${Date.now()}.webm`);

            setIsSubmitting(true);
            try {
                const stt = await transcribeInteractAudio(formData);
                if (!stt.success || !stt.transcript?.trim()) {
                    toast.error(stt.message || "Could not transcribe the audio.");
                    return;
                }

                await sendQuestion(stt.transcript, stt.transcript);
            } finally {
                setIsSubmitting(false);
            }
        };

        mediaRecorderRef.current.stop();
    };

    return (
        <div className="h-[calc(100dvh-8rem)] min-h-0 flex flex-col gap-4 overflow-hidden">
            <div className="shrink-0 rounded-2xl border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <Link href="/interact" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to new chat
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {
                                currentThread?.title
                                    ? currentThread.title.length > 48
                                        ? `${currentThread.title.slice(0, 48)}...`
                                        : currentThread.title
                                    : "Conversation"
                            }
                        </h1>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Context
                    </Badge>
                </div>
            </div>
            <Card className="flex-1 min-h-0 flex flex-col overflow-hidden py-0 gap-0">
                <CardContent className="flex-1 min-h-0 p-0 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 min-h-0 px-4 py-3 bg-background/40">
                        <div className="space-y-3 pr-2">
                            {
                                messages.length === 0 ? (
                                    <div className="h-[300px] grid place-items-center text-sm text-muted-foreground text-center px-6">
                                        Ask anything about your recordings, commitments, people, dates, or summaries.
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "max-w-[88%] rounded-2xl px-4 py-3 text-sm",
                                                message.role === "USER"
                                                    ? "ml-auto bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                            <p
                                                className={cn(
                                                    "mt-1 text-[11px]",
                                                    message.role === "USER"
                                                        ? "text-primary-foreground/80"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                {formatTime(message.createdAt)}
                                            </p>
                                        </motion.div>
                                    ))
                                )
                            }
                            <div ref={endRef} />
                        </div>
                    </ScrollArea>
                    <div className="shrink-0 border-t bg-card p-3">
                        <div className="flex items-center gap-2">
                            <Input
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        void sendQuestion(question);
                                    }
                                }}
                                placeholder="Ask from your recording history..."
                                disabled={isSubmitting}
                            />
                            <Button
                                size="icon"
                                onClick={() => void sendQuestion(question)}
                                disabled={isSubmitting || !question.trim()}
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                            <Button
                                size="icon"
                                variant={isRecording ? "destructive" : "outline"}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isSubmitting}
                            >
                                {isRecording ? <Volume2 className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all"
                                style={{ width: `${Math.max(audioLevel * 100, isRecording ? 8 : 0)}%` }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                            <MessageSquareText className="h-3.5 w-3.5" />
                            {
                                isSubmitting
                                    ? "Processing..."
                                    : isRecording
                                        ? "Recording your question... tap again to send"
                                        : "Type or use mic for natural questions"
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}