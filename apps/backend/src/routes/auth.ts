import { Router } from "express";
import { verifyToken, healthCheck } from "../controllers/authController.js";

export const router = Router();

// Routes
router.post("/verify", verifyToken);
router.get("/health", healthCheck);
