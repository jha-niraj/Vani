"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@repo/ui/components/ui/sonner";
import {
    Mic, Globe, CheckCircle2, ArrowRight, ArrowLeft,
    BookOpen, Briefcase, GraduationCap, Clock
} from "lucide-react";
import { completeOnboarding } from "@/actions/onboarding.action";

const LANGUAGES = [
    { code: "hi-IN", name: "Hindi", native: "हिन्दी" },
    { code: "en-IN", name: "English", native: "English" },
    { code: "hinglish", name: "Hinglish", native: "हिंग्लिश" },
    { code: "bn-IN", name: "Bengali", native: "বাংলা" },
    { code: "ta-IN", name: "Tamil", native: "தமிழ்" },
    { code: "te-IN", name: "Telugu", native: "తెలుగు" },
    { code: "mr-IN", name: "Marathi", native: "मराठी" },
    { code: "gu-IN", name: "Gujarati", native: "ગુજરાતી" },
    { code: "kn-IN", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "ml-IN", name: "Malayalam", native: "മലയാളം" },
    { code: "pa-IN", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "od-IN", name: "Odia", native: "ଓଡ଼ିଆ" },
    { code: "mai-IN", name: "Maithili", native: "maithili" },
];

const USE_CASES = [
    { id: "student_lectures", label: "Capture lectures & class notes", icon: GraduationCap, desc: "Record lectures and get structured notes" },
    { id: "study_planning", label: "Study planning & to-dos", icon: BookOpen, desc: "Speak your plan, get actionable tasks" },
    { id: "meeting_notes", label: "Meeting & project notes", icon: Briefcase, desc: "Never miss action items from meetings" },
    { id: "personal_notes", label: "Quick personal voice notes", icon: Clock, desc: "Capture thoughts on the go" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [selectedUseCase, setSelectedUseCase] = useState("");
    const [consentGiven, setConsentGiven] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSteps = 3;

    const handleComplete = async () => {
        if (!selectedLanguage) return toast.error("Please select a language.");
        if (!selectedUseCase) return toast.error("Please select how you'll use Vani.");
        if (!consentGiven) return toast.error("Please agree to audio data processing.");

        setIsSubmitting(true);
        try {
            const result = await completeOnboarding({
                preferredLanguage: selectedLanguage,
                useCase: selectedUseCase,
                consentGiven,
            });

            if (result.success) {
                toast.success("You're all set! 🎉");
                router.replace("/home");
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Failed to save preferences.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        if (step === 0) return !!selectedLanguage;
        if (step === 1) return !!selectedUseCase;
        if (step === 2) return consentGiven;
        return false;
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4">
            <div className="w-full max-w-lg relative z-10">
                <div className="mb-8">
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                        <span>Step {step + 1} of {totalSteps}</span>
                        <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-black dark:bg-white rounded-full"
                            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {
                            step === 0 && (
                                <motion.div
                                    key="lang"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">
                                                What language do you speak most?
                                            </h2>
                                            <p className="text-sm text-slate-400">
                                                This helps Vani transcribe your recordings accurately
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {
                                            LANGUAGES.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => setSelectedLanguage(lang.code)}
                                                    className={`cursor-pointer p-3 rounded-xl text-left transition-all border ${selectedLanguage === lang.code
                                                        ? "border-white bg-neutral-900/10 text-white ring-1 ring-indigo-500/30"
                                                        : "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.04]"
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium text-white">{lang.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{lang.native}</p>
                                                </button>
                                            ))
                                        }
                                    </div>
                                </motion.div>
                            )
                        }
                        {
                            step === 1 && (
                                <motion.div
                                    key="usecase"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                                            <Mic className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">
                                                How will you use Vani?
                                            </h2>
                                            <p className="text-sm text-slate-400">
                                                We&apos;ll tailor the experience for you
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {
                                            USE_CASES.map((uc) => (
                                                <button
                                                    key={uc.id}
                                                    onClick={() => setSelectedUseCase(uc.id)}
                                                    className={`cursor-pointer w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border ${selectedUseCase === uc.id
                                                        ? "border-white bg-neutral-900/10 ring-1 ring-purple-500/30"
                                                        : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                                                        }`}
                                                >
                                                    <div className={`p-2 rounded-lg flex-shrink-0 ${selectedUseCase === uc.id
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-white/5 text-slate-400"
                                                        }`}>
                                                        <uc.icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{uc.label}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{uc.desc}</p>
                                                    </div>
                                                    {
                                                        selectedUseCase === uc.id && (
                                                            <CheckCircle2 className="h-5 w-5 text-purple-400 ml-auto flex-shrink-0" />
                                                        )
                                                    }
                                                </button>
                                            ))
                                        }
                                    </div>
                                </motion.div>
                            )
                        }
                        {
                            step === 2 && (
                                <motion.div
                                    key="consent"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">
                                                Almost there!
                                            </h2>
                                            <p className="text-sm text-slate-400">
                                                Review and confirm to start using Vani
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-6">
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Language</p>
                                            <p className="text-sm text-white font-medium">
                                                {LANGUAGES.find((l) => l.code === selectedLanguage)?.name || "—"}{" "}
                                                <span className="text-slate-500">
                                                    ({LANGUAGES.find((l) => l.code === selectedLanguage)?.native})
                                                </span>
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Use case</p>
                                            <p className="text-sm text-white font-medium">
                                                {USE_CASES.find((u) => u.id === selectedUseCase)?.label || "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer group hover:border-white/15 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={consentGiven}
                                            onChange={(e) => setConsentGiven(e.target.checked)}
                                            className="cursor-pointer mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30"
                                        />
                                        <span className="text-sm text-slate-300 leading-relaxed">
                                            I agree that my voice recordings will be processed by AI services
                                            (Sarvam for transcription, OpenAI for extraction) to generate notes and tasks.
                                            Recordings are stored securely and can be deleted anytime.
                                        </span>
                                    </label>
                                </motion.div>
                            )
                        }
                    </AnimatePresence>
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                        <button
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            disabled={step === 0}
                            className="cursor-pointer flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>

                        {
                            step < totalSteps - 1 ? (
                                <button
                                    onClick={() => setStep((s) => s + 1)}
                                    disabled={!canProceed()}
                                    className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleComplete}
                                    disabled={!canProceed() || isSubmitting}
                                    className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {
                                        isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <motion.div
                                                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                />
                                                Setting up...
                                            </span>
                                        ) : (
                                            <>
                                                Start using Vani
                                                <CheckCircle2 className="h-4 w-4" />
                                            </>
                                        )
                                    }
                                </button>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}