import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./error.middleware.js";

// ============================================================================
// TYPES
// ============================================================================

export interface JWTPayload {
    userId: string;
    phone: string;
    iat: number;
    exp: number;
}

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        phone: string;
    };
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Default to 7 days in seconds
const JWT_EXPIRES_IN_SECONDS = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || "604800", 10);

export function generateToken(userId: string, phone: string): string {
    return jwt.sign({ userId, phone }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN_SECONDS,
    });
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("No token provided");
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new UnauthorizedError("No token provided");
        }

        const decoded = verifyToken(token);

        // Attach user to request
        (req as AuthenticatedRequest).user = {
            userId: decoded.userId,
            phone: decoded.phone,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError("Invalid token"));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError("Token expired"));
        } else {
            next(error);
        }
    }
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            if (token) {
                const decoded = verifyToken(token);
                (req as AuthenticatedRequest).user = {
                    userId: decoded.userId,
                    phone: decoded.phone,
                };
            }
        }

        next();
    } catch {
        // Silently fail - user just won't be authenticated
        next();
    }
}
