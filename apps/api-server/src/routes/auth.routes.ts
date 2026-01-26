import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from "express";
import { z } from "zod";
import prisma from "@repo/prisma";
import {
    generateOTP,
    hashOTP,
    verifyOTPHash,
    validateNepalPhone,
} from "@repo/auth/phone";
import { BadRequestError, ValidationError } from "../middleware/error.middleware.js";
import { generateToken } from "../middleware/auth.middleware.js";

export const authRouter: RouterType = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sendOTPSchema = z.object({
    phone: z.string().min(10, "Phone number is required"),
});

const verifyOTPSchema = z.object({
    phone: z.string().min(10, "Phone number is required"),
    code: z.string().length(6, "OTP must be 6 digits"),
});

// ============================================================================
// HELPERS
// ============================================================================

function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.errors.forEach((err) => {
            const path = err.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(err.message);
        });
        throw new ValidationError("Validation failed", errors);
    }
    return result.data;
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to phone number
 */
authRouter.post(
    "/send-otp",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { phone } = validateRequest(sendOTPSchema, req.body);

            // Validate Nepal phone number
            const validation = validateNepalPhone(phone);
            if (!validation.isValid) {
                throw new BadRequestError(validation.error || "Invalid phone number");
            }

            const normalizedPhone = validation.normalized;

            // Check for existing unexpired OTP (rate limiting)
            const existingOTP = await prisma.oTPVerification.findFirst({
                where: {
                    phone: normalizedPhone,
                    status: "PENDING",
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: "desc" },
            });

            if (existingOTP) {
                const createdAt = existingOTP.createdAt.getTime();
                const now = Date.now();
                const secondsSinceCreated = Math.floor((now - createdAt) / 1000);

                // Allow resend only after 30 seconds
                if (secondsSinceCreated < 30) {
                    const waitTime = 30 - secondsSinceCreated;
                    throw new BadRequestError(
                        `Please wait ${waitTime} seconds before requesting a new code`
                    );
                }

                // Mark old OTP as expired
                await prisma.oTPVerification.update({
                    where: { id: existingOTP.id },
                    data: { status: "EXPIRED" },
                });
            }

            // Generate OTP
            const otp = generateOTP(6);
            const hashedCode = hashOTP(otp);
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Store OTP
            await prisma.oTPVerification.create({
                data: {
                    phone: normalizedPhone,
                    code: hashedCode,
                    purpose: "LOGIN",
                    status: "PENDING",
                    expiresAt,
                    attempts: 0,
                    maxAttempts: 3,
                },
            });

            // In development, log OTP (in production, send via Twilio)
            if (process.env.NODE_ENV === "development" || process.env.DEV_OTP_ENABLED === "true") {
                console.log(`[DEV OTP] Phone: ${normalizedPhone}, OTP: ${otp}`);
            } else {
                // TODO: Implement Twilio SMS sending
                // const smsResult = await twilioService.sendOTP(normalizedPhone, otp);
            }

            res.json({
                success: true,
                message: "OTP sent successfully",
                data: {
                    phone: normalizedPhone,
                    expiresAt: expiresAt.toISOString(),
                    // Include OTP in dev mode for testing
                    ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and authenticate user
 */
authRouter.post(
    "/verify-otp",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { phone, code } = validateRequest(verifyOTPSchema, req.body);

            // Validate phone
            const validation = validateNepalPhone(phone);
            if (!validation.isValid) {
                throw new BadRequestError(validation.error || "Invalid phone number");
            }

            const normalizedPhone = validation.normalized;

            // Get stored OTP
            const storedOTP = await prisma.oTPVerification.findFirst({
                where: {
                    phone: normalizedPhone,
                    purpose: "LOGIN",
                    status: "PENDING",
                },
                orderBy: { createdAt: "desc" },
            });

            if (!storedOTP) {
                throw new BadRequestError("No OTP found. Please request a new code.");
            }

            // Check expiry
            if (storedOTP.expiresAt < new Date()) {
                await prisma.oTPVerification.update({
                    where: { id: storedOTP.id },
                    data: { status: "EXPIRED" },
                });
                throw new BadRequestError("OTP has expired. Please request a new code.");
            }

            // Check attempts
            if (storedOTP.attempts >= storedOTP.maxAttempts) {
                await prisma.oTPVerification.update({
                    where: { id: storedOTP.id },
                    data: { status: "FAILED" },
                });
                throw new BadRequestError("Too many failed attempts. Please request a new code.");
            }

            // Verify OTP
            const isValid = verifyOTPHash(code, storedOTP.code);

            if (!isValid) {
                await prisma.oTPVerification.update({
                    where: { id: storedOTP.id },
                    data: { attempts: { increment: 1 } },
                });
                const remainingAttempts = storedOTP.maxAttempts - storedOTP.attempts - 1;
                throw new BadRequestError(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
            }

            // OTP is valid - mark as verified
            await prisma.oTPVerification.update({
                where: { id: storedOTP.id },
                data: {
                    status: "VERIFIED",
                    verifiedAt: new Date(),
                },
            });

            // Find or create user
            let user = await prisma.user.findUnique({
                where: { 
                    phone: normalizedPhone 
                },
            });

            const isNewUser = !user;

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        phone: normalizedPhone,
                        phoneVerified: true,
                    },
                });

                // Create initial progress record
                await prisma.userProgress.create({
                    data: { userId: user.id },
                });
            } else {
                // Update phone verified status
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        phoneVerified: true,
                        lastActiveAt: new Date(),
                    },
                });
            }

            // Generate JWT token
            const token = generateToken(user.id, normalizedPhone);

            // Create session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await prisma.userSession.create({
                data: {
                    userId: user.id,
                    token,
                    expiresAt,
                    deviceInfo: req.headers["user-agent"] || null,
                    ipAddress: req.ip || null,
                },
            });

            res.json({
                success: true,
                message: "OTP verified successfully",
                data: {
                    token,
                    expiresAt: expiresAt.toISOString(),
                    isNewUser,
                    user: {
                        id: user.id,
                        phone: user.phone,
                        name: user.name,
                        username: user.username,
                        email: user.email,
                        avatar: user.avatar,
                        onboardingComplete: !!(user.name && user.currentExamTypeId),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh authentication token
 */
authRouter.post(
    "/refresh",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith("Bearer ")) {
                throw new BadRequestError("No token provided");
            }

            const oldToken = authHeader.split(" ")[1];

            // Find session
            const session = await prisma.userSession.findUnique({
                where: { token: oldToken },
                include: { user: true },
            });

            if (!session || session.expiresAt < new Date()) {
                throw new BadRequestError("Invalid or expired session");
            }

            if (!session.user.phone) {
                throw new BadRequestError("User phone not found");
            }

            // Generate new token
            const newToken = generateToken(session.userId, session.user.phone);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Update session
            await prisma.userSession.update({
                where: { id: session.id },
                data: {
                    token: newToken,
                    expiresAt,
                    lastAccessedAt: new Date(),
                },
            });

            res.json({
                success: true,
                data: {
                    token: newToken,
                    expiresAt: expiresAt.toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/v1/auth/logout
 * Logout user (invalidate session)
 */
authRouter.post(
    "/logout",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];
                await prisma.userSession.deleteMany({
                    where: { token },
                });
            }

            res.json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error) {
            next(error);
        }
    }
);
