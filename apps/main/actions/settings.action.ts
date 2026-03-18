"use server";

import prisma from "@repo/prisma";
import { auth } from "@repo/auth";
import type { UseCase } from "@repo/prisma/client";

const VALID_USE_CASES: UseCase[] = [
    "STUDENT",
    "SALES_REP",
    "FOUNDER",
    "DOCTOR",
    "JOURNALIST",
    "FIELD_WORKER",
    "PERSONAL_JOURNALING",
    "LAB_RESEARCHER",
];

export async function getUserSettings() {
    const session = await auth();
    if (!session?.user?.id) return null;

    return prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            preferredLanguage: true,
            timezone: true,
            consentGiven: true,
            useCase: true,
            onboarded: true,
            createdAt: true,
        },
    });
}

export async function updateUserSettings(input: {
    name?: string;
    preferredLanguage?: string;
    timezone?: string;
    consentGiven?: boolean;
    useCase?: UseCase;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated." };
    }

    if (input.useCase && !VALID_USE_CASES.includes(input.useCase)) {
        return { success: false, message: "Invalid use case." };
    }

    try {
        const updated = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(typeof input.name === "string" ? { name: input.name.trim() } : {}),
                ...(typeof input.preferredLanguage === "string"
                    ? { preferredLanguage: input.preferredLanguage }
                    : {}),
                ...(typeof input.timezone === "string" ? { timezone: input.timezone } : {}),
                ...(typeof input.consentGiven === "boolean"
                    ? { consentGiven: input.consentGiven }
                    : {}),
                ...(input.useCase ? { useCase: input.useCase } : {}),
            },
            select: {
                name: true,
                preferredLanguage: true,
                timezone: true,
                consentGiven: true,
                useCase: true,
            },
        });

        return {
            success: true,
            message: "Settings updated.",
            data: updated,
        };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return {
            success: false,
            message: "Could not update settings.",
        };
    }
}
