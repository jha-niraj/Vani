"use client"

import { useState, useEffect, useCallback } from "react"
import {
    BarChart3, Users, FileText, Target, Activity,
    Calendar, Loader2, ArrowUp, ArrowDown
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import { getAnalytics } from "@/actions/admin.action"

interface AnalyticsData {
    overview: {
        totalUsers: number
        activeUsers: number
        totalQuestions: number
        totalAttempts: number
        avgAccuracy: number
        avgSessionMinutes: number
    }
    userGrowth: Array<{
        date: string
        newUsers: number
        activeUsers: number
    }>
    subjectStats: Array<{
        subject: string
        questions: number
        attempts: number
        accuracy: number
    }>
    topicPerformance: Array<{
        topic: string
        subject: string
        accuracy: number
        avgTime: number
    }>
    dailyActivity: Array<{
        date: string
        attempts: number
        correct: number
        users: number
    }>
}

// Simple bar chart
function SimpleBarChart({
    data,
    label,
    maxValue,
    color = "bg-blue-500"
}: {
    data: number
    label: string
    maxValue: number
    color?: string
}) {
    const percentage = maxValue > 0 ? (data / maxValue) * 100 : 0

    return (
        <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-neutral-600 dark:text-neutral-400 truncate">{label}</span>
            <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color)}
                />
            </div>
            <span className="w-16 text-right text-sm font-medium text-neutral-900 dark:text-white">
                {data.toLocaleString()}
            </span>
        </div>
    )
}

// Stat card
interface StatCardProps {
    title: string
    value: string | number
    change?: number
    icon: React.ReactNode
    iconBg: string
    iconColor: string
}

function StatCard({ title, value, change, icon, iconBg, iconColor }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-neutral-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {
                        change !== undefined && (
                            <div className={cn(
                                "flex items-center gap-1 mt-1 text-sm",
                                change >= 0 ? "text-emerald-600" : "text-red-500"
                            )}>
                                {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                <span>{Math.abs(change)}% vs last week</span>
                            </div>
                        )
                    }
                </div>
                <div className={cn("p-2.5 rounded-lg", iconBg)}>
                    <div className={iconColor}>{icon}</div>
                </div>
            </div>
        </motion.div>
    )
}

