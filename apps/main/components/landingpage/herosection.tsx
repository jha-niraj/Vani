"use client";

import { useEffect, useState, FormEvent } from "react";
import {
    ArrowRight, Mic, Loader2, CheckCircle2
} from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import toast from "@repo/ui/components/ui/sonner";
import { signIn } from "@repo/auth/client";
import { useRouter } from "next/navigation";
import { sendOtpAction } from "@/actions/auth.action";

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsVisible(true);
    }, []);

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
                const normalizedEmail = email.trim().toLowerCase();
                router.replace(`/onboarding?email=${encodeURIComponent(normalizedEmail)}`);
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
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
            <div className="relative z-10 flex flex-col justify-center items-center px-4 py-20 lg:py-32">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="px-6 lg:px-12 py-12 lg:py-20">
                        <div className="flex flex-col text-center mb-12">
                            <div className="flex gap-4 justify-center mb-6">
                                <div className="h-12 w-12 flex items-center justify-center bg-primary/10 rounded-3xl">
                                    <Mic className="h-6 w-6" />
                                </div>
                            </div>
                            <h1
                                className={`text-3xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                    }`}
                            >
                                Welcome to Vani
                            </h1>
                            <p
                                className={`text-base lg:text-lg text-muted-foreground transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    }`}
                            >
                                Your voice-first workspace. Convert recordings into structured notes and actionable tasks.
                            </p>
                        </div>
                        <div
                            className={`rounded-2xl border bg-card p-6 shadow-sm md:p-8 max-w-md mx-auto mb-8 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                }`}
                        >
                            {
                                !otpSent ? (
                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-medium">
                                                Email address
                                            </label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-11 w-full px-4 rounded-lg bg-background border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors"
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
                                            <Label htmlFor="otp" className="text-sm font-medium">
                                                One-Time Password
                                            </Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="Enter 6-digit code"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="h-11 w-full px-4 rounded-lg bg-background border border-foreground/10 focus:border-foreground/30 focus:outline-none transition-colors text-center text-lg tracking-widest"
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
                        <div
                            className={`grid grid-cols-2 gap-4 text-xs text-muted-foreground max-w-md mx-auto transition-all duration-700 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                }`}
                        >
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
            </div>
        </section>
    );
}