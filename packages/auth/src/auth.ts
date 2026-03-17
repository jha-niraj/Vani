import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@repo/prisma";
import crypto from "crypto";

function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function safeOtpEqual(inputOtp: string, storedHash: string): boolean {
    const inputHash = hashOtp(inputOtp);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    providers: [
        CredentialsProvider({
            name: "Email OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                otp: { label: "OTP", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.otp) {
                    return null;
                }

                try {
                    const normalizedEmail = credentials.email.trim().toLowerCase();
                    const otpInput = credentials.otp.trim();

                    const latestOtp = await prisma.emailOTP.findFirst({
                        where: {
                            email: normalizedEmail,
                            consumedAt: null,
                            expiresAt: { gt: new Date() },
                        },
                        orderBy: { createdAt: "desc" },
                    });

                    if (!latestOtp) {
                        return null;
                    }

                    const isValidOtp = safeOtpEqual(otpInput, latestOtp.otpHash);

                    if (!isValidOtp) {
                        await prisma.emailOTP.update({
                            where: { id: latestOtp.id },
                            data: { attempts: { increment: 1 } },
                        });
                        return null;
                    }

                    await prisma.emailOTP.update({
                        where: { id: latestOtp.id },
                        data: { consumedAt: new Date() },
                    });

                    let user = await prisma.user.findUnique({
                        where: { email: normalizedEmail },
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: normalizedEmail,
                                name: normalizedEmail.split("@")[0] || "Vani User",
                                emailVerified: new Date(),
                            },
                        });
                    }

                    return {
                        id: user.id,
                        email: user.email!,
                        name: user.name || user.email || "User",
                        image: user.image || null,
                        role: user.role || "USER",
                        onboardingCompleted: user.onboarded || false,
                    };
                } catch (error) {
                    console.error("Email OTP authorization error:", error);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        // JWT callback - apps can extend to add custom claims
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.image = user.image;
                token.role = user.role;
                token.onboardingCompleted = Boolean((user as { onboardingCompleted?: boolean }).onboardingCompleted);
            }

            // Support session updates
            if (trigger === "update" && session) {
                if (token.id) {
                    const dbUser = await prisma.user.findUnique({
                        where: { 
                            id: token.id as string 
                        },
                        select: { 
                            onboarded: true 
                        },
                    });
                    token.onboardingCompleted = dbUser?.onboarded ?? false;
                }

                return {
                    ...token,
                    ...session.user,
                    onboardingCompleted: token.onboardingCompleted,
                };
            }

            return token;
        },

        // Session callback - apps can extend to add custom session data
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.image = token.image;
                session.user.role = token.role;
                session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
            }
            session.onboardingCompleted = Boolean(token.onboardingCompleted);
            return session;
        },

        // Sign in callback - apps can add custom logic
        async signIn() {
            return true;
        },

        // Redirect callback - apps can customize redirect behavior
        async redirect({ url, baseUrl }) {
            // Handle relative URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }

            // Allow same-origin redirects
            if (new URL(url).origin === baseUrl) {
                return url;
            }

            // Default redirect
            return baseUrl;
        },
    },

    pages: {
        signIn: "/",
        error: "/error",
    },

    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 7,
    },

    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

// Helper function for server-side auth check
export async function auth() {
    const { getServerSession } = await import("next-auth/next");
    return await getServerSession(authOptions);
}

// Export getServerSession for direct use
export { getServerSession } from "next-auth/next";