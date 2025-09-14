import { Request, Response } from "express";
import { jobService } from "../services/job.js";
import { Logger } from "../utils/logger.js";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/index.js";
import {
  CreateJobSchema,
  UuidParamSchema,
  PaginationSchema,
} from "../schemas/index.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import type { UUID } from "@ai-resume/types";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: UUID;
    email: string;
  };
}

export class JobController {
  async captureJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate request body
      const validation = CreateJobSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: validation.error.errors,
        });
        return;
      }

      const jobData = validation.data;

      // Capture the job
      const job = await jobService.captureJob(userId, {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        url: jobData.url,
        rawText: jobData.description || jobData.title, // Use description as rawText
      });

      Logger.info("Job captured successfully", {
        jobId: job.id,
        userId,
        title: job.title,
      });

      res.status(HTTP_STATUS.CREATED).json({
        job_id: job.id,
        message: "Job captured successfully",
        data: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          created_at: job.created_at,
        },
      });
    } catch (error) {
      Logger.error("Error capturing job:", error);

      if (error instanceof ValidationError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: error.message,
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to capture job",
      });
    }
  }

  async getJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate job ID parameter
      const paramValidation = UuidParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Invalid job ID format",
        });
        return;
      }

      const jobId = paramValidation.data.id;

      // Get the job
      const job = await jobService.getJobById(jobId, userId);

      res.status(HTTP_STATUS.OK).json({
        data: job,
        message: "Job retrieved successfully",
      });
    } catch (error) {
      Logger.error("Error getting job:", error);

      if (error instanceof NotFoundError) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.JOB_NOT_FOUND,
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to get job",
      });
    }
  }

  async getJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate query parameters
      const queryValidation = PaginationSchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: queryValidation.error.errors,
        });
        return;
      }

      const { page, limit } = queryValidation.data;
      const offset = (page - 1) * limit;

      // Get jobs
      const jobs = await jobService.getJobsByUserId(userId, limit, offset);
      const totalCount = await jobService.getJobCount(userId);

      res.status(HTTP_STATUS.OK).json({
        data: jobs,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        message: "Jobs retrieved successfully",
      });
    } catch (error) {
      Logger.error("Error getting jobs:", error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to get jobs",
      });
    }
  }

  async updateJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate job ID parameter
      const paramValidation = UuidParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Invalid job ID format",
        });
        return;
      }

      const jobId = paramValidation.data.id;

      // Validate request body (partial update)
      const updateData = CreateJobSchema.partial().safeParse(req.body);
      if (!updateData.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: updateData.error.errors,
        });
        return;
      }

      // Update the job
      const job = await jobService.updateJob(jobId, userId, updateData.data);

      Logger.info("Job updated successfully", {
        jobId,
        userId,
      });

      res.status(HTTP_STATUS.OK).json({
        data: job,
        message: "Job updated successfully",
      });
    } catch (error) {
      Logger.error("Error updating job:", error);

      if (error instanceof NotFoundError) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.JOB_NOT_FOUND,
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
        message: "Failed to update job",
      });
    }
  }

  async deleteJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      // Validate job ID parameter
      const paramValidation = UuidParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Invalid job ID format",
        });
        return;
      }

      const jobId = paramValidation.data.id;

      // Delete the job
      const deleted = await jobService.deleteJob(jobId, userId);

      if (!deleted) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.JOB_NOT_FOUND,
        });
        return;
      }

      Logger.info("Job deleted successfully", {
        jobId,
        userId,
      });

      res.status(HTTP_STATUS.OK).json({
        message: "Job deleted successfully",
      });
    } catch (error) {
      Logger.error("Error deleting job:", error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to delete job",
      });
    }
  }

  async searchJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      const { q: searchTerm, limit = 20 } = req.query;

      if (!searchTerm || typeof searchTerm !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Search term is required",
        });
        return;
      }

      // Search jobs
      const jobs = await jobService.searchJobs(
        userId,
        searchTerm,
        parseInt(limit as string)
      );

      res.status(HTTP_STATUS.OK).json({
        data: jobs,
        message: "Job search completed successfully",
        searchTerm,
        count: jobs.length,
      });
    } catch (error) {
      Logger.error("Error searching jobs:", error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: "Failed to search jobs",
      });
    }
  }
}

// Export singleton instance
export const jobController = new JobController();
