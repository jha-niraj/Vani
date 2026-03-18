"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    CheckCircle2, Circle, Trash2, Flag, ListChecks, Loader2
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { toast } from "@repo/ui/components/ui/sonner";
import { deleteTask, toggleTaskComplete } from "@/actions/task.action";
import { cn } from "@repo/ui/lib/utils";

type TaskItem = {
    id: string;
    text: string;
    completed: boolean;
    completedAt: Date | string | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: Date | string;
    sourceExcerpt: string | null;
    recordingId: string | null;
    recording: {
        id: string;
        title: string | null;
    } | null;
};

function priorityColor(priority: TaskItem["priority"]) {
    if (priority === "HIGH") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (priority === "LOW") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
}

export default function TasksClient({ initialTasks }: { initialTasks: TaskItem[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    const [filter, setFilter] = useState<"ALL" | "OPEN" | "DONE">("ALL");
    const [isPending, startTransition] = useTransition();

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (filter === "OPEN") return !task.completed;
            if (filter === "DONE") return task.completed;
            return true;
        });
    }, [filter, tasks]);

    const openCount = tasks.filter((task) => !task.completed).length;
    const doneCount = tasks.length - openCount;

    const onToggle = (task: TaskItem) => {
        startTransition(async () => {
            const previous = tasks;
            setTasks((prev) => prev.map((t) => (
                t.id === task.id
                    ? {
                        ...t,
                        completed: !t.completed,
                        completedAt: t.completed ? null : new Date().toISOString(),
                    }
                    : t
            )));

            const result = await toggleTaskComplete(task.id);
            if (!result) {
                setTasks(previous);
                toast.error("Could not update task.");
                return;
            }

            toast.success(result.completed ? "Task completed" : "Task reopened");
        });
    };

    const onDelete = (taskId: string) => {
        startTransition(async () => {
            const previous = tasks;
            setTasks((prev) => prev.filter((task) => task.id !== taskId));

            const result = await deleteTask(taskId);
            if (!result || result.count === 0) {
                setTasks(previous);
                toast.error("Could not delete task.");
                return;
            }

            toast.success("Task deleted");
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Action items extracted from your recordings.
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Badge variant="outline">{openCount} open</Badge>
                        <Badge variant="secondary">{doneCount} done</Badge>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    {(["ALL", "OPEN", "DONE"] as const).map((value) => (
                        <Button
                            key={value}
                            size="sm"
                            variant={filter === value ? "default" : "outline"}
                            onClick={() => setFilter(value)}
                        >
                            {value === "ALL" ? "All" : value === "OPEN" ? "Open" : "Completed"}
                        </Button>
                    ))}
                </div>
            </div>

            {filteredTasks.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">
                        <ListChecks className="h-8 w-8 mx-auto mb-3" />
                        No tasks in this filter.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                            <Card className={cn(task.completed && "opacity-75")}> 
                                <CardHeader className="pb-2">
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={() => onToggle(task)}
                                            className="mt-0.5"
                                            disabled={isPending}
                                        >
                                            {task.completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <CardTitle
                                                className={cn(
                                                    "text-base leading-6",
                                                    task.completed && "line-through text-muted-foreground"
                                                )}
                                            >
                                                {task.text}
                                            </CardTitle>
                                        </div>
                                        <Badge variant="outline" className={priorityColor(task.priority)}>
                                            <Flag className="h-3 w-3 mr-1" />
                                            {task.priority.toLowerCase()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 flex items-center justify-between gap-3">
                                    <div className="text-xs text-muted-foreground">
                                        {task.recording ? (
                                            <Link className="text-primary hover:underline" href={`/recording/${task.recording.id}`}>
                                                from {task.recording.title || "Untitled Recording"}
                                            </Link>
                                        ) : (
                                            <span>Standalone task</span>
                                        )}
                                    </div>
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => onDelete(task.id)}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
