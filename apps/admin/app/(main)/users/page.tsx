"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Users, Search, Filter, ChevronLeft, ChevronRight, X, Phone, 
    Mail, Calendar, Target, Activity, Clock, BookOpen, Loader2, 
    Eye
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import { getUsers, getUserDetails } from "@/actions/admin.action"
import { format } from "date-fns"

// Types
interface PrepUser {
    id: string
    phone: string
    phoneVerified: boolean
    name: string | null
    username: string | null
    email: string | null
    avatar: string | null
    dailyGoal: string
    status: string
    createdAt: string
    lastActiveAt: string | null
    _count?: {
        questionAttempts: number
    }
    progress?: {
        totalQuestionsAttempted: number
        totalCorrect: number
        currentStreak: number
        longestStreak: number
    } | null
}

interface UserDetails extends PrepUser {
    currentExamType?: { name: string } | null
    currentExamLevel?: { name: string } | null
    progress?: {
        totalQuestionsAttempted: number
        totalCorrect: number
        totalIncorrect: number
        totalSkipped: number
        totalTimeSpentSeconds: number
        currentStreak: number
        longestStreak: number
        lastPracticeDate: string | null
    } | null
    dailyProgress?: Array<{
        date: string
        questionsCompleted: number
        questionsCorrect: number
        goalMet: boolean
    }>
}

interface PaginationInfo {
    total: number
    page: number
    limit: number
    totalPages: number
}

// Sheet/Drawer component
interface SheetProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
}

function Sheet({ open, onClose, children }: SheetProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (open) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = ""
        }
    }, [open, onClose])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />
                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-y-auto"
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// User detail section
interface DetailItemProps {
    icon: React.ReactNode
    label: string
    value: string | number | null
}

function DetailItem({ icon, label, value }: DetailItemProps) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="text-neutral-400">{icon}</div>
            <div>
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {value || "—"}
                </p>
            </div>
        </div>
    )
}

// Stat card in sheet
interface StatBoxProps {
    label: string
    value: string | number
    color?: string
}

function StatBox({ label, value, color = "text-neutral-900" }: StatBoxProps) {
    return (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-neutral-500 mt-1">{label}</p>
        </div>
    )
}

