import "dotenv/config";
import express from "express";
import cors from "cors";
import { router as authRoutes } from "./routes/auth.js";
import { router as resumeRoutes } from "./routes/resumes.js";
import { router as jobsRoutes } from "./routes/jobs.js";
import { router as generateRoutes } from "./routes/generate.js";
import { router as webhookRoutes } from "./routes/webhooks.js";
import { initializeDatabase } from "./config/database.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/jobs", jobsRoutes);
app.use("/api/v1/generate", generateRoutes);
app.use("/api/v1/webhook", webhookRoutes);

const port = process.env.PORT || 4000;

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
