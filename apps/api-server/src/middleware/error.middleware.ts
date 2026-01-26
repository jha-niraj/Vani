import type { Request, Response, NextFunction } from "express";

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public code?: string;

    constructor(message: string, statusCode: number, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common errors
export class BadRequestError extends AppError {
    constructor(message: string = "Bad Request", code?: string) {
        super(message, 400, code);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized", code?: string) {
        super(message, 401, code);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden", code?: string) {
        super(message, 403, code);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Not Found", code?: string) {
        super(message, 404, code);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Conflict", code?: string) {
        super(message, 409, code);
    }
}

export class ValidationError extends AppError {
    public errors: Record<string, string[]>;

    constructor(message: string = "Validation Error", errors: Record<string, string[]> = {}) {
        super(message, 422, "VALIDATION_ERROR");
        this.errors = errors;
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string = "Too Many Requests", code?: string) {
        super(message, 429, code);
    }
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        errors?: Record<string, string[]>;
        stack?: string;
    };
}

export function errorHandler(
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Default to 500 server error
    let statusCode = 500;
    let message = "Internal Server Error";
    let code: string | undefined;
    let errors: Record<string, string[]> | undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        if (err instanceof ValidationError) {
            errors = err.errors;
        }
    } else if (err instanceof Error) {
        message = err.message;
    }

    const response: ErrorResponse = {
        success: false,
        error: {
            message,
            code,
            errors,
        },
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === "development") {
        response.error.stack = err.stack;
    }

    // Log error
    console.error(`[ERROR] ${statusCode} - ${message}`, {
        code,
        stack: err.stack,
    });

    res.status(statusCode).json(response);
}

// ============================================================================
// NOT FOUND HANDLER
// ============================================================================

export function notFoundHandler(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
}
