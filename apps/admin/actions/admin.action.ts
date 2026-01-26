"use server"

import { prisma } from "@repo/prisma"
import { getServerSession, authOptions } from "@repo/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

// Types
interface CreateInvitationInput {
    email: string
    name?: string
    adminRole: "SUPER_ADMIN" | "CONTENT_ADMIN" | "FINANCE_ADMIN" | "COMMUNITY_ADMIN" | "MODULE_MANAGER" | "VIEWER"
    permissions?: Record<string, string[]>
}

interface AdminResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

// Generate a unique access code
function generateAccessCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed ambiguous chars
    let code = "ADMIN-"
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// Check if current user is admin
export async function checkAdminAccess(): Promise<AdminResponse<{ isAdmin: boolean; adminAccess: any }>> {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const adminAccess = await prisma.adminAccess.findUnique({
            where: { userId: session.user.id }
        })

        if (!adminAccess || adminAccess.status !== "ACTIVE") {
            return { success: false, error: "Not authorized" }
        }

        return { 
            success: true, 
            data: { 
                isAdmin: true, 
                adminAccess 
            } 
        }
    } catch (error) {
        console.error("Admin access check error:", error)
        return { success: false, error: "Failed to check admin access" }
    }
}

// Get current admin info
export async function getCurrentAdmin(): Promise<AdminResponse<any>> {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const adminAccess = await prisma.adminAccess.findUnique({
            where: {
                userId: session.user.id 
            },
            select: {
                permissions: true
            }
        })

        if (!adminAccess) {
            return { success: false, error: "Not an admin" }
        }

        const user = await prisma.user.findUnique({
            where: { 
                id: session.user.id 
            },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                image: true 
            }
        })

        return { 
            success: true, 
            data: { 
                ...adminAccess, 
                user: user 
            } 
        }
    } catch (error) {
        console.error("Get current admin error:", error)
        return { success: false, error: "Failed to get admin info" }
    }
}

// Get all admin users
export async function getAdminUsers(): Promise<AdminResponse<any[]>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const admins = await prisma.adminAccess.findMany({
            include: {
                invitations: {
                    take: 5,
                    orderBy: { createdAt: "desc" }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Get user details for each admin
        const adminWithUsers = await Promise.all(
            admins.map(async (admin) => {
                const user = await prisma.user.findUnique({
                    where: { id: admin.userId },
                    select: { id: true, name: true, email: true, image: true }
                })
                return { ...admin, user }
            })
        )

        return { success: true, data: adminWithUsers }
    } catch (error) {
        console.error("Get admin users error:", error)
        return { success: false, error: "Failed to fetch admin users" }
    }
}

// Create admin invitation
export async function createAdminInvitation(input: CreateInvitationInput): Promise<AdminResponse<any>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccess = accessCheck.data?.adminAccess
        
        // Only SUPER_ADMIN can create invitations
        if (adminAccess.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can create invitations" }
        }

        // Check if email already has admin access
        const existingUser = await prisma.user.findUnique({
            where: { email: input.email }
        })

        if (existingUser) {
            const existingAdmin = await prisma.adminAccess.findUnique({
                where: { userId: existingUser.id }
            })
            if (existingAdmin) {
                return { success: false, error: "User already has admin access" }
            }
        }

        // Check for existing pending invitation
        const existingInvite = await prisma.adminInvitation.findFirst({
            where: {
                email: input.email,
                status: "PENDING"
            }
        })

        if (existingInvite) {
            return { success: false, error: "Pending invitation already exists for this email" }
        }

        // Create invitation
        const invitation = await prisma.adminInvitation.create({
            data: {
                email: input.email,
                name: input.name,
                code: generateAccessCode(),
                adminRole: input.adminRole,
                permissions: input.permissions || {},
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                createdById: adminAccess.id
            }
        })

        // Log the action
        await prisma.adminAuditLog.create({
            data: {
                adminId: adminAccess.id,
                action: "CREATE",
                module: "admin_management",
                resourceType: "AdminInvitation",
                resourceId: invitation.id,
                description: `Created invitation for ${input.email} with role ${input.adminRole}`
            }
        })

        revalidatePath("/admins")
        revalidatePath("/admins/invitations")

        return { success: true, data: invitation }
    } catch (error) {
        console.error("Create invitation error:", error)
        return { success: false, error: "Failed to create invitation" }
    }
}

