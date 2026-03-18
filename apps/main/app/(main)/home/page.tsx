import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import prisma from "@repo/prisma";
import RecordingClient from "./recording-client";
import { getRecentRecordings } from "@/actions/recording.action";

export default async function HomePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/");
    }

    if (!session.onboardingCompleted) {
        redirect("/onboarding");
    }

    // Check onboarding
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboarded: true },
    });

    if (!user?.onboarded) {
        redirect("/onboarding");
    }

    const recentRecordings = await getRecentRecordings(3);

    return <RecordingClient recentRecordings={recentRecordings} />;
}
