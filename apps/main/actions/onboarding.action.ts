"use server";

import prisma from "@repo/prisma";
import { auth } from "@repo/auth";

export interface OnboardingData {
    preferredLanguage: string;
    useCase: string;
    consentGiven: boolean;
}

export interface OnboardingResult {
    success: boolean;
    message: string;
}

export async function completeOnboarding(data: OnboardingData): Promise<OnboardingResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated." };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                preferredLanguage: data.preferredLanguage,
                useCase: data.useCase,
                consentGiven: data.consentGiven,
                onboarded: true,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        });

        return { success: true, message: "Onboarding complete!" };
    } catch (error) {
        console.error("Onboarding error:", error);
        return { success: false, message: "Failed to save preferences." };
    }
}

export async function checkOnboardingStatus(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) return false;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboarded: true },
    });

    return user?.onboarded ?? false;
}
