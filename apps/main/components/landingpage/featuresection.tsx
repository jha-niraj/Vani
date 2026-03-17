"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { 
    BookOpen, Stethoscope, Briefcase, Lightbulb, Mic2, Users 
} from "lucide-react";

const useCases = [
    {
        title: "Students & Learners",
        description: "Listen fully in lectures, get automatic transcripts and summaries. Never miss a detail again.",
        icon: BookOpen,
        benefit: "Save 5+ hours per week on note-taking"
    },
    {
        title: "Healthcare Professionals",
        description: "Record consultations, auto-generate SOAP notes. Focus on patients, not paperwork.",
        icon: Stethoscope,
        benefit: "Save 30-40% of documentation time"
    },
    {
        title: "Sales & Business",
        description: "Capture client calls, extract action items automatically. Never miss a follow-up.",
        icon: Briefcase,
        benefit: "Improve deal closure rates by 20%"
    },
    {
        title: "Creators & Founders",
        description: "Ideas strike anywhere. One-button capture, zero friction. Your ideas stay with you.",
        icon: Lightbulb,
        benefit: "Never lose an idea again"
    },
    {
        title: "Journalists & Researchers",
        description: "Interview transcription with speaker separation. Searchable, shareable, instant.",
        icon: Mic2,
        benefit: "Transcribe in minutes, not hours"
    },
    {
        title: "Field Workers",
        description: "Log observations hands-free. Walk a site, speak notes, get structured work orders.",
        icon: Users,
        benefit: "Hands-free productivity in any environment"
    },
];

export function FeaturesSection() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry?.target);
                }
            },
            { threshold: 0.1 }
        );

        const element = document.getElementById("features-section");
        if (element) observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <section id="features-section" className="relative py-24 lg:py-32 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
                <div
                    className={`mb-16 lg:mb-24 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        }`}
                >
                    <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                        <span className="w-8 h-px bg-foreground/30" />
                        Real-world use cases
                    </span>
                    <h2 className="text-4xl lg:text-6xl font-display leading-tight">
                        Built for professionals in motion
                    </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                    {
                        useCases.map((useCase, index) => {
                            const Icon = useCase.icon;
                            return (
                                <div
                                    key={useCase.title}
                                    className={`group p-8 rounded-2xl border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/5 transition-all duration-500 ${isVisible
                                            ? "opacity-100 translate-y-0"
                                            : "opacity-0 translate-y-8"
                                        }`}
                                    style={{
                                        transitionDelay: isVisible ? `${index * 75}ms` : "0ms",
                                    }}
                                >
                                    <Icon className="w-8 h-8 mb-4 text-foreground" />
                                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        {useCase.description}
                                    </p>
                                    <p className="text-sm font-medium text-foreground/60">
                                        💡 {useCase.benefit}
                                    </p>
                                </div>
                            );
                        })
                    }
                </div>
                <div
                    className={`mt-16 text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        }`}
                    style={{ transitionDelay: isVisible ? "450ms" : "0ms" }}
                >
                    <Button
                        size="lg"
                        className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full"
                    >
                        Find your use case
                    </Button>
                </div>
            </div>
        </section>
    );
}