"use client"

import { useState, useEffect } from "react"
import {
    Users, FileText, TrendingUp, TrendingDown, Activity, BarChart3,
    Clock, Target, BookOpen, CheckCircle, Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import { getDashboardStats } from "@/actions/admin.action"

interface DashboardStats {
    users: {
        total: number
        active: number
        newToday: number
        newThisWeek: number
        growthPercent: number
    }
    questions: {
        total: number
        verified: number
        pending: number
    }
    practice: {
        totalAttempts: number
        attemptsToday: number
        avgAccuracy: number
    }
    engagement: {
        dailyActiveUsers: number
        avgSessionMinutes: number
        streakAverage: number
    }
}

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon: React.ReactNode
    iconBg: string
    iconColor: string
}

function StatCard({ title, value, change, changeLabel, icon, iconBg, iconColor }: StatCardProps) {
    const isPositive = change && change >= 0
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                            {isPositive ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className={cn(
                                "text-sm font-medium",
                                isPositive ? "text-emerald-500" : "text-red-500"
                            )}>
                                {isPositive ? "+" : ""}{change.toFixed(1)}%
                            </span>
                            {changeLabel && (
                                <span className="text-sm text-neutral-400 ml-1">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl", iconBg)}>
                    <div className={iconColor}>{icon}</div>
                </div>
            </div>
        </motion.div>
    )
}

interface RecentUserProps {
    name: string
    phone: string
    joinedAt: string
}

function RecentUserRow({ name, phone, joinedAt }: RecentUserProps) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {name ? name.charAt(0).toUpperCase() : phone.slice(-2)}
                </div>
                <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                        {name || "New User"}
                    </p>
                    <p className="text-sm text-neutral-500">{phone}</p>
                </div>
            </div>
            <span className="text-sm text-neutral-400">{joinedAt}</span>
        </div>
    )
}

interface QuestionStatsProps {
    subject: string
    total: number
    accuracy: number
    attempts: number
}

function QuestionStatsRow({ subject, total, accuracy, attempts }: QuestionStatsProps) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{subject}</p>
                    <p className="text-sm text-neutral-500">{total} questions</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-medium text-neutral-900 dark:text-white">{accuracy}%</p>
                <p className="text-sm text-neutral-500">{attempts.toLocaleString()} attempts</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    async function loadStats() {
        try {
            const response = await getDashboardStats()
            if (response.success && response.data) {
                setStats(response.data as DashboardStats)
            }
        } catch (error) {
            console.error("Failed to load dashboard stats:", error)
            // Set default stats for demo
            setStats({
                users: {
                    total: 0,
                    active: 0,
                    newToday: 0,
                    newThisWeek: 0,
                    growthPercent: 0
                },
                questions: {
                    total: 0,
                    verified: 0,
                    pending: 0
                },
                practice: {
                    totalAttempts: 0,
                    attemptsToday: 0,
                    avgAccuracy: 0
                },
                engagement: {
                    dailyActiveUsers: 0,
                    avgSessionMinutes: 0,
                    streakAverage: 0
                }
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
                <p className="text-neutral-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with PrepSathi.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.users.total || 0}
                    change={stats?.users.growthPercent}
                    changeLabel="vs last week"
                    icon={<Users className="w-5 h-5" />}
                    iconBg="bg-blue-50 dark:bg-blue-500/10"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    title="Active Users (Today)"
                    value={stats?.engagement.dailyActiveUsers || 0}
                    icon={<Activity className="w-5 h-5" />}
                    iconBg="bg-emerald-50 dark:bg-emerald-500/10"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatCard
                    title="Total Questions"
                    value={stats?.questions.total || 0}
                    icon={<FileText className="w-5 h-5" />}
                    iconBg="bg-purple-50 dark:bg-purple-500/10"
                    iconColor="text-purple-600 dark:text-purple-400"
                />
                <StatCard
                    title="Avg. Accuracy"
                    value={`${stats?.practice.avgAccuracy?.toFixed(1) || 0}%`}
                    icon={<Target className="w-5 h-5" />}
                    iconBg="bg-amber-50 dark:bg-amber-500/10"
                    iconColor="text-amber-600 dark:text-amber-400"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Attempts"
                    value={stats?.practice.attemptsToday || 0}
                    icon={<BarChart3 className="w-5 h-5" />}
                    iconBg="bg-indigo-50 dark:bg-indigo-500/10"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                />
                <StatCard
                    title="New Users (Today)"
                    value={stats?.users.newToday || 0}
                    icon={<Users className="w-5 h-5" />}
                    iconBg="bg-pink-50 dark:bg-pink-500/10"
                    iconColor="text-pink-600 dark:text-pink-400"
                />
                <StatCard
                    title="Verified Questions"
                    value={stats?.questions.verified || 0}
                    icon={<CheckCircle className="w-5 h-5" />}
                    iconBg="bg-teal-50 dark:bg-teal-500/10"
                    iconColor="text-teal-600 dark:text-teal-400"
                />
                <StatCard
                    title="Avg. Session Time"
                    value={`${stats?.engagement.avgSessionMinutes || 0}m`}
                    icon={<Clock className="w-5 h-5" />}
                    iconBg="bg-orange-50 dark:bg-orange-500/10"
                    iconColor="text-orange-600 dark:text-orange-400"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Users</h2>
                        <a href="/users" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            View all →
                        </a>
                    </div>
                    <div className="space-y-1">
                        <RecentUserRow 
                            name="Ram Bahadur" 
                            phone="+977 98XXXXXXXX" 
                            joinedAt="2 hours ago" 
                        />
                        <RecentUserRow 
                            name="Sita Sharma" 
                            phone="+977 98XXXXXXXX" 
                            joinedAt="5 hours ago" 
                        />
                        <RecentUserRow 
                            name="" 
                            phone="+977 98XXXXXXXX" 
                            joinedAt="1 day ago" 
                        />
                        <RecentUserRow 
                            name="Hari Prasad" 
                            phone="+977 98XXXXXXXX" 
                            joinedAt="2 days ago" 
                        />
                    </div>
                </motion.div>

                {/* Question Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Subject Performance</h2>
                        <a href="/analytics" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            View analytics →
                        </a>
                    </div>
                    <div className="space-y-1">
                        <QuestionStatsRow 
                            subject="General Knowledge" 
                            total={250} 
                            accuracy={72} 
                            attempts={15420} 
                        />
                        <QuestionStatsRow 
                            subject="Nepali" 
                            total={200} 
                            accuracy={68} 
                            attempts={12350} 
                        />
                        <QuestionStatsRow 
                            subject="English" 
                            total={200} 
                            accuracy={65} 
                            attempts={11200} 
                        />
                        <QuestionStatsRow 
                            subject="Mathematics" 
                            total={150} 
                            accuracy={58} 
                            attempts={8900} 
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
