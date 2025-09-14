import { Request, Response } from "express";
import {
  generationService,
  GenerationRequest,
} from "../services/generation.js";
import { Logger } from "../utils/logger.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants/index.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { z } from "zod";
import type { UUID } from "@ai-resume/types";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: UUID;
    email: string;
  };
}

// Validation schema for resume generation
const GenerateResumeSchema = z.object({
  resume_id: z.string().uuid("Invalid resume ID format"),
  job_id: z.string().uuid("Invalid job ID format"),
  options: z.object({
    preview_only: z.boolean().optional().default(true),
    format: z.enum(["pdf", "docx"]).optional().default("pdf"),
    includeCoverLetter: z.boolean().optional().default(false),
  }),
});

// Validation schema for cover letter generation
const GenerateCoverLetterSchema = z.object({
  resume_id: z.string().uuid("Invalid resume ID format"),
  job_id: z.string().uuid("Invalid job ID format"),
  options: z.object({
    preview_only: z.boolean().optional().default(true),
  }),
});

export class GenerationController {
  async generateResume(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate request body
      const validation = GenerateResumeSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: validation.error.errors,
        });
        return;
      }

      const { resume_id, job_id, options } = validation.data;

      // Create generation request
      const generationRequest: GenerationRequest = {
        user_id: userId,
        resume_id,
        job_id,
        options,
      };

      Logger.info("Starting resume generation", {
        userId,
        resumeId: resume_id,
        jobId: job_id,
        previewOnly: options.preview_only,
      });

      // Generate resume
      const result = await generationService.generateResume(generationRequest);

      if (result.status === "failed") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Resume generation failed",
          message: "Generated content failed hallucination check",
          details: result.metadata.hallucinationCheck.issues,
          generation_id: result.generation_id,
        });
        return;
      }

      Logger.info("Resume generation completed successfully", {
        generationId: result.generation_id,
        userId,
        processingTimeMs: result.metadata.processingTimeMs,
      });

      res.status(HTTP_STATUS.OK).json({
        generation_id: result.generation_id,
        generated_text: result.generated_text,
        diff: result.diff,
        metadata: result.metadata,
        status: result.status,
        message: "Resume generated successfully",
      });
    } catch (error) {
      Logger.error("Error generating resume:", error);

      if (error instanceof NotFoundError) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.RESUME_NOT_FOUND,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: error.message,
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to generate resume",
      });
    }
  }

  async generateCoverLetter(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate request body
      const validation = GenerateCoverLetterSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: validation.error.errors,
        });
        return;
      }

      const { resume_id, job_id, options } = validation.data;

      // Create generation request
      const generationRequest: GenerationRequest = {
        user_id: userId,
        resume_id,
        job_id,
        options,
      };

      Logger.info("Starting cover letter generation", {
        userId,
        resumeId: resume_id,
        jobId: job_id,
        previewOnly: options.preview_only,
      });

      // Generate cover letter
      const result = await generationService.generateCoverLetter(
        generationRequest
      );

      if (result.status === "failed") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Cover letter generation failed",
          message: "Failed to generate cover letter",
          generation_id: result.generation_id,
        });
        return;
      }

      Logger.info("Cover letter generation completed successfully", {
        generationId: result.generation_id,
        userId,
        processingTimeMs: result.metadata.processingTimeMs,
      });

      res.status(HTTP_STATUS.OK).json({
        generation_id: result.generation_id,
        generated_text: result.generated_text,
        diff: result.diff,
        metadata: result.metadata,
        status: result.status,
        message: "Cover letter generated successfully",
      });
    } catch (error) {
      Logger.error("Error generating cover letter:", error);

      if (error instanceof NotFoundError) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.RESUME_NOT_FOUND,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: error.message,
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to generate cover letter",
      });
    }
  }

  async getGenerationStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      const { id } = req.params;

      // Validate generation ID
      if (!id || typeof id !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Invalid generation ID",
        });
        return;
      }

      // For now, return a simple status response
      // In a real implementation, this would check the actual generation status
      res.status(HTTP_STATUS.OK).json({
        generation_id: id,
        status: "completed",
        message: "Generation completed",
      });
    } catch (error) {
      Logger.error("Error getting generation status:", error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to get generation status",
      });
    }
  }

  async getDownloadUrl(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      const { id } = req.params;

      // Validate generation ID
      if (!id || typeof id !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Invalid generation ID",
        });
        return;
      }

      // For now, return a placeholder download URL
      // In a real implementation, this would generate a presigned URL
      res.status(HTTP_STATUS.OK).json({
        generation_id: id,
        downloadUrl: `https://example.com/download/${id}`,
        message: "Download URL generated",
      });
    } catch (error) {
      Logger.error("Error getting download URL:", error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to get download URL",
      });
    }
  }
}

// Export singleton instance
export const generationController = new GenerationController();
