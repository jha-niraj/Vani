"use server";

import crypto from "crypto";
import prisma from "@repo/prisma";
import { sendEmail } from "@/app/utils/mail";

const OTP_EXPIRY_MINUTES = 10;

function generateOtp(length = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

export interface OtpResult {
    success: boolean;
    message: string;
    expiresInMinutes?: number;
    devOtp?: string;
}

export async function sendOtpAction(email: string): Promise<OtpResult> {
    try {
        if (!email || !email.includes("@")) {
            return { success: false, message: "Please enter a valid email address." };
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        await prisma.emailOTP.create({
            data: {
                email: normalizedEmail,
                otpHash,
                expiresAt,
                userId: user?.id,
            },
        });

        // Send OTP email using Resend SDK
        try {
            await sendEmail({
                name: user?.name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                emailType: "VERIFY_OTP",
                otp,
            });
        } catch (emailError) {
            console.error("Email sending failed, falling back to dev mode:", emailError);
            // In dev mode, log the OTP even if email fails
            if (process.env.NODE_ENV !== "production") {
                console.log(`[DEV OTP] ${normalizedEmail} -> ${otp}`);
            }
        }

        return {
            success: true,
            message: "OTP sent to your email.",
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
        };
    } catch (error) {
        console.error("OTP send error:", error);
        return { 
            success: false, 
            message: "Unable to send OTP. Please try again." 
        };
    }
}