// Verify access code and create admin
export async function verifyAccessCode(email: string, accessCode: string): Promise<AdminResponse<any>> {
    try {
        // Find the invitation
        const invitation = await prisma.adminInvitation.findFirst({
            where: {
                email: email.toLowerCase(),
                code: accessCode.toUpperCase(),
                status: "PENDING"
            }
        })

        if (!invitation) {
            return { success: false, error: "Invalid access code" }
        }

        // Check if expired
        if (new Date() > invitation.expiresAt) {
            await prisma.adminInvitation.update({
                where: { id: invitation.id },
                data: { status: "EXPIRED" }
            })
            return { success: false, error: "Access code has expired" }
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!user) {
            // Create user with temporary password (access code)
            const tempPassword = await bcrypt.hash(accessCode, 10)
            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    name: invitation.name || email.split("@")[0],
                    hashedPassword: tempPassword,
                    role: "ADMIN"
                }
            })
        }

        // Check if admin access already exists
        let adminAccessRecord = await prisma.adminAccess.findUnique({
            where: { userId: user.id }
        })

        if (!adminAccessRecord) {
            // Create admin access
            adminAccessRecord = await prisma.adminAccess.create({
                data: {
                    userId: user.id,
                    adminRole: invitation.adminRole,
                    permissions: invitation.permissions || {},
                    status: "ACTIVE",
                    inviteCode: accessCode
                }
            })
        }

        // Update invitation status
        await prisma.adminInvitation.update({
            where: { id: invitation.id },
            data: {
                status: "USED",
                usedBy: user.id,
                usedAt: new Date()
            }
        })

        // Create audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: adminAccessRecord.id,
                action: "LOGIN",
                module: "admin_management",
                resourceType: "AdminAccess",
                resourceId: adminAccessRecord.id,
                description: `New admin ${email} activated via access code`
            }
        })

        return { 
            success: true, 
            data: { 
                user, 
                adminAccess: adminAccessRecord,
                needsPasswordSetup: true 
            } 
        }
    } catch (error) {
        console.error("Verify access code error:", error)
        return { success: false, error: "Failed to verify access code" }
    }
}

// Get pending invitations
export async function getPendingInvitations(): Promise<AdminResponse<any[]>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const invitations = await prisma.adminInvitation.findMany({
            where: {
                status: "PENDING"
            },
            orderBy: { createdAt: "desc" }
        })

        return { success: true, data: invitations }
    } catch (error) {
        console.error("Get invitations error:", error)
        return { success: false, error: "Failed to fetch invitations" }
    }
}

// Revoke invitation
export async function revokeInvitation(invitationId: string): Promise<AdminResponse> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccess = accessCheck.data?.adminAccess
        
        if (adminAccess.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can revoke invitations" }
        }

        await prisma.adminInvitation.update({
            where: { id: invitationId },
            data: { status: "REVOKED" }
        })

        await prisma.adminAuditLog.create({
            data: {
                adminId: adminAccess.id,
                action: "DELETE",
                module: "admin_management",
                resourceType: "AdminInvitation",
                resourceId: invitationId,
                description: "Revoked admin invitation"
            }
        })

        revalidatePath("/admins/invitations")

        return { success: true }
    } catch (error) {
        console.error("Revoke invitation error:", error)
        return { success: false, error: "Failed to revoke invitation" }
    }
}

