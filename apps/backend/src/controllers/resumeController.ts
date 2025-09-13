// Resume controller

import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import {
  asyncHandler,
  NotFoundError,
  AuthenticationError,
} from "../utils/errors.js";
import { sendSuccess, sendCreated, sendNotFound } from "../utils/response.js";
import {
  UploadResponseSchema,
  ResumeResponseSchema,
  ResumeListResponseSchema,
} from "../schemas/index.js";
import {
  createResume,
  getResumeById,
  getResumesByUserId,
  updateResumeCanonicalJson,
  deleteResume,
} from "../services/resume.js";
import { createStorageService } from "../services/storage.js";
import {
  validateResumeFile,
  sanitizeFilename,
} from "../utils/fileValidation.js";
import { textExtractionService } from "../services/textExtraction.js";
import { simpleResumeParser } from "../services/simpleResumeParser.js";
import { Logger } from "../utils/logger.js";

export const uploadResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    // Validate file
    const validation = validateResumeFile(req.file);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // User is already authenticated and exists in database (from middleware)
    if (!req.user?.id) {
      throw new AuthenticationError("User not authenticated");
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(req.file.originalname);

    // Upload file to storage
    const storageService = createStorageService();
    const fileKey = await storageService.uploadFile(
      req.file.buffer,
      sanitizedFilename,
      validation.contentType!
    );

    // Save resume record to database
    const resume = await createResume({
      user_id: req.user.id,
      file_key: fileKey,
    });

    // Extract text and parse resume in the background
    try {
      // Extract text from the uploaded file
      const extractedText = await textExtractionService.extractText(
        req.file.buffer,
        validation.contentType!,
        sanitizedFilename
      );

      // Parse the extracted text into raw sections
      const rawSections = simpleResumeParser.parseResume(extractedText.text);

      // Update the resume with the raw sections
      await updateResumeCanonicalJson(resume.id, rawSections);

      Logger.info("Resume processing completed", {
        resumeId: resume.id,
        textLength: extractedText.text.length,
        sectionsFound: Object.keys(rawSections).length,
        sections: Object.keys(rawSections),
      });
    } catch (error) {
      Logger.error("Resume processing failed", {
        resumeId: resume.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Don't fail the upload if parsing fails - user can still access the file
    }

    const response = UploadResponseSchema.parse({
      resume_id: resume.id,
      file_key: resume.file_key,
      filename: sanitizedFilename,
    });

    return sendCreated(res, response, "Resume uploaded successfully");
  }
);

export const getResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    // User is already authenticated (from middleware)
    if (!req.user?.id) {
      throw new AuthenticationError("User not authenticated");
    }

    // Get resume
    const resume = await getResumeById(id);
    if (!resume) {
      throw new NotFoundError("Resume");
    }

    // Check if resume belongs to user
    if (resume.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const response = ResumeResponseSchema.parse({
      id: resume.id,
      user_id: resume.user_id,
      file_key: resume.file_key,
      canonical_json: resume.canonical_json,
      created_at: resume.created_at.toISOString(),
      updated_at: resume.updated_at.toISOString(),
    });

    return sendSuccess(res, response);
  }
);

export const getResumes = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    // User is already authenticated (from middleware)
    if (!req.user?.id) {
      throw new AuthenticationError("User not authenticated");
    }

    // Get user's resumes
    const resumes = await getResumesByUserId(req.user.id);

    const response = resumes.map((resume) =>
      ResumeResponseSchema.parse({
        id: resume.id,
        user_id: resume.user_id,
        file_key: resume.file_key,
        canonical_json: resume.canonical_json,
        created_at: resume.created_at.toISOString(),
        updated_at: resume.updated_at.toISOString(),
      })
    );

    return sendSuccess(res, response);
  }
);

export const updateResumeSections = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { sections } = req.body as unknown as { sections: any };

    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    if (!sections || typeof sections !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid sections data",
      });
    }

    // Get the resume to verify ownership
    const resume = await getResumeById(id);
    if (!resume) {
      throw new NotFoundError("Resume not found");
    }

    // Verify ownership
    if (!req.user?.id || resume.user_id !== req.user.id) {
      throw new AuthenticationError("Not authorized to update this resume");
    }

    // Update the resume with the edited sections
    await updateResumeCanonicalJson(resume.id, sections);

    Logger.info("Resume sections updated", {
      resumeId: resume.id,
      userId: req.user.id,
      sectionsUpdated: Object.keys(sections).length,
    });

    return sendSuccess(
      res,
      { success: true },
      "Resume sections updated successfully"
    );
  }
);

export const deleteResumeController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError("User not authenticated");
    }

    Logger.info("Deleting resume", { resumeId: id, userId });

    // Check if resume exists and belongs to user
    const resume = await getResumeById(id);
    if (!resume) {
      return sendNotFound(res, "Resume not found");
    }

    if (resume.user_id !== userId) {
      throw new AuthenticationError("Access denied");
    }

    // Delete the resume
    await deleteResume(id);

    Logger.info("Resume deleted successfully", { resumeId: id, userId });

    return sendSuccess(res, null, "Resume deleted successfully");
  }
);
