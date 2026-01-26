import dotenv from "dotenv";
dotenv.config();

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { examRouter } from "./routes/exam.routes.js";
import { practiceRouter } from "./routes/practice.routes.js";
import { progressRouter } from "./routes/progress.routes.js";
import { aiRouter } from "./routes/ai.routes.js";

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? ["https://prepsathi.com", "https://admin.prepsathi.com"]
        : "*",
    credentials: true,
}));

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// API v1 routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/exams", examRouter);
app.use("/api/v1/practice", practiceRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/ai", aiRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`🚀 PrepSathi API Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;