// Update admin status
export async function updateAdminStatus(adminId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED"): Promise<AdminResponse> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccess = accessCheck.data?.adminAccess
        
        if (adminAccess.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can update admin status" }
        }

        await prisma.adminAccess.update({
            where: { id: adminId },
            data: { status }
        })

        await prisma.adminAuditLog.create({
            data: {
                adminId: adminAccess.id,
                action: "UPDATE",
                module: "admin_management",
                resourceType: "AdminAccess",
                resourceId: adminId,
                description: `Updated admin status to ${status}`
            }
        })

        revalidatePath("/admins")

        return { success: true }
    } catch (error) {
        console.error("Update admin status error:", error)
        return { success: false, error: "Failed to update admin status" }
    }
}

// Update admin permissions
export async function updateAdminPermissions(adminId: string, permissions: Record<string, string[]>): Promise<AdminResponse> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccess = accessCheck.data?.adminAccess
        
        if (adminAccess.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can update permissions" }
        }

        const previousAdmin = await prisma.adminAccess.findUnique({
            where: { id: adminId }
        })

        await prisma.adminAccess.update({
            where: { id: adminId },
            data: { permissions }
        })

        await prisma.adminAuditLog.create({
            data: {
                adminId: adminAccess.id,
                action: "UPDATE",
                module: "admin_management",
                resourceType: "AdminAccess",
                resourceId: adminId,
                description: `Updated admin permissions`,
                changes: {
                    before: previousAdmin?.permissions,
                    after: permissions
                }
            }
        })

        revalidatePath("/admins")

        return { success: true }
    } catch (error) {
        console.error("Update admin permissions error:", error)
        return { success: false, error: "Failed to update permissions" }
    }
}

// Get dashboard stats
export async function getDashboardStats(): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const today = new Date(now.setHours(0, 0, 0, 0))

        const [
            // Admin stats
            totalAdmins,
            activeAdmins,
            
            // Mobile App User Stats (PrepUser)
            totalUsers,
            newUsersThisMonth,
            newUsersThisWeek,
            activeUsersToday,
            
            // Content Stats
            totalQuestions,
            verifiedQuestions,
            totalSubjects,
            totalTopics,
            totalExamTypes,
            
            // Engagement Stats
            totalQuestionAttempts,
            attemptsThisWeek,
            todayAttempts,
            
            // Mock Test Stats
            totalMockTests,
            mockTestResultsCount
        ] = await Promise.all([
            // Admin stats
            prisma.adminAccess.count({ where: { status: "ACTIVE" } }),
            prisma.adminAccess.count({ where: { status: "ACTIVE", lastLoginAt: { gte: sevenDaysAgo } } }),
            
            // Mobile App User Stats
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
            
            // Content Stats
            prisma.question.count(),
            prisma.question.count({ where: { isVerified: true } }),
            prisma.subject.count(),
            prisma.topic.count(),
            prisma.examType.count(),
            
            // Engagement Stats
            prisma.questionAttempt.count(),
            prisma.questionAttempt.count({ where: { attemptedAt: { gte: sevenDaysAgo } } }),
            prisma.questionAttempt.count({ where: { attemptedAt: { gte: today } } }),
            
            // Mock Test Stats
            prisma.mockTest.count({ where: { isActive: true } }),
            prisma.mockTestResult.count()
        ])

        // Calculate growth rates
        const userGrowthRate = totalUsers > 0 
            ? Math.round((newUsersThisMonth / totalUsers) * 100) 
            : 0
        
        const weeklyGrowthRate = totalUsers > 0 
            ? Math.round((newUsersThisWeek / totalUsers) * 100) 
            : 0

        // Get correct answer stats
        const correctAttempts = await prisma.questionAttempt.count({
            where: { isCorrect: true }
        })
        const overallAccuracy = totalQuestionAttempts > 0 
            ? Math.round((correctAttempts / totalQuestionAttempts) * 100) 
            : 0

        return {
            success: true,
            data: {
                // User metrics
                totalUsers: totalUsers,
                newUsersThisMonth: newUsersThisMonth,
                newUsersThisWeek: newUsersThisWeek,
                activeToday: activeUsersToday,
                userGrowthRate,
                weeklyGrowthRate,
                
                // Admin metrics
                totalAdmins,
                activeAdmins,
                
                // Content metrics
                totalQuestions,
                verifiedQuestions,
                totalSubjects,
                totalTopics,
                totalExamTypes,
                
                // Engagement metrics
                totalQuestionAttempts,
                attemptsThisWeek,
                attemptsToday: todayAttempts,
                overallAccuracy,
                
                // Mock test metrics
                totalMockTests,
                mockTestsTaken: mockTestResultsCount
            }
        }
    } catch (error) {
        console.error("Get dashboard stats error:", error)
        return { success: false, error: "Failed to fetch dashboard stats" }
    }
}

