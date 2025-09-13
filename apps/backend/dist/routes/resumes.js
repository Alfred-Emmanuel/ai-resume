import { Router } from "express";
import multer from "multer";
import { verifyFirebaseToken } from "../middleware/auth.js";
import { uploadResume, getResume, getResumes, updateResumeSections, } from "../controllers/resumeController.js";
import { FILE_UPLOAD } from "../constants/index.js";
export const router = Router();
// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: FILE_UPLOAD.MAX_SIZE,
    },
});
// Routes
router.post("/upload", verifyFirebaseToken, upload.single("resume"), uploadResume);
router.put("/:id/sections", verifyFirebaseToken, updateResumeSections);
router.get("/:id", verifyFirebaseToken, getResume);
router.get("/", verifyFirebaseToken, getResumes);
