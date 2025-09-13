import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/auth.js";
import { pdfParserService } from "../services/pdfParserService.js";
import { asyncHandler } from "../utils/errors.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { Logger } from "../utils/logger.js";
import {
  validateResumeFile,
  sanitizeFilename,
} from "../utils/fileValidation.js";

export const router = Router();

/**
 * Upload resume and get detailed PDF parsing results
 * This endpoint demonstrates the integration with the Python PDF parser service
 */
router.post(
  "/upload-resume",
  verifyFirebaseToken,
  asyncHandler(async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate file
    const validation = validateResumeFile(req.file);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Only process PDF files for this endpoint
    if (validation.contentType !== "application/pdf") {
      return res.status(400).json({
        error:
          "This endpoint only processes PDF files. Use /resumes/upload for other formats.",
      });
    }

    const sanitizedFilename = sanitizeFilename(req.file.originalname);

    try {
      Logger.info("Processing PDF with Python parser service", {
        filename: sanitizedFilename,
        userId: req.user.id,
      });

      // Parse PDF using Python service
      const parseResult = await pdfParserService.parsePDF(
        req.file.buffer,
        sanitizedFilename
      );

      Logger.info("PDF parsing completed successfully", {
        filename: sanitizedFilename,
        pageCount: parseResult.metadata.page_count,
        textLength: parseResult.text.length,
      });

      // Return the parsed results
      return sendSuccess(res, {
        filename: sanitizedFilename,
        parsedData: parseResult,
        message: "PDF parsed successfully using PyMuPDF",
      });
    } catch (error) {
      Logger.error("PDF parsing failed", {
        filename: sanitizedFilename,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return sendError(
        res,
        `Failed to parse PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500
      );
    }
  })
);

/**
 * Health check for PDF parser service
 */
router.get(
  "/health",
  asyncHandler(async (req: any, res: any) => {
    try {
      const isHealthy = await pdfParserService.isHealthy();

      if (isHealthy) {
        return sendSuccess(res, {
          status: "healthy",
          service: "pdf-parser",
          message: "Python PDF parser service is available",
        });
      } else {
        return sendError(
          res,
          "Service unavailable: Python PDF parser service is not responding",
          503
        );
      }
    } catch (error) {
      Logger.error("PDF parser health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return sendError(
        res,
        `Health check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500
      );
    }
  })
);

/**
 * Get PDF parser service status and configuration
 */
router.get(
  "/status",
  asyncHandler(async (req: any, res: any) => {
    try {
      const isHealthy = await pdfParserService.isHealthy();

      return sendSuccess(res, {
        service: "pdf-parser",
        healthy: isHealthy,
        baseUrl: process.env.PDF_PARSER_SERVICE_URL || "http://localhost:8000",
        endpoints: {
          parse: "/parse",
          parseTextOnly: "/parse-text-only",
          health: "/health",
        },
      });
    } catch (error) {
      Logger.error("PDF parser status check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return sendError(
        res,
        `Status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500
      );
    }
  })
);
