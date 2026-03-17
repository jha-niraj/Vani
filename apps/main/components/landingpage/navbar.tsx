"use client";

import { useState, useEffect } from "react";
import {
    Menu, X, Mic, Library
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@repo/ui/components/themetoggle";

const navItems = [
    { name: "Record", href: "/home", icon: Mic },
    { name: "Library", href: "/library", icon: Library },
];

export function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed max-w-4xl mx-auto z-50 transition-all duration-500 ${isScrolled
                    ? "top-4 left-4 right-4"
                    : "top-0 left-0 right-0"
                }`}
        >
            <nav
                className={`mx-auto transition-all duration-500 ${isScrolled || isMobileMenuOpen
                        ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
                        : "bg-transparent max-w-[1400px]"
                    }`}
            >
                <div
                    className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${isScrolled ? "h-14" : "h-20"
                        }`}
                >
                    <Link href="#" className="flex items-center gap-2 group">
                        <span className={`font-display tracking-tight transition-all duration-500 ${isScrolled ? "text-xl" : "text-2xl"}`}>Vani</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        {
                            navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
                                    </Link>
                                );
                            })
                        }
                    </div>
                    <ThemeToggle />
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 z-1000"
                        aria-label="Toggle menu"
                    >
                        {
                            isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )
                        }
                    </button>
                </div>
            </nav>
            <div
                className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${isMobileMenuOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }`}
                style={{ top: 0 }}
            >
                <div className="flex flex-col h-full px-8 pt-28 pb-8">
                    <div className="flex-1 flex flex-col justify-center gap-8">
                        {
                            navItems.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-4 text-3xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${isMobileMenuOpen
                                                ? "opacity-100 translate-y-0"
                                                : "opacity-0 translate-y-4"
                                            }`}
                                        style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
                                    >
                                        <Icon className="w-8 h-8" />
                                        {item.name}
                                    </Link>
                                );
                            })
                        }
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}