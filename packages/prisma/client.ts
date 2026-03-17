// Re-export everything from Prisma Client
export * from "@prisma/client";

// Explicitly re-export the Role enum and other types
export { 
    Role, 
    Prisma,

    UseCase,
    RecordingStatus,
    TaskPriority,
    MessageRole
} from "@prisma/client";

export type { 
    User 
} from "@prisma/client";