// Get user progress analytics for admin dashboard
export async function getUserProgressAnalytics(options?: {
    limit?: number
    sortBy?: 'accuracy' | 'attempts' | 'lastActive' | 'streak'
    sortOrder?: 'asc' | 'desc'
}): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const limit = options?.limit || 20
        const sortBy = options?.sortBy || 'lastActive'
        const sortOrder = options?.sortOrder || 'desc'

        // Get top users with their progress
        const usersWithProgress = await prisma.user.findMany({
            take: limit,
            orderBy: sortBy === 'lastActive' 
                ? { lastActiveAt: sortOrder }
                : sortBy === 'streak'
                    ? { progress: { currentStreak: sortOrder } }
                    : undefined,
            include: {
                progress: true,
                _count: {
                    select: {
                        questionAttempts: true,
                        mockTestResults: true,
                        dailyProgress: true
                    }
                }
            }
        })

        // Calculate per-user stats
        const userStats = usersWithProgress.map(user => ({
            id: user.id,
            name: user.name || 'Anonymous',
            phone: user.phone,
            username: user.username,
            status: user.status,
            
            // Progress
            totalAttempted: user.progress?.totalQuestionsAttempted || 0,
            totalCorrect: user.progress?.totalCorrect || 0,
            accuracy: user.progress?.totalQuestionsAttempted 
                ? Math.round((user.progress.totalCorrect / user.progress.totalQuestionsAttempted) * 100)
                : 0,
            
            // Streaks
            currentStreak: user.progress?.currentStreak || 0,
            longestStreak: user.progress?.longestStreak || 0,
            
            // Counts
            questionAttempts: user._count.questionAttempts,
            mockTestsTaken: user._count.mockTestResults,
            daysActive: user._count.dailyProgress,
            
            // Activity
            lastActiveAt: user.lastActiveAt,
            createdAt: user.createdAt
        }))

        // Sort by accuracy or attempts if needed
        if (sortBy === 'accuracy') {
            userStats.sort((a, b) => sortOrder === 'desc' 
                ? b.accuracy - a.accuracy 
                : a.accuracy - b.accuracy)
        } else if (sortBy === 'attempts') {
            userStats.sort((a, b) => sortOrder === 'desc' 
                ? b.totalAttempted - a.totalAttempted 
                : a.totalAttempted - b.totalAttempted)
        }

        return {
            success: true,
            data: userStats
        }
    } catch (error) {
        console.error("Get user progress analytics error:", error)
        return { success: false, error: "Failed to fetch user progress analytics" }
    }
}

