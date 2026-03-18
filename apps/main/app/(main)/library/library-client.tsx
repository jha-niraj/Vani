"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Search, Clock3, FileAudio2, CheckSquare, CalendarDays, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

type LibraryRecording = {
    id: string;
    title: string | null;
    durationSec: number;
    status: "UPLOADED" | "TRANSCRIBING" | "PROCESSING" | "COMPLETED" | "FAILED";
    createdAt: Date | string;
    language: string | null;
    transcript: string | null;
    tags: string[];
    _count: { tasks: number };
};

const STATUS_TABS: Array<"ALL" | LibraryRecording["status"]> = [
    "ALL",
    "COMPLETED",
    "PROCESSING",
    "FAILED",
    "UPLOADED",
    "TRANSCRIBING",
];

function formatDuration(durationSec: number) {
    const min = Math.floor(durationSec / 60);
    const sec = durationSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(value: Date | string) {
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function LibraryClient({ recordings }: { recordings: LibraryRecording[] }) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("ALL");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return recordings.filter((recording) => {
            const matchesStatus = status === "ALL" || recording.status === status;
            const matchesQuery = !q
                || (recording.title || "untitled").toLowerCase().includes(q)
                || (recording.transcript || "").toLowerCase().includes(q)
                || recording.tags.some((tag) => tag.toLowerCase().includes(q));

            return matchesStatus && matchesQuery;
        });
    }, [query, recordings, status]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Search every recording, transcript, and extracted task.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileAudio2 className="h-4 w-4" />
                        {recordings.length} recordings
                    </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="pl-9"
                            placeholder="Search title, transcript, or tag"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {STATUS_TABS.map((tab) => (
                            <Button
                                key={tab}
                                type="button"
                                size="sm"
                                variant={status === tab ? "default" : "outline"}
                                onClick={() => setStatus(tab)}
                                className="whitespace-nowrap"
                            >
                                {tab === "ALL" ? "All" : tab.toLowerCase()}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                        <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No recordings match this filter.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((recording, index) => (
                        <motion.div
                            key={recording.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                            <Link href={`/recording/${recording.id}`}>
                                <Card className="hover:bg-accent/40 transition-colors">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <CardTitle className="text-base line-clamp-1">
                                                {recording.title || "Untitled Recording"}
                                            </CardTitle>
                                            <Badge
                                                className={cn(
                                                    "uppercase tracking-wide",
                                                    recording.status === "COMPLETED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                                                    recording.status === "FAILED" && "bg-red-500/10 text-red-600 border-red-500/30",
                                                    recording.status === "PROCESSING" && "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
                                                    recording.status === "TRANSCRIBING" && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                                                    recording.status === "UPLOADED" && "bg-slate-500/10 text-slate-600 border-slate-500/30"
                                                )}
                                                variant="outline"
                                            >
                                                {recording.status.toLowerCase()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                {formatDuration(recording.durationSec)}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {formatDate(recording.createdAt)}
                                            </span>
                                            {recording.language ? <span>{recording.language}</span> : null}
                                            <span className="inline-flex items-center gap-1 text-primary">
                                                <CheckSquare className="h-3.5 w-3.5" />
                                                {recording._count.tasks} tasks
                                            </span>
                                        </div>
                                        {recording.tags.length > 0 ? (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {recording.tags.map((tag) => (
                                                    <Badge key={`${recording.id}-${tag}`} variant="secondary">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
