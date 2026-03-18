"use client";

export function FooterSection() {
    return (
        <footer className="relative border-t border-foreground/10">
            <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="py-16 lg:py-20">
                    <h2 className="text-2xl font-display">Vani</h2>
                    <p className="text-muted-foreground leading-relaxed mt-4 max-w-xl">
                        Capture voice, transform it into actionable insights. Built for professionals who think faster than they can type.
                    </p>
                </div>
            </div>
        </footer>
    );
}