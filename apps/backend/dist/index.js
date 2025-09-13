import "dotenv/config";
import express from "express";
import cors from "cors";
import { router as authRoutes } from "./routes/auth.js";
import { router as resumeRoutes } from "./routes/resumes.js";
import { router as jobsRoutes } from "./routes/jobs.js";
import { router as generateRoutes } from "./routes/generate.js";
import { router as webhookRoutes } from "./routes/webhooks.js";
import { initializeDatabase } from "./config/database.js";
import { errorHandler } from "./utils/errors.js";
import { requestLoggingMiddleware, errorLoggingMiddleware, } from "./middleware/logging.js";
import { API } from "./constants/index.js";
import { Logger } from "./utils/logger.js";
const app = express();
// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Logging middleware
app.use(requestLoggingMiddleware);
// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));
// Routes
app.use(`${API.BASE_PATH}/auth`, authRoutes);
app.use(`${API.BASE_PATH}/resumes`, resumeRoutes);
app.use(`${API.BASE_PATH}/jobs`, jobsRoutes);
app.use(`${API.BASE_PATH}/generate`, generateRoutes);
app.use(`${API.BASE_PATH}/webhook`, webhookRoutes);
// Error logging middleware (before error handler)
app.use(errorLoggingMiddleware);
// Error handling middleware (must be last)
app.use(errorHandler);
// Initialize database and start server
const startServer = async () => {
    try {
        Logger.info("Starting AI Resume Backend Server...");
        await initializeDatabase();
        app.listen(API.PORT, () => {
            Logger.info(`Server started successfully`, {
                port: API.PORT,
                environment: process.env.NODE_ENV || "development",
                basePath: API.BASE_PATH,
            });
        });
    }
    catch (error) {
        Logger.error("Failed to start server:", error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on("SIGTERM", () => {
    Logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    Logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
startServer();
