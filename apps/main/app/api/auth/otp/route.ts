import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@repo/prisma";
import { sendEmail } from "@/utils/mail";

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

/**
 * @deprecated Use the server action `sendOtpAction` from `@/app/actions/auth.action.ts` instead.
 * This route is kept as a fallback for backward compatibility.
 */
export async function POST(request: Request) {
    try {
        const { email } = (await request.json()) as { email?: string };

        if (!email || !email.includes("@")) {
            return NextResponse.json({ success: false, message: "Valid email is required." }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        await prisma.emailOTP.create({
            data: {
                email: normalizedEmail,
                otpHash,
                expiresAt,
                userId: user?.id,
            },
        });

        // Send email using Resend SDK
        try {
            await sendEmail({
                name: user?.name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                emailType: "VERIFY_OTP",
                otp,
            });
        } catch (emailError) {
            console.error("Email send failed:", emailError);
            if (process.env.NODE_ENV !== "production") {
                console.log(`[DEV OTP] ${normalizedEmail} -> ${otp}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: "OTP sent to your email.",
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
        });
    } catch (error) {
        console.error("OTP send error:", error);
        return NextResponse.json({ success: false, message: "Unable to send OTP." }, { status: 500 });
    }
}