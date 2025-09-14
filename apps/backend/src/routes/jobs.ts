import { Router } from "express";
import { jobController } from "../controllers/jobController.js";
import { verifyFirebaseToken } from "../middleware/auth.js";

export const router = Router();

// Apply authentication middleware to all job routes
router.use(verifyFirebaseToken);

// Job capture endpoint
router.post("/capture", (req, res) => {
  jobController.captureJob(req, res);
});

// Get specific job
router.get("/:id", (req, res) => {
  jobController.getJob(req, res);
});

// Get all jobs for user (with pagination)
router.get("/", (req, res) => {
  jobController.getJobs(req, res);
});

// Update job
router.put("/:id", (req, res) => {
  jobController.updateJob(req, res);
});

// Delete job
router.delete("/:id", (req, res) => {
  jobController.deleteJob(req, res);
});

// Search jobs
router.get("/search", (req, res) => {
  jobController.searchJobs(req, res);
});
