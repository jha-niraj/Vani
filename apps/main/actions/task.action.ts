"use server";

import prisma from "@repo/prisma";
import { auth } from "@repo/auth";

export async function getUserTasks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.task.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            recording: {
                select: { id: true, title: true },
            },
        },
    });
}

export async function toggleTaskComplete(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const task = await prisma.task.findFirst({
        where: { id: taskId, userId: session.user.id },
    });

    if (!task) return null;

    return prisma.task.update({
        where: { id: taskId },
        data: {
            completed: !task.completed,
            completedAt: task.completed ? null : new Date(),
        },
    });
}

export async function deleteTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    return prisma.task.deleteMany({
        where: { id: taskId, userId: session.user.id },
    });
}
