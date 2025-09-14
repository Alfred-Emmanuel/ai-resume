import { Router } from "express";
import { generationController } from "../controllers/generationController.js";
import { verifyFirebaseToken } from "../middleware/auth.js";

export const router = Router();

// Apply authentication middleware to all generation routes
router.use(verifyFirebaseToken);

// Resume generation endpoint
router.post("/resume", (req, res) => {
  generationController.generateResume(req, res);
});

// Cover letter generation endpoint
router.post("/coverletter", (req, res) => {
  generationController.generateCoverLetter(req, res);
});

// Get generation status
router.get("/:id/status", (req, res) => {
  generationController.getGenerationStatus(req, res);
});

// Get download URL
router.get("/:id/download", (req, res) => {
  generationController.getDownloadUrl(req, res);
});
