import { CtaSection } from "@/components/landingpage/ctasection";
import { FeaturesSection } from "@/components/landingpage/featuresection";
import { FooterSection } from "@/components/landingpage/footersection";
import { HeroSection } from "@/components/landingpage/herosection";
import { Navigation } from "@/components/landingpage/navbar";

export default function Home() {
    return (
        <main className="relative min-h-screen overflow-x-hidden noise-overlay max-w-4xl mx-auto">
            <Navigation />
            <HeroSection />
            <FeaturesSection />
            <CtaSection />
            <FooterSection />
        </main>
    );
}