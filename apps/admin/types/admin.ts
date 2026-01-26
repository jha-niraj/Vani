// ============================================
// SHARED ADMIN TYPES AND INTERFACES
// ============================================

// Permission types
export type PermissionLevel = "read" | "write" | "delete" | "full"

// Platform permission modules
export interface MainPlatformPermissions {
    users?: PermissionLevel[]
    credits?: PermissionLevel[]
    projects?: PermissionLevel[]
    mocks?: PermissionLevel[]
    assessments?: PermissionLevel[]
    challenges?: PermissionLevel[]
    communities?: PermissionLevel[]
    feedback?: PermissionLevel[]
    analytics?: PermissionLevel[]
}

export interface HiringPlatformPermissions {
    companies?: PermissionLevel[]
    members?: PermissionLevel[]
    jobs?: PermissionLevel[]
    candidates?: PermissionLevel[]
    applications?: PermissionLevel[]
    invitations?: PermissionLevel[]
    analytics?: PermissionLevel[]
}

export interface UniversityPlatformPermissions {
    universities?: PermissionLevel[]
    departments?: PermissionLevel[]
    faculty?: PermissionLevel[]
    students?: PermissionLevel[]
    classes?: PermissionLevel[]
    assignments?: PermissionLevel[]
    placements?: PermissionLevel[]
    credits?: PermissionLevel[]
    analytics?: PermissionLevel[]
}

export interface AdminPermissions {
    // Global permissions
    admin_management?: PermissionLevel[]
    system?: PermissionLevel[]

    // Platform-specific permissions
    main?: MainPlatformPermissions
    hiring?: HiringPlatformPermissions
    uni?: UniversityPlatformPermissions
}
// Admin User
export interface AdminUser {
    id: string
    name: string | null
    email: string
    role: string
    status: string
    permissions?: Record<string, unknown>
    lastLoginAt: Date | null
    createdAt: Date
}

// Generic User
export interface User {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    credits: number
    currentXp: number
    createdAt: Date
}

// ============================================
// MAIN PLATFORM TYPES
// ============================================

export interface MainPlatformStats {
    totalUsers: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
    activeUsers: number
    totalProjects: number
    totalCommunities: number
    totalCredits: number
    totalMockInterviews: number
    totalAssessments: number
}

export interface Feedback {
    id: string
    name: string
    category: string
    status: string
    isVerified: boolean
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
}

export interface CreditTransaction {
    id: string
    amount: number
    type: string
    description: string
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
    }
}

export interface CreditRequest {
    id: string
    requestedCredits: number
    status: string
    linkedinPostUrl: string
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
}

export interface CreditTransfer {
    id: string
    amount: number
    createdAt: Date
    sender: {
        id: string
        name: string | null
        email: string
    }
    receiver: {
        id: string
        name: string | null
        email: string
    }
}

export interface Payment {
    id: string
    amount: number
    currency: string
    status: string
    credits: number
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
    }
}

// ============================================
// HIRING PLATFORM TYPES
// ============================================

export interface HiringPlatformStats {
    totalCompanies: number
    verifiedCompanies: number
    pendingVerifications: number
    totalMembers: number
    totalJobs: number
    activeJobs: number
    totalApplications: number
    totalCandidates: number
}

export interface Company {
    id: string
    name: string
    website: string | null
    logo: string | null
    industry: string | null
    size: string | null
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
    createdAt: Date
    membersCount: number
    jobsCount: number
}

export interface CompanyMember {
    id: string
    role: "HEAD" | "RECRUITER"
    jobTitle: string | null
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
    company: {
        id: string
        name: string
    }
}

export interface Job {
    id: string
    title: string
    department: string | null
    location: string | null
    type: string | null
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED"
    applicationsCount: number
    createdAt: Date
    company: {
        id: string
        name: string
        logo: string | null
    }
}

export interface JobApplication {
    id: string
    status: string
    createdAt: Date
    candidate: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
    job: {
        id: string
        title: string
        company: {
            id: string
            name: string
        }
    }
}

// ============================================
// UNIVERSITY PLATFORM TYPES
// ============================================

export interface UniversityPlatformStats {
    totalUniversities: number
    verifiedUniversities: number
    pendingVerifications: number
    totalDepartments: number
    totalFaculty: number
    totalStudents: number
    verifiedStudents: number
    totalClasses: number
    totalAssignments: number
    totalCreditsUsed: number
}

export interface University {
    id: string
    name: string
    website: string | null
    logo: string | null
    emailDomain: string
    universityType: string | null
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED"
    city: string | null
    state: string | null
    country: string | null
    createdAt: Date
    departmentsCount: number
    studentsCount: number
    facultyCount: number
}

export interface Department {
    id: string
    name: string
    code: string | null
    createdAt: Date
    university: {
        id: string
        name: string
    }
    facultyCount: number
    classesCount: number
}

export interface UniversityMember {
    id: string
    role: "HEAD" | "DEPARTMENT_HEAD" | "FACULTY" | "TEACHING_ASSISTANT" | "PLACEMENT_OFFICER"
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
    university: {
        id: string
        name: string
    }
    department: {
        id: string
        name: string
    } | null
}

export interface StudentLink {
    id: string
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
    enrollmentNumber: string | null
    batch: string | null
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
    university: {
        id: string
        name: string
    }
    department: {
        id: string
        name: string
    } | null
}

export interface UniversityClass {
    id: string
    name: string
    code: string | null
    semester: string | null
    isActive: boolean
    createdAt: Date
    university: {
        id: string
        name: string
    }
    department: {
        id: string
        name: string
    } | null
    instructorName: string | null
    enrollmentsCount: number
}

export interface UniversityAssignment {
    id: string
    title: string
    type: "QUIZ" | "CODING" | "MOCK_INTERVIEW" | "PROJECT" | "SPACE_TOPIC"
    status: "DRAFT" | "ACTIVE" | "CLOSED"
    dueDate: Date | null
    createdAt: Date
    university: {
        id: string
        name: string
    }
    class: {
        id: string
        name: string
    } | null
    submissionsCount: number
}

// ============================================
// GLOBAL & SYSTEM TYPES
// ============================================

export interface GlobalDashboardStats {
    main: MainPlatformStats
    hiring: HiringPlatformStats
    uni: UniversityPlatformStats
    systemHealth: SystemHealth
}

export interface DatabaseStats {
    users: number
    projects: number
    communities: number
    mockInterviews: number
    feedback: number
    creditTransactions: number
    assessmentQuestions: number
    forgeTracks: number
    crucibleEvents: number
    companies: number
    universities: number
}

export interface SystemHealth {
    databaseStatus: "healthy" | "degraded" | "down"
    recentErrors: number
    recentActivitiesLast24h: number
    timestamp: Date
}

export interface StatsData {
    totalUsers?: number
    newUsersToday?: number
    activeUsers?: number
    totalProjects?: number
    totalCommunities?: number
    totalCredits?: number
    totalRevenue?: number
    [key: string]: number | undefined
}

export interface ChartData {
    name: string
    value: number
}

// ============================================
// VERIFICATION TYPES
// ============================================

export interface VerificationRequest {
    id: string
    type: "company" | "university" | "student"
    entityId: string
    entityName: string
    status: "PENDING" | "VERIFIED" | "REJECTED"
    submittedAt: Date
    reviewedAt: Date | null
    reviewedBy: string | null
    notes: string | null
}

export interface PendingVerification {
    id: string
    type: "company" | "university" | "student"
    name: string
    email: string
    submittedAt: Date
    details: Record<string, unknown>
}