// Get subject-wise performance analytics
export async function getSubjectAnalytics(): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        // Get all subjects with their question counts
        const subjects = await prisma.subject.findMany({
            include: {
                examLevel: {
                    select: { name: true }
                },
                _count: {
                    select: {
                        questions: true,
                        topics: true
                    }
                }
            }
        })

        // Get attempt stats per subject
        const subjectStats = await Promise.all(
            subjects.map(async (subject) => {
                const attempts = await prisma.questionAttempt.count({
                    where: {
                        question: { subjectId: subject.id }
                    }
                })
                
                const correctAttempts = await prisma.questionAttempt.count({
                    where: {
                        question: { subjectId: subject.id },
                        isCorrect: true
                    }
                })

                return {
                    id: subject.id,
                    name: subject.name,
                    nameNp: subject.nameNp,
                    examLevel: subject.examLevel.name,
                    totalQuestions: subject._count.questions,
                    totalTopics: subject._count.topics,
                    totalAttempts: attempts,
                    correctAttempts,
                    accuracy: attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0,
                    isActive: subject.isActive
                }
            })
        )

        return {
            success: true,
            data: subjectStats
        }
    } catch (error) {
        console.error("Get subject analytics error:", error)
        return { success: false, error: "Failed to fetch subject analytics" }
    }
}

// Get daily activity trends for charts
export async function getDailyActivityTrends(days: number = 30): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        // Get daily progress records
        const dailyProgress = await prisma.dailyProgress.findMany({
            where: {
                date: { gte: startDate }
            },
            orderBy: { date: 'asc' }
        })

        // Group by date
        const trendsByDate: Record<string, {
            date: string
            totalAttempts: number
            totalCorrect: number
            usersActive: number
            goalsCompleted: number
        }> = {}

        dailyProgress.forEach(dp => {
            const dateKey = dp.date.toISOString().split('T')[0]
            if (dateKey) {
                if (!trendsByDate[dateKey]) {
                    trendsByDate[dateKey] = {
                        date: dateKey,
                        totalAttempts: 0,
                        totalCorrect: 0,
                        usersActive: 0,
                        goalsCompleted: 0
                    }
                }
                trendsByDate[dateKey].totalAttempts += dp.questionsCompleted
                trendsByDate[dateKey].totalCorrect += dp.questionsCorrect
                trendsByDate[dateKey].usersActive += 1
                if (dp.goalMet) trendsByDate[dateKey].goalsCompleted += 1
            }
        })

        // Get new users by date
        const newUsersByDate = await prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate }
            },
            _count: true
        })

        return {
            success: true,
            data: {
                activityTrends: Object.values(trendsByDate),
                newUsersTrend: newUsersByDate.map(item => ({
                    date: item.createdAt.toISOString().split('T')[0],
                    count: item._count
                }))
            }
        }
    } catch (error) {
        console.error("Get daily activity trends error:", error)
        return { success: false, error: "Failed to fetch daily activity trends" }
    }
}

// Get audit logs
export async function getAuditLogs(page: number = 1, limit: number = 20): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const [logs, total] = await Promise.all([
            prisma.adminAuditLog.findMany({
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { createdAt: "desc" },
                include: {
                    admin: {
                        select: { userId: true }
                    }
                }
            }),
            prisma.adminAuditLog.count()
        ])

        // Get user details for each log
        const logsWithUser = await Promise.all(
            logs.map(async (log) => {
                const user = await prisma.user.findUnique({
                    where: { id: log.admin.userId },
                    select: { name: true, email: true, image: true }
                })
                return { ...log, adminUser: user }
            })
        )

        return {
            success: true,
            data: {
                logs: logsWithUser,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        }
    } catch (error) {
        console.error("Get audit logs error:", error)
        return { success: false, error: "Failed to fetch audit logs" }
    }
}

// Set admin password (after initial access code login)
export async function setAdminPassword(newPassword: string): Promise<AdminResponse> {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12)

        await prisma.adminAccess.update({
            where: { userId: session.user.id },
            data: { 
                hashedPassword,
                accessCode: null,
                accessCodeExpiry: null
            }
        })

        // Also update user password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { hashedPassword }
        })

        return { success: true }
    } catch (error) {
        console.error("Set admin password error:", error)
        return { success: false, error: "Failed to set password" }
    }
}

