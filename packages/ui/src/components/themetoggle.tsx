"use client"

import { 
    Moon, Sun 
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@repo/ui/lib/utils"

interface ThemeToggleProps {
    className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { resolvedTheme, setTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    const handleThemeToggle = (e: React.MouseEvent<HTMLDivElement>) => {
        const nextTheme = isDark ? "light" : "dark"

        // Fallback for browsers that don't support View Transitions API
        if (!document.startViewTransition) {
            setTheme(nextTheme)
            return
        }

        const x = e.clientX
        const y = e.clientY
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        )

        const transition = document.startViewTransition(() => {
            setTheme(nextTheme)
        })

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
            ]
            
            document.documentElement.animate(
                {
                    clipPath: isDark ? [...clipPath].reverse() : clipPath,
                },
                {
                    duration: 500,
                    easing: "ease-in-out",
                    pseudoElement: isDark
                        ? "::view-transition-old(root)"
                        : "::view-transition-new(root)",
                }
            )
        })
    }

    return (
        <div
            className={cn(
                "relative flex w-16 h-8 p-1 rounded-full cursor-pointer transition-colors duration-300",
                isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-200 border-zinc-300",
                "border shadow-sm",
                className
            )}
            onClick={handleThemeToggle}
            role="button"
            tabIndex={0}
            aria-label="Toggle theme"
        >
            <div
                className={cn(
                    "absolute top-1 left-1 flex items-center justify-center w-6 h-6 rounded-full bg-background shadow-sm transition-transform duration-500 ease-spring",
                    isDark ? "translate-x-8" : "translate-x-0"
                )}
            >
                {
                isDark ? (
                    <Moon className="w-3.5 h-3.5 text-foreground" strokeWidth={2} />
                ) : (
                    <Sun className="w-3.5 h-3.5 text-foreground" strokeWidth={2} />
                )
                }
            </div>
            <div className="flex justify-between items-center w-full px-1.5 opacity-40">
                <Sun className="w-3.5 h-3.5" />
                <Moon className="w-3.5 h-3.5" />
            </div>
        </div>
    )
}