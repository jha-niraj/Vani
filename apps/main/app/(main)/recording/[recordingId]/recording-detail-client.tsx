"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, AudioLines, CalendarClock, CheckSquare, Languages, 
    AlertCircle
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { 
    Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Progress } from "@repo/ui/components/ui/progress";
import { cn } from "@repo/ui/lib/utils";

type Task = {
    id: string;
    text: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    completed: boolean;
    sourceExcerpt: string | null;
};

type ProcessingEvent = {
    id: string;
    stage: string;
    message: string | null;
    progressPercent: number;
    createdAt: Date | string;
};

type RecordingData = {
    id: string;
    title: string | null;
    transcript: string | null;
    summary: unknown;
    createdAt: Date | string;
    durationSec: number;
    status: "UPLOADED" | "TRANSCRIBING" | "PROCESSING" | "COMPLETED" | "FAILED";
    language: string | null;
    errorMessage: string | null;
    tags: string[];
    tasks: Task[];
    processingEvents: ProcessingEvent[];
};

function formatDate(value: Date | string) {
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(durationSec: number) {
    const min = Math.floor(durationSec / 60);
    const sec = durationSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function RecordingDetailClient({
    recording,
    playbackUrl,
}: {
    recording: RecordingData;
    playbackUrl: string | null;
}) {
    const summaryBullets = useMemo(() => {
        if (!recording.summary || typeof recording.summary !== "object") return [];
        const maybe = (recording.summary as { bullets?: unknown }).bullets;
        if (!Array.isArray(maybe)) return [];

        return maybe.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }, [recording.summary]);

    const progress = recording.processingEvents[recording.processingEvents.length - 1]?.progressPercent ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to library
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {recording.title || "Untitled Recording"}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDate(recording.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <AudioLines className="h-3.5 w-3.5" />
                            {formatDuration(recording.durationSec)}
                        </span>
                        {recording.language ? (
                            <span className="inline-flex items-center gap-1">
                                <Languages className="h-3.5 w-3.5" />
                                {recording.language}
                            </span>
                        ) : null}
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "uppercase",
                        recording.status === "COMPLETED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                        recording.status === "FAILED" && "bg-red-500/10 text-red-600 border-red-500/30",
                        recording.status === "PROCESSING" && "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
                        recording.status === "TRANSCRIBING" && "bg-blue-500/10 text-blue-600 border-blue-500/30"
                    )}
                >
                    {recording.status.toLowerCase()}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Audio</CardTitle>
                </CardHeader>
                <CardContent>
                    {playbackUrl ? (
                        <audio controls className="w-full">
                            <source src={playbackUrl} type="audio/webm" />
                            Your browser does not support audio playback.
                        </audio>
                    ) : (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Playback URL is not available for this recording.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summaryBullets.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {summaryBullets.map((line) => (
                                    <li key={line} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span>{line}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Summary not available.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Tasks ({recording.tasks.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {recording.tasks.length > 0 ? (
                            recording.tasks.map((task) => (
                                <div key={task.id} className="rounded-lg border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm">{task.text}</p>
                                        <Badge variant="outline">{task.priority.toLowerCase()}</Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No tasks extracted.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                    {recording.transcript ? (
                        <p className="text-sm whitespace-pre-wrap leading-6">{recording.transcript}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Transcript is not available.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Processing Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress value={progress} />
                    <div className="space-y-2">
                        {recording.processingEvents.map((event) => (
                            <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3">
                                <CheckSquare className="h-4 w-4 mt-0.5 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium capitalize">{event.stage}</p>
                                    <p className="text-xs text-muted-foreground">{event.message || "No message"}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{event.progressPercent}%</span>
                            </div>
                        ))}
                    </div>
                    {recording.errorMessage ? (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600 inline-flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {recording.errorMessage}
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