export default function UsersPage() {
    const [users, setUsers] = useState<PrepUser[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("")
    
    // Sheet state
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [loadingDetails, setLoadingDetails] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const loadUsers = useCallback(async () => {
        setLoading(true)
        try {
            const response = await getUsers({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
                status: statusFilter || undefined
            })
            if (response.success && response.data) {
                setUsers(response.data.users)
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages
                }))
            }
        } catch (error) {
            console.error("Failed to load users:", error)
        } finally {
            setLoading(false)
        }
    }, [pagination.page, pagination.limit, debouncedSearch, statusFilter])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }))
    }, [debouncedSearch, statusFilter])

    async function openUserDetails(userId: string) {
        setLoadingDetails(true)
        setSheetOpen(true)
        try {
            const response = await getUserDetails(userId)
            if (response.success && response.data) {
                setSelectedUser(response.data)
            }
        } catch (error) {
            console.error("Failed to load user details:", error)
        } finally {
            setLoadingDetails(false)
        }
    }

    function closeSheet() {
        setSheetOpen(false)
        setTimeout(() => setSelectedUser(null), 200)
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Users</h1>
                    <p className="text-neutral-500 mt-1">
                        Manage and view all PrepSathi users
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Users className="w-4 h-4" />
                    <span>{pagination.total.toLocaleString()} total users</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Goal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Attempts
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : user.phone.slice(-2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-white">
                                                        {user.name || "Unnamed User"}
                                                    </p>
                                                    {user.username && (
                                                        <p className="text-xs text-neutral-500">@{user.username}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {user.phone}
                                                </span>
                                                {user.phoneVerified && (
                                                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn(
                                                "px-2 py-1 text-xs font-medium rounded-full",
                                                user.status === "ACTIVE" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                                                user.status === "INACTIVE" && "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
                                                user.status === "SUSPENDED" && "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                            )}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                                                {user.dailyGoal.toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                {user._count?.questionAttempts?.toLocaleString() || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {format(new Date(user.createdAt), "MMM d, yyyy")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {user.lastActiveAt 
                                                    ? format(new Date(user.lastActiveAt), "MMM d, yyyy")
                                                    : "Never"
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => openUserDetails(user.id)}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && users.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="text-sm text-neutral-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                            {pagination.total.toLocaleString()} users
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum = i + 1
                                    if (pagination.totalPages > 5) {
                                        if (pagination.page > 3) {
                                            pageNum = pagination.page - 2 + i
                                        }
                                        if (pageNum > pagination.totalPages) {
                                            pageNum = pagination.totalPages - 4 + i
                                        }
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                                pagination.page === pageNum
                                                    ? "bg-blue-600 text-white"
                                                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Details Sheet */}
            <Sheet open={sheetOpen} onClose={closeSheet}>
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">User Details</h2>
                    <button
                        onClick={closeSheet}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loadingDetails ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    </div>
                ) : selectedUser ? (
                    <div className="p-6 space-y-6">
                        {/* User Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                                {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.phone.slice(-2)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    {selectedUser.name || "Unnamed User"}
                                </h3>
                                {selectedUser.username && (
                                    <p className="text-neutral-500">@{selectedUser.username}</p>
                                )}
                                <span className={cn(
                                    "mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full",
                                    selectedUser.status === "ACTIVE" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                                    selectedUser.status === "INACTIVE" && "bg-neutral-100 text-neutral-600",
                                    selectedUser.status === "SUSPENDED" && "bg-red-50 text-red-600"
                                )}>
                                    {selectedUser.status}
                                </span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Contact</h4>
                            <DetailItem 
                                icon={<Phone className="w-4 h-4" />} 
                                label="Phone" 
                                value={selectedUser.phone} 
                            />
                            <DetailItem 
                                icon={<Mail className="w-4 h-4" />} 
                                label="Email" 
                                value={selectedUser.email} 
                            />
                            <DetailItem 
                                icon={<Calendar className="w-4 h-4" />} 
                                label="Joined" 
                                value={format(new Date(selectedUser.createdAt), "MMMM d, yyyy")} 
                            />
                        </div>

                        {/* Exam Info */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Preparation</h4>
                            <DetailItem 
                                icon={<BookOpen className="w-4 h-4" />} 
                                label="Exam Type" 
                                value={selectedUser.currentExamType?.name || null} 
                            />
                            <DetailItem 
                                icon={<Target className="w-4 h-4" />} 
                                label="Level" 
                                value={selectedUser.currentExamLevel?.name || null} 
                            />
                            <DetailItem 
                                icon={<Activity className="w-4 h-4" />} 
                                label="Daily Goal" 
                                value={selectedUser.dailyGoal} 
                            />
                        </div>

                        {/* Stats */}
                        {selectedUser.progress && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Progress Stats</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatBox 
                                        label="Total Attempts" 
                                        value={selectedUser.progress.totalQuestionsAttempted.toLocaleString()} 
                                    />
                                    <StatBox 
                                        label="Correct" 
                                        value={selectedUser.progress.totalCorrect.toLocaleString()} 
                                        color="text-emerald-600"
                                    />
                                    <StatBox 
                                        label="Current Streak" 
                                        value={`${selectedUser.progress.currentStreak} days`} 
                                        color="text-amber-600"
                                    />
                                    <StatBox 
                                        label="Longest Streak" 
                                        value={`${selectedUser.progress.longestStreak} days`} 
                                        color="text-blue-600"
                                    />
                                </div>

                                {/* Accuracy */}
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Accuracy</span>
                                        <span className="text-lg font-bold text-neutral-900 dark:text-white">
                                            {selectedUser.progress.totalQuestionsAttempted > 0
                                                ? `${((selectedUser.progress.totalCorrect / selectedUser.progress.totalQuestionsAttempted) * 100).toFixed(1)}%`
                                                : "0%"
                                            }
                                        </span>
                                    </div>
                                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                            style={{ 
                                                width: `${selectedUser.progress.totalQuestionsAttempted > 0
                                                    ? (selectedUser.progress.totalCorrect / selectedUser.progress.totalQuestionsAttempted) * 100
                                                    : 0
                                                }%` 
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Time Spent */}
                                <DetailItem 
                                    icon={<Clock className="w-4 h-4" />} 
                                    label="Total Time Spent" 
                                    value={`${Math.round(selectedUser.progress.totalTimeSpentSeconds / 60)} minutes`} 
                                />
                                <DetailItem 
                                    icon={<Calendar className="w-4 h-4" />} 
                                    label="Last Practice" 
                                    value={selectedUser.progress.lastPracticeDate 
                                        ? format(new Date(selectedUser.progress.lastPracticeDate), "MMM d, yyyy")
                                        : null
                                    } 
                                />
                            </div>
                        )}
                    </div>
                ) : null}
            </Sheet>
        </div>
    )
}
