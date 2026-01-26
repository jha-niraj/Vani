"use client"

import { useState, useEffect, useCallback } from "react"
import {
    FileText, Search, Plus, ChevronLeft, ChevronRight, X,
    Check, XIcon, Pencil, Eye, Loader2, CheckCircle, AlertCircle,
    BookOpen
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import { 
    getQuestions, getSubjects, updateQuestion 
} from "@/actions/admin.action"
import { format } from "date-fns"

// Types
interface Question {
    id: string
    question: string
    questionNp: string | null
    options: { a: string; b: string; c: string; d: string }
    optionsNp: { a: string; b: string; c: string; d: string } | null
    correctAnswer: string
    explanation: string | null
    explanationNp: string | null
    difficulty: "EASY" | "MEDIUM" | "HARD"
    source: string | null
    tags: string[]
    isAIGenerated: boolean
    isVerified: boolean
    isActive: boolean
    attemptCount: number
    correctCount: number
    createdAt: string
    subject: {
        id: string
        name: string
    }
    topic: {
        id: string
        name: string
    }
}

interface Subject {
    id: string
    name: string
    topics: Array<{ id: string; name: string }>
}

interface PaginationInfo {
    total: number
    page: number
    limit: number
    totalPages: number
}

// Sheet component
interface SheetProps {
    open: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

function Sheet({ open, onClose, title, children }: SheetProps) {
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-y-auto"
                    >
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Option display
function OptionItem({ label, text, isCorrect }: { label: string; text: string; isCorrect: boolean }) {
    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            isCorrect 
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700"
        )}>
            <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                isCorrect 
                    ? "bg-emerald-500 text-white" 
                    : "bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300"
            )}>
                {label.toUpperCase()}
            </span>
            <span className={cn(
                "text-sm",
                isCorrect 
                    ? "text-emerald-700 dark:text-emerald-300 font-medium"
                    : "text-neutral-700 dark:text-neutral-300"
            )}>
                {text}
            </span>
            {isCorrect && (
                <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
            )}
        </div>
    )
}