// Change password with current password verification
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<AdminResponse> {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, hashedPassword: true }
        })
        if (!user || !user.hashedPassword) {
            return { success: false, error: "User not found" }
        }

        const valid = await bcrypt.compare(currentPassword, user.hashedPassword)
        if (!valid) {
            return { success: false, error: "Current password is incorrect" }
        }

        const hashedNew = await bcrypt.hash(newPassword, 12)
        await prisma.user.update({ where: { id: user.id }, data: { hashedPassword: hashedNew } })

        const adminAccess = await prisma.adminAccess.findUnique({ where: { userId: user.id } })
        if (adminAccess) {
            await prisma.adminAuditLog.create({
                data: {
                    adminId: adminAccess.id,
                    action: "UPDATE",
                    module: "admin_management",
                    resourceType: "User",
                    resourceId: user.id,
                    description: "Changed password"
                }
            })
        }

        return { success: true }
    } catch (error) {
        console.error("Change password error:", error)
        return { success: false, error: "Failed to change password" }
    }
}

// ============================================================================
// PREPSATHI USER MANAGEMENT
// ============================================================================

interface GetUsersInput {
    page?: number
    limit?: number
    search?: string
    status?: string
}

export async function getUsers(input: GetUsersInput = {}): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const { page = 1, limit = 20, search, status } = input

        const where: any = {}
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } }
            ]
        }
        
        if (status) {
            where.status = status
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: {
                        select: { questionAttempts: true }
                    },
                    progress: {
                        select: {
                            totalQuestionsAttempted: true,
                            totalCorrect: true,
                            currentStreak: true,
                            longestStreak: true
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ])

        return {
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        }
    } catch (error) {
        console.error("Get users error:", error)
        return { success: false, error: "Failed to fetch users" }
    }
}

export async function getUserDetails(userId: string): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                currentExamType: { select: { name: true } },
                currentExamLevel: { select: { name: true } },
                progress: true,
                dailyProgress: {
                    orderBy: { date: "desc" },
                    take: 30
                }
            }
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        return { success: true, data: user }
    } catch (error) {
        console.error("Get user details error:", error)
        return { success: false, error: "Failed to fetch user details" }
    }
}

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

interface GetQuestionsInput {
    page?: number
    limit?: number
    search?: string
    subjectId?: string
    difficulty?: string
    verified?: boolean
}

export async function getQuestions(input: GetQuestionsInput = {}): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const { page = 1, limit = 20, search, subjectId, difficulty, verified } = input

        const where: any = {}
        
        if (search) {
            where.OR = [
                { question: { contains: search, mode: "insensitive" } },
                { questionNp: { contains: search, mode: "insensitive" } }
            ]
        }
        
        if (subjectId) where.subjectId = subjectId
        if (difficulty) where.difficulty = difficulty
        if (verified !== undefined) where.isVerified = verified

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    subject: { select: { id: true, name: true } },
                    topic: { select: { id: true, name: true } }
                }
            }),
            prisma.question.count({ where })
        ])

        return {
            success: true,
            data: {
                questions,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        }
    } catch (error) {
        console.error("Get questions error:", error)
        return { success: false, error: "Failed to fetch questions" }
    }
}

export async function getSubjects(): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const subjects = await prisma.subject.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            include: {
                topics: {
                    where: { isActive: true },
                    orderBy: { order: "asc" },
                    select: { id: true, name: true }
                }
            }
        })

        return { success: true, data: subjects }
    } catch (error) {
        console.error("Get subjects error:", error)
        return { success: false, error: "Failed to fetch subjects" }
    }
}

