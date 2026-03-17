"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Mic, Library, CheckSquare, Settings, MessageCircle
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { ThemeToggle } from "@repo/ui/components/themetoggle"
import { signOut, useSession } from "@repo/auth/client"
import { Button } from "@repo/ui/components/ui/button"
import Image from "next/image"

const navItems = [
    { name: "Record", href: "/home", icon: Mic },
    { name: "Library", href: "/library", icon: Library },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Interact", href: "/interact", icon: MessageCircle },
    { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <>
            <aside className="hidden md:flex w-56 flex-col border-r bg-card/50 backdrop-blur-sm px-3 py-5 h-screen sticky top-20">
                <div className="px-3 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                            <Mic className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-foreground tracking-tight">Vani</span>
                    </div>
                </div>
                <nav className="space-y-1 flex-1">
                    {
                        navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/home" && pathname.startsWith(item.href))
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            )
                        })
                    }
                </nav>
                <div className="mt-auto pt-4 border-t border-border/50">
                    <ThemeToggle />
                </div>
                <div>
                    {
                        session && (
                            <div className="">
                                <div className="mt-4 px-3 py-2 rounded-lg bg-muted flex items-center gap-3">
                                    {
                                        session?.user?.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt={session.user.name || "User Avatar"}
                                                className="w-8 h-8 rounded-full"
                                                width={32}
                                                height={32}
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span className="text-xs text-gray-600">
                                                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                                                </span>
                                            </div>
                                        )
                                    }
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">{session.user?.name}</span>
                                        <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => signOut()}
                                    className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Log Out
                                </Button>
                            </div>
                        )
                    }
                </div>
            </aside>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/90 backdrop-blur-lg pb-safe">
                {
                    navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/home" && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 py-2.5 px-2 text-[10px] font-medium transition-colors min-w-0",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isActive && "bg-primary/10"
                                )}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <span className="truncate">{item.name}</span>
                            </Link>
                        )
                    })
                }
            </nav>
        </>
    )
}