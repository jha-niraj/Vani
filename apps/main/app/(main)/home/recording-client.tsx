"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@repo/ui/components/ui/sonner";
import {
    Mic, Square, Loader2, Clock, FileText, CheckSquare,
    ChevronRight, Sparkles, AlertCircle
} from "lucide-react";
import { processRecording } from "@/actions/recording.action";
import { useRouter } from "next/navigation";

interface RecentRecording {
    id: string;
    title: string | null;
    durationSec: number;
    status: string;
    createdAt: Date;
    language: string | null;
    _count: { tasks: number };
}

const PROCESSING_STAGES = [
    { key: "uploading", label: "Saving audio", icon: "☁️", progress: 20 },
    { key: "transcribing", label: "Transcribing with Sarvam AI", icon: "🗣️", progress: 50 },
    { key: "processing", label: "Extracting tasks & summary", icon: "🤖", progress: 80 },
    { key: "completed", label: "All done!", icon: "✅", progress: 100 },
];

export default function RecordingClient({
    recentRecordings,
}: {
    recentRecordings: RecentRecording[];
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStage, setCurrentStage] = useState(0);
    const durationRef = useRef(0);
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const router = useRouter();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const MAX_DURATION = 60; // 1 minute max

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            streamRef.current = stream;

            // Setup audio analyser for waveform
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Setup media recorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.start(250); // Collect data every 250ms
            setIsRecording(true);
            setIsPaused(false);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => {
                    durationRef.current = prev + 1;
                    if (prev >= MAX_DURATION - 1) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

            // Start audio level monitoring
            updateAudioLevel();
        } catch (error) {
            console.error("Microphone access denied:", error);
            toast.error("Please allow microphone access to record.");
        }
    };

    const stopRecording = useCallback(async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

        return new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = async () => {
                // Cleanup
                if (timerRef.current) clearInterval(timerRef.current);
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                }

                setIsRecording(false);
                setAudioLevel(0);

                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                if (audioBlob.size < 1000) {
                    toast.error("Recording too short. Please try again.");
                    resolve();
                    return;
                }

                // Start processing
                setIsProcessing(true);
                setCurrentStage(0);

                try {
                    const formData = new FormData();
                    formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
                    formData.append("duration", String(durationRef.current));

                    // Simulate stage progression
                    const stageInterval = setInterval(() => {
                        setCurrentStage((prev) => Math.min(prev + 1, PROCESSING_STAGES.length - 1));
                    }, 3000);

                    const result = await processRecording(formData);

                    clearInterval(stageInterval);
                    setCurrentStage(PROCESSING_STAGES.length - 1);

                    if (result.success) {
                        toast.success("Recording processed! 🎉");
                        // Give a brief moment to show completion
                        setTimeout(() => {
                            setIsProcessing(false);
                            setCurrentStage(0);
                            router.refresh();
                        }, 1500);
                    } else {
                        toast.error(result.message);
                        setIsProcessing(false);
                    }
                } catch {
                    toast.error("Processing failed. Please try again.");
                    setIsProcessing(false);
                } finally {
                    durationRef.current = 0;
                }

                resolve();
            };

            mediaRecorderRef.current!.stop();
        });
    }, [duration, updateAudioLevel]);

    // Auto-stop at max duration
    useEffect(() => {
        if (duration >= MAX_DURATION && isRecording) {
            stopRecording();
        }
    }, [duration, isRecording, stopRecording]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Generate waveform bars
    const bars = 32;
    const waveformBars = Array.from({ length: bars }, (_, i) => {
        const distance = Math.abs(i - bars / 2) / (bars / 2);
        const base = isRecording ? 0.15 : 0.05;
        const height = base + audioLevel * (1 - distance * 0.7) * 0.85;
        return Math.min(height, 1);
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Record</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Capture your thoughts. Vani will handle the rest.
                </p>
            </div>
            <div className="rounded-2xl border bg-card overflow-hidden">
                <AnimatePresence mode="wait">
                    {
                        isProcessing ? (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-8"
                            >
                                <div className="text-center mb-8">
                                    <motion.div
                                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Sparkles className="h-7 w-7 text-primary" />
                                    </motion.div>
                                    <h3 className="text-lg font-semibold text-foreground">Processing your recording</h3>
                                    <p className="text-sm text-muted-foreground mt-1">This usually takes 10-20 seconds</p>
                                </div>
                                <div className="space-y-3 max-w-sm mx-auto">
                                    {
                                        PROCESSING_STAGES.map((stage, idx) => (
                                            <div
                                                key={stage.key}
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${idx <= currentStage
                                                    ? "bg-primary/5 text-foreground"
                                                    : "text-muted-foreground/50"
                                                    }`}
                                            >
                                                <span className="text-lg">{stage.icon}</span>
                                                <span className="text-sm font-medium flex-1">{stage.label}</span>
                                                {
                                                    idx < currentStage && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                            <CheckSquare className="h-4 w-4 text-emerald-500" />
                                                        </motion.div>
                                                    )
                                                }
                                                {
                                                    idx === currentStage && (
                                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    )
                                                }
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className="mt-6 h-1.5 bg-muted rounded-full overflow-hidden max-w-sm mx-auto">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                        animate={{
                                            width: `${PROCESSING_STAGES[currentStage]?.progress || 0}%`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="recorder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-8 flex flex-col items-center"
                            >
                                <div className="flex items-center justify-center gap-[3px] h-20 mb-6">
                                    {
                                        waveformBars.map((h, i) => (
                                            <motion.div
                                                key={i}
                                                className={`w-[3px] rounded-full ${isRecording
                                                    ? "bg-gradient-to-t from-primary/60 to-primary"
                                                    : "bg-muted-foreground/20"
                                                    }`}
                                                animate={{ height: `${h * 100}%` }}
                                                transition={{ duration: 0.1, ease: "easeOut" }}
                                            />
                                        ))
                                    }
                                </div>
                                <div className="mb-6 text-center">
                                    <p className="text-3xl font-mono font-bold text-foreground tracking-wider">
                                        {formatTime(durationRef.current)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {
                                            isRecording
                                                ? `${MAX_DURATION - duration}s remaining`
                                                : "Max 60 seconds"
                                        }
                                    </p>
                                </div>
                                <div className="relative">
                                    {
                                        isRecording && (
                                            <motion.div
                                                className="absolute inset-0 rounded-full bg-red-500/20"
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )
                                    }
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`cursor-pointer relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-lg ${isRecording
                                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
                                            : "bg-gradient-to-br from-primary to-purple-600 hover:shadow-xl hover:shadow-primary/25 hover:scale-105"
                                            }`}
                                    >
                                        {
                                            isRecording ? (
                                                <Square className="h-7 w-7 text-white fill-white" />
                                            ) : (
                                                <Mic className="h-8 w-8 text-white" />
                                            )
                                        }
                                    </button>
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    {isRecording ? "Tap to stop" : "Tap to start recording"}
                                </p>

                                {
                                    !isRecording && (
                                        <p className="mt-2 text-xs text-muted-foreground/70 flex items-center gap-1.5">
                                            <AlertCircle className="h-3 w-3" />
                                            Speak in any language — Hindi, English, Hinglish, and 10+ more
                                        </p>
                                    )
                                }
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </div>

            {
                recentRecordings.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                Recent
                            </h2>
                            <Link
                                href="/home/library"
                                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                            >
                                View all <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {
                                recentRecordings.map((rec, i) => (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={`/home/recording/${rec.id}`}
                                            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors group"
                                        >
                                            <div className={`p-2 rounded-lg flex-shrink-0 ${rec.status === "COMPLETED"
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : rec.status === "FAILED"
                                                    ? "bg-red-500/10 text-red-500"
                                                    : "bg-primary/10 text-primary"
                                                }`}>
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {rec.title || "Untitled Recording"}
                                                </p>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(rec.durationSec)}
                                                    </span>
                                                    <span>{formatDate(rec.createdAt)}</span>
                                                    {
                                                        rec._count.tasks > 0 && (
                                                            <span className="flex items-center gap-1 text-primary">
                                                                <CheckSquare className="h-3 w-3" />
                                                                {rec._count.tasks} tasks
                                                            </span>
                                                        )
                                                    }
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </Link>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                )
            }
        </div>
    );
}