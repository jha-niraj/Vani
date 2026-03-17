"use client"

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "@repo/auth/client";
import { toast } from "@repo/ui/components/ui/sonner";
import {
    Loader2, Mic, CheckCircle2, ArrowRight
} from "lucide-react";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";
import { sendOtpAction } from "@/actions/auth.action";

export default function Home() {
    const router = useRouter();
    const { status } = useSession();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/home");
        }
    }, [router, status]);

    const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email.trim()) return toast.error("Please enter a valid email address.");

        setIsLoading(true);
        try {
            const response = await sendOtpAction(email);

            if (!response.success) {
                return toast.error(response.message || "Failed to send OTP.");
            }

            setOtpSent(true);
            toast.success(response.message);
            if (response.devOtp) toast.info(`Dev OTP: ${response.devOtp}`);
        } catch (error) {
            toast.error("Something went wrong while sending OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email.trim() || !otp.trim()) return toast.error("Enter your email and OTP.");

        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: email.trim(),
                otp: otp.trim(),
                redirect: false,
            });

            if (result?.ok) {
                toast.success("Welcome to Vani.");
                router.replace("/onboarding");
                return;
            }
            toast.error("Invalid or expired OTP.");
        } catch (error) {
            toast.error("Unable to verify OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex w-full flex-col md:flex-row items-center justify-center flex-1 px-4 py-12">
            <div className="w-full max-w-sm space-y-8">
                <div className="flex flex-col">
                    <div className="flex gap-4">
                        <div className="h-12 w-12 flex items-center justify-center bg-primary/10 rounded-3xl">
                            <Mic className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Welcome to Vani
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground text-center">
                        Your voice-first workspace. Convert recordings into structured notes and actionable tasks.
                    </p>
                </div>
                <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
                    {
                        !otpSent ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 bg-background"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="cursor-pointer flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Email"}
                                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">One-Time Password</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="h-11 bg-background text-center text-lg tracking-widest"
                                        required
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        We sent a code to {email}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="cursor-pointer flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                                </button>
                            </form>
                        )
                    }
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Instant processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Secure sessions</span>
                    </div>
                </div>
            </div>
        </div>
    );
}