export async function updateQuestion(questionId: string, data: Partial<{
    isVerified: boolean
    isActive: boolean
    difficulty: "EASY" | "MEDIUM" | "HARD"
}>): Promise<AdminResponse<any>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const updateData: Record<string, unknown> = {}
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.isVerified !== undefined) updateData.isVerified = data.isVerified
        if (data.difficulty) updateData.difficulty = data.difficulty
        
        if (data.isVerified) {
            updateData.verifiedBy = accessCheck.data?.adminAccess.id
            updateData.verifiedAt = new Date()
        }

        const question = await prisma.question.update({
            where: { id: questionId },
            data: updateData
        })

        return { success: true, data: question }
    } catch (error) {
        console.error("Update question error:", error)
        return { success: false, error: "Failed to update question" }
    }
}

// ============================================================================
// ANALYTICS
// ============================================================================

interface GetAnalyticsInput {
    range?: "7d" | "30d" | "90d" | "all"
}

export async function getAnalytics(input: GetAnalyticsInput = {}): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const { range = "30d" } = input
        
        // Calculate date range
        const now = new Date()
        let startDate: Date | undefined
        
        if (range === "7d") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        else if (range === "30d") startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        else if (range === "90d") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

        // Overview stats
        const [totalUsers, activeUsers, totalQuestions, totalAttempts, avgStats] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: startDate ? { lastActiveAt: { gte: startDate } } : undefined
            }),
            prisma.question.count({ where: { isActive: true } }),
            prisma.questionAttempt.count({
                where: startDate ? { attemptedAt: { gte: startDate } } : undefined
            }),
            prisma.questionAttempt.aggregate({
                where: startDate ? { attemptedAt: { gte: startDate } } : undefined,
                _avg: { timeTakenSeconds: true },
                _count: { isCorrect: true }
            })
        ])

        // Calculate average accuracy
        const correctAttempts = await prisma.questionAttempt.count({
            where: {
                isCorrect: true,
                ...(startDate && { attemptedAt: { gte: startDate } })
            }
        })
        const avgAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0

        // Subject stats
        const subjects = await prisma.subject.findMany({
            where: { isActive: true },
            include: {
                _count: { select: { questions: true } },
                questions: {
                    select: { attemptCount: true, correctCount: true }
                }
            }
        })

        const subjectStats = subjects.map(subject => {
            const totalAttempts = subject.questions.reduce((sum, q) => sum + q.attemptCount, 0)
            const totalCorrect = subject.questions.reduce((sum, q) => sum + q.correctCount, 0)
            return {
                subject: subject.name,
                questions: subject._count.questions,
                attempts: totalAttempts,
                accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
            }
        })

        // Topic performance (sorted by accuracy, lowest first)
        const topics = await prisma.topic.findMany({
            where: { isActive: true },
            include: {
                subject: { select: { name: true } },
                questions: {
                    select: { attemptCount: true, correctCount: true, avgTimeSeconds: true }
                }
            }
        })

        const topicPerformance = topics
            .map(topic => {
                const totalAttempts = topic.questions.reduce((sum, q) => sum + q.attemptCount, 0)
                const totalCorrect = topic.questions.reduce((sum, q) => sum + q.correctCount, 0)
                const avgTimes = topic.questions.filter(q => q.avgTimeSeconds).map(q => q.avgTimeSeconds!)
                const avgTime = avgTimes.length > 0 ? Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length) : 0
                return {
                    topic: topic.name,
                    subject: topic.subject.name,
                    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
                    avgTime
                }
            })
            .filter(t => t.accuracy > 0)
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 10)

        return {
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalQuestions,
                    totalAttempts,
                    avgAccuracy: Math.round(avgAccuracy * 10) / 10,
                    avgSessionMinutes: Math.round((avgStats._avg.timeTakenSeconds || 0) / 60)
                },
                userGrowth: [], // Would need raw SQL or date grouping
                subjectStats,
                topicPerformance,
                dailyActivity: [] // Would need raw SQL or date grouping
            }
        }
    } catch (error) {
        console.error("Get analytics error:", error)
        return { success: false, error: "Failed to fetch analytics" }
    }
}