// Subject performance card
function SubjectCard({
    subject,
    questions,
    attempts,
    accuracy
}: {
    subject: string
    questions: number
    attempts: number
    accuracy: number
}) {
    const getAccuracyColor = (acc: number) => {
        if (acc >= 70) return "text-emerald-600"
        if (acc >= 50) return "text-amber-600"
        return "text-red-500"
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <h4 className="font-semibold text-neutral-900 dark:text-white">{subject}</h4>
            <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                    <p className="text-xs text-neutral-500">Questions</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{questions}</p>
                </div>
                <div>
                    <p className="text-xs text-neutral-500">Attempts</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{attempts.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-neutral-500">Accuracy</p>
                    <p className={cn("text-lg font-bold", getAccuracyColor(accuracy))}>{accuracy}%</p>
                </div>
            </div>
            <div className="mt-3 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        accuracy >= 70 ? "bg-emerald-500" : accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${accuracy}%` }}
                />
            </div>
        </div>
    )
}

// Date range selector
type DateRange = "7d" | "30d" | "90d" | "all"

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<DateRange>("30d")

    const loadAnalytics = useCallback(async () => {
        setLoading(true)
        try {
            const response = await getAnalytics({ range: dateRange })
            if (response.success && response.data) {
                setAnalytics(response.data as AnalyticsData)
            } else {
                // Set default data for demo
                setAnalytics({
                    overview: {
                        totalUsers: 0,
                        activeUsers: 0,
                        totalQuestions: 0,
                        totalAttempts: 0,
                        avgAccuracy: 0,
                        avgSessionMinutes: 0
                    },
                    userGrowth: [],
                    subjectStats: [],
                    topicPerformance: [],
                    dailyActivity: []
                })
            }
        } catch (error) {
            console.error("Failed to load analytics:", error)
            // Set default data
            setAnalytics({
                overview: {
                    totalUsers: 0,
                    activeUsers: 0,
                    totalQuestions: 0,
                    totalAttempts: 0,
                    avgAccuracy: 0,
                    avgSessionMinutes: 0
                },
                userGrowth: [],
                subjectStats: [],
                topicPerformance: [],
                dailyActivity: []
            })
        } finally {
            setLoading(false)
        }
    }, [dateRange])

    useEffect(() => {
        loadAnalytics()
    }, [loadAnalytics])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
                    <p className="text-neutral-500 mt-1">
                        Monitor user engagement and question performance
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                    {
                        [
                            { value: "7d", label: "7 Days" },
                            { value: "30d", label: "30 Days" },
                            { value: "90d", label: "90 Days" },
                            { value: "all", label: "All Time" },
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setDateRange(option.value as DateRange)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    dateRange === option.value
                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                )}
                            >
                                {option.label}
                            </button>
                        ))
                    }
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    title="Total Users"
                    value={analytics?.overview.totalUsers || 0}
                    change={12}
                    icon={<Users className="w-5 h-5" />}
                    iconBg="bg-blue-50 dark:bg-blue-500/10"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    title="Active Users"
                    value={analytics?.overview.activeUsers || 0}
                    change={8}
                    icon={<Activity className="w-5 h-5" />}
                    iconBg="bg-emerald-50 dark:bg-emerald-500/10"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatCard
                    title="Total Questions"
                    value={analytics?.overview.totalQuestions || 0}
                    icon={<FileText className="w-5 h-5" />}
                    iconBg="bg-purple-50 dark:bg-purple-500/10"
                    iconColor="text-purple-600 dark:text-purple-400"
                />
                <StatCard
                    title="Total Attempts"
                    value={analytics?.overview.totalAttempts || 0}
                    change={15}
                    icon={<BarChart3 className="w-5 h-5" />}
                    iconBg="bg-amber-50 dark:bg-amber-500/10"
                    iconColor="text-amber-600 dark:text-amber-400"
                />
                <StatCard
                    title="Avg. Accuracy"
                    value={`${analytics?.overview.avgAccuracy?.toFixed(1) || 0}%`}
                    change={-2}
                    icon={<Target className="w-5 h-5" />}
                    iconBg="bg-pink-50 dark:bg-pink-500/10"
                    iconColor="text-pink-600 dark:text-pink-400"
                />
                <StatCard
                    title="Avg. Session"
                    value={`${analytics?.overview.avgSessionMinutes || 0}m`}
                    icon={<Calendar className="w-5 h-5" />}
                    iconBg="bg-indigo-50 dark:bg-indigo-500/10"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
                >
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        Daily Activity
                    </h3>
                    <div className="space-y-3">
                        {
                            (analytics?.dailyActivity.slice(-7) || []).map((day) => {
                                const maxAttempts = Math.max(...(analytics?.dailyActivity.map(d => d.attempts) || [1]))
                                return (
                                    <SimpleBarChart
                                        key={day.date}
                                        data={day.attempts}
                                        label={new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        maxValue={maxAttempts}
                                        color="bg-gradient-to-r from-blue-500 to-purple-500"
                                    />
                                )
                            })
                        }
                        {
                            (!analytics?.dailyActivity || analytics.dailyActivity.length === 0) && (
                                <div className="text-center py-8 text-neutral-500">
                                    No activity data available
                                </div>
                            )
                        }
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
                >
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        User Growth
                    </h3>
                    <div className="space-y-3">
                        {
                            (analytics?.userGrowth.slice(-7) || []).map((day) => {
                                const maxUsers = Math.max(...(analytics?.userGrowth.map(d => d.newUsers) || [1]))
                                return (
                                    <SimpleBarChart
                                        key={day.date}
                                        data={day.newUsers}
                                        label={new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        maxValue={maxUsers}
                                        color="bg-gradient-to-r from-emerald-500 to-teal-500"
                                    />
                                )
                            })
                        }
                        {
                            (!analytics?.userGrowth || analytics.userGrowth.length === 0) && (
                                <div className="text-center py-8 text-neutral-500">
                                    No growth data available
                                </div>
                            )
                        }
                    </div>
                </motion.div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Subject Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {
                        (analytics?.subjectStats || []).map((subject, index) => (
                            <motion.div
                                key={subject.subject}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                            >
                                <SubjectCard
                                    subject={subject.subject}
                                    questions={subject.questions}
                                    attempts={subject.attempts}
                                    accuracy={subject.accuracy}
                                />
                            </motion.div>
                        ))
                    }
                    {
                        (!analytics?.subjectStats || analytics.subjectStats.length === 0) && (
                            <div className="col-span-full text-center py-8 text-neutral-500">
                                No subject data available
                            </div>
                        )
                    }
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6"
            >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Hardest Topics (Lowest Accuracy)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Topic
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Accuracy
                                </th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Avg Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {
                                (analytics?.topicPerformance || []).slice(0, 10).map((topic) => (
                                    <tr key={topic.topic} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <td className="py-3 px-4 text-sm font-medium text-neutral-900 dark:text-white">
                                            {topic.topic}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                                            {topic.subject}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={cn(
                                                "text-sm font-medium",
                                                topic.accuracy >= 70 ? "text-emerald-600" :
                                                    topic.accuracy >= 50 ? "text-amber-600" : "text-red-500"
                                            )}>
                                                {topic.accuracy}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-neutral-600 dark:text-neutral-400">
                                            {topic.avgTime}s
                                        </td>
                                    </tr>
                                ))
                            }
                            {
                                (!analytics?.topicPerformance || analytics.topicPerformance.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-neutral-500">
                                            No topic data available
                                        </td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}