// Difficulty badge
function DifficultyBadge({ difficulty }: { difficulty: "EASY" | "MEDIUM" | "HARD" }) {
    const colors = {
        EASY: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        MEDIUM: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        HARD: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
    }
    
    return (
        <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", colors[difficulty])}>
            {difficulty}
        </span>
    )
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    
    // Filters
    const [subjectFilter, setSubjectFilter] = useState<string>("")
    const [difficultyFilter, setDifficultyFilter] = useState<string>("")
    const [verifiedFilter, setVerifiedFilter] = useState<string>("")
    
    // Sheet state
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Load subjects once
    useEffect(() => {
        async function loadSubjects() {
            try {
                const response = await getSubjects()
                if (response.success && response.data) {
                    setSubjects(response.data)
                }
            } catch (error) {
                console.error("Failed to load subjects:", error)
            }
        }
        loadSubjects()
    }, [])

    const loadQuestions = useCallback(async () => {
        setLoading(true)
        try {
            const response = await getQuestions({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
                subjectId: subjectFilter || undefined,
                difficulty: difficultyFilter || undefined,
                verified: verifiedFilter === "true" ? true : verifiedFilter === "false" ? false : undefined
            })
            if (response.success && response.data) {
                setQuestions(response.data.questions)
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages
                }))
            }
        } catch (error) {
            console.error("Failed to load questions:", error)
        } finally {
            setLoading(false)
        }
    }, [pagination.page, pagination.limit, debouncedSearch, subjectFilter, difficultyFilter, verifiedFilter])

    useEffect(() => {
        loadQuestions()
    }, [loadQuestions])

    // Reset to page 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }))
    }, [debouncedSearch, subjectFilter, difficultyFilter, verifiedFilter])

    function openQuestionDetails(question: Question) {
        setSelectedQuestion(question)
        setSheetOpen(true)
    }

    function closeSheet() {
        setSheetOpen(false)
        setTimeout(() => setSelectedQuestion(null), 200)
    }

    async function toggleVerification(questionId: string, isVerified: boolean) {
        setActionLoading(true)
        try {
            const response = await updateQuestion(questionId, { isVerified: !isVerified })
            if (response.success) {
                // Update local state
                setQuestions(prev => prev.map(q => 
                    q.id === questionId ? { ...q, isVerified: !isVerified } : q
                ))
                if (selectedQuestion?.id === questionId) {
                    setSelectedQuestion(prev => prev ? { ...prev, isVerified: !isVerified } : null)
                }
            }
        } catch (error) {
            console.error("Failed to update question:", error)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Questions</h1>
                    <p className="text-neutral-500 mt-1">
                        Manage question bank for PrepSathi
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Question
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{pagination.total.toLocaleString()}</p>
                            <p className="text-xs text-neutral-500">Total Questions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {questions.filter(q => q.isVerified).length}
                            </p>
                            <p className="text-xs text-neutral-500">Verified</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {questions.filter(q => !q.isVerified).length}
                            </p>
                            <p className="text-xs text-neutral-500">Pending Review</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{subjects.length}</p>
                            <p className="text-xs text-neutral-500">Subjects</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Subject Filter */}
                <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                </select>

                {/* Difficulty Filter */}
                <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>

                {/* Verified Filter */}
                <select
                    value={verifiedFilter}
                    onChange={(e) => setVerifiedFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Status</option>
                    <option value="true">Verified</option>
                    <option value="false">Pending</option>
                </select>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No questions found
                    </div>
                ) : (
                    questions.map((question, index) => (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                {/* Question Number */}
                                <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-400 shrink-0">
                                    {((pagination.page - 1) * pagination.limit) + index + 1}
                                </div>

                                {/* Question Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-neutral-900 dark:text-white line-clamp-2">
                                        {question.question}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                                            {question.subject.name}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md">
                                            {question.topic.name}
                                        </span>
                                        <DifficultyBadge difficulty={question.difficulty} />
                                        {question.isVerified ? (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="w-3 h-3" /> Pending
                                            </span>
                                        )}
                                        {question.isAIGenerated && (
                                            <span className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                                                AI Generated
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                        <span>{question.attemptCount.toLocaleString()} attempts</span>
                                        <span>
                                            {question.attemptCount > 0 
                                                ? `${((question.correctCount / question.attemptCount) * 100).toFixed(0)}% accuracy`
                                                : "No data"
                                            }
                                        </span>
                                        {question.source && <span>Source: {question.source}</span>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => openQuestionDetails(question)}
                                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                    </button>
                                    <button
                                        onClick={() => toggleVerification(question.id, question.isVerified)}
                                        disabled={actionLoading}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            question.isVerified 
                                                ? "hover:bg-amber-50 dark:hover:bg-amber-500/10" 
                                                : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                        )}
                                        title={question.isVerified ? "Mark as Pending" : "Mark as Verified"}
                                    >
                                        {question.isVerified ? (
                                            <XIcon className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && questions.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total.toLocaleString()} questions
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
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

            {/* Question Details Sheet */}
            <Sheet open={sheetOpen} onClose={closeSheet} title="Question Details">
                {selectedQuestion && (
                    <div className="p-6 space-y-6">
                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                                {selectedQuestion.subject.name}
                            </span>
                            <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md">
                                {selectedQuestion.topic.name}
                            </span>
                            <DifficultyBadge difficulty={selectedQuestion.difficulty} />
                            {selectedQuestion.isVerified && (
                                <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                                    <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>

                        {/* Question */}
                        <div>
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Question (English)</h4>
                            <p className="text-neutral-900 dark:text-white">{selectedQuestion.question}</p>
                        </div>

                        {selectedQuestion.questionNp && (
                            <div>
                                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Question (नेपाली)</h4>
                                <p className="text-neutral-900 dark:text-white">{selectedQuestion.questionNp}</p>
                            </div>
                        )}

                        {/* Options */}
                        <div>
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Options</h4>
                            <div className="space-y-2">
                                {Object.entries(selectedQuestion.options).map(([key, value]) => (
                                    <OptionItem 
                                        key={key} 
                                        label={key} 
                                        text={value} 
                                        isCorrect={key === selectedQuestion.correctAnswer} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Explanation */}
                        {selectedQuestion.explanation && (
                            <div>
                                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Explanation</h4>
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 text-sm text-neutral-700 dark:text-neutral-300">
                                    {selectedQuestion.explanation}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div>
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Statistics</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                        {selectedQuestion.attemptCount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-500">Attempts</p>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-emerald-600">
                                        {selectedQuestion.correctCount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-500">Correct</p>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-blue-600">
                                        {selectedQuestion.attemptCount > 0 
                                            ? `${((selectedQuestion.correctCount / selectedQuestion.attemptCount) * 100).toFixed(1)}%`
                                            : "0%"
                                        }
                                    </p>
                                    <p className="text-xs text-neutral-500">Accuracy</p>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {selectedQuestion.tags.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedQuestion.tags.map(tag => (
                                        <span 
                                            key={tag} 
                                            className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="text-xs text-neutral-500 space-y-1">
                            {selectedQuestion.source && <p>Source: {selectedQuestion.source}</p>}
                            <p>Created: {format(new Date(selectedQuestion.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
                            {selectedQuestion.isAIGenerated && <p className="text-purple-600">AI Generated</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <button
                                onClick={() => toggleVerification(selectedQuestion.id, selectedQuestion.isVerified)}
                                disabled={actionLoading}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50",
                                    selectedQuestion.isVerified
                                        ? "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                        : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                )}
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : selectedQuestion.isVerified ? (
                                    <>
                                        <XIcon className="w-4 h-4" />
                                        Mark as Pending
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Verify Question
                                    </>
                                )}
                            </button>
                            <button className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                <Pencil className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            </button>
                        </div>
                    </div>
                )}
            </Sheet>
        </div>
    )
}
