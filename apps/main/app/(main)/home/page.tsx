import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import prisma from "@repo/prisma";
import RecordingClient from "./recording-client";

export default async function HomePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/");
    }

    // Check onboarding
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboarded: true },
    });

    if (!user?.onboarded) {
        redirect("/onboarding");
    }

    // Fetch recent recordings
    const recentRecordings = await prisma.recording.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
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

    return <RecordingClient recentRecordings={recentRecordings} />;
}
