"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Mic, Send, Loader2, MessageSquareText, Sparkles, Plus, 
    Volume2
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { 
    Card, CardContent, CardHeader, CardTitle 
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
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

export default function InteractClient({
    initialThreads,
    initialSelectedThreadId,
    initialMessages,
}: {
    initialThreads: Thread[];
    initialSelectedThreadId?: string;
    initialMessages: Message[];
}) {
    const router = useRouter();
    const [threads, setThreads] = useState(initialThreads);
    const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(initialSelectedThreadId);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [question, setQuestion] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isPending, startTransition] = useTransition();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const frameRef = useRef<number | null>(null);

    const selectedThread = useMemo(
        () => threads.find((thread) => thread.id === selectedThreadId),
        [selectedThreadId, threads]
    );

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

    const loadThreadMessages = (threadId: string) => {
        startTransition(async () => {
            const threadMessages = await getThreadMessages(threadId);
            setSelectedThreadId(threadId);
            setMessages(threadMessages);
            router.replace(`/interact?thread=${threadId}`);
        });
    };

    const askQuestion = (value: string, inputTranscript?: string) => {
        const text = value.trim();
        if (!text) return;

        startTransition(async () => {
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

            const previousMessages = messages;
            setMessages((prev) => [...prev, optimisticUserMessage, optimisticAssistantMessage]);
            setQuestion("");

            const result = await askInteractQuestion({
                question: text,
                threadId: selectedThreadId,
                inputTranscript,
            });

            if (!result.success || !result.answer) {
                setMessages(previousMessages);
                toast.error(result.message || "Could not get answer.");
                return;
            }

            if (result.threadId && result.threadId !== selectedThreadId) {
                setSelectedThreadId(result.threadId);
                router.replace(`/interact?thread=${result.threadId}`);
            }

            if (result.threadId) {
                const latestMessages = await getThreadMessages(result.threadId);
                setMessages(latestMessages);
                await refreshThreads();
            }
        });
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

            startTransition(async () => {
                const stt = await transcribeInteractAudio(formData);
                if (!stt.success || !stt.transcript?.trim()) {
                    toast.error(stt.message || "Could not transcribe the audio.");
                    return;
                }

                setQuestion(stt.transcript);
                askQuestion(stt.transcript, stt.transcript);
            });
        };

        mediaRecorderRef.current.stop();
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
                <h1 className="text-2xl font-bold tracking-tight">Interact</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Ask questions with voice or text. Vani uses your transcript history to answer.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <Card className="h-fit">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Threads</CardTitle>
                            <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => {
                                    setSelectedThreadId(undefined);
                                    setMessages([]);
                                    router.replace("/interact");
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {threads.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                                Your first question will create a thread.
                            </div>
                        ) : (
                            threads.map((thread) => (
                                <button
                                    type="button"
                                    key={thread.id}
                                    className={cn(
                                        "w-full rounded-xl border p-3 text-left transition-colors",
                                        selectedThreadId === thread.id
                                            ? "bg-primary/5 border-primary/30"
                                            : "hover:bg-accent"
                                    )}
                                    onClick={() => loadThreadMessages(thread.id)}
                                >
                                    <p className="text-sm font-medium truncate">
                                        {thread.title || "Untitled Thread"}
                                    </p>
                                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{thread._count.messages} msgs</span>
                                        <span>{formatTime(thread.updatedAt)}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="min-h-[520px]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-base">
                                {selectedThread?.title || "New Conversation"}
                            </CardTitle>
                            <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Context
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border bg-background/40 p-3 h-[360px] overflow-y-auto space-y-3">
                            {messages.length === 0 ? (
                                <div className="h-full grid place-items-center text-sm text-muted-foreground text-center px-6">
                                    Ask anything about your recordings, commitments, people, dates, or summaries.
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "max-w-[90%] rounded-xl px-3 py-2 text-sm",
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
                            )}
                        </div>

                        <div className="rounded-xl border p-3 bg-card">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            askQuestion(question);
                                        }
                                    }}
                                    placeholder="Ask from your recording history..."
                                />
                                <Button
                                    size="icon"
                                    onClick={() => askQuestion(question)}
                                    disabled={isPending || !question.trim()}
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                                <Button
                                    size="icon"
                                    variant={isRecording ? "destructive" : "outline"}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={isPending}
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
                                {isRecording ? "Recording your question... tap again to send" : "Type or use mic for natural questions"}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
