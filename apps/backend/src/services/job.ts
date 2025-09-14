import { BaseService } from "./baseService.js";
import { Logger } from "../utils/logger.js";
import { NotFoundError } from "../utils/errors.js";
import type { UUID } from "@ai-resume/types";

export interface JobData {
  id: UUID;
  user_id: UUID;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobData {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
}

export interface JobCaptureData {
  title: string;
  company?: string;
  location?: string;
  source?: "linkedin" | "indeed" | "other";
  rawText: string;
  description?: string;
  url?: string;
}

export class JobService extends BaseService {
  async createJob(userId: UUID, jobData: CreateJobData): Promise<JobData> {
    this.validateUuid(userId, "User ID");
    this.validateRequired(jobData.title, "Job title");

    const query = `
      INSERT INTO jobs (user_id, title, company, location, description, url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      userId,
      jobData.title,
      jobData.company || null,
      jobData.location || null,
      jobData.description || null,
      jobData.url || null,
    ];

    const result = await this.executeInsert<JobData>(
      query,
      params,
      "create job"
    );

    Logger.info("Job created successfully", {
      jobId: result.id,
      userId,
      title: jobData.title,
    });

    return result;
  }

  async captureJob(
    userId: UUID,
    captureData: JobCaptureData
  ): Promise<JobData> {
    this.validateUuid(userId, "User ID");
    this.validateRequired(captureData.title, "Job title");
    this.validateRequired(captureData.rawText, "Job description");

    // Extract description from rawText if not provided
    const description = captureData.description || captureData.rawText;

    const jobData: CreateJobData = {
      title: captureData.title,
      company: captureData.company,
      location: captureData.location,
      description,
      url: captureData.url,
    };

    const result = await this.createJob(userId, jobData);

    Logger.info("Job captured successfully", {
      jobId: result.id,
      userId,
      title: captureData.title,
      source: captureData.source || "other",
    });

    return result;
  }

  async getJobById(jobId: UUID, userId: UUID): Promise<JobData> {
    this.validateUuid(jobId, "Job ID");
    this.validateUuid(userId, "User ID");

    const query = `
      SELECT * FROM jobs 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.executeQueryRequired<JobData>(
      query,
      [jobId, userId],
      "get job by ID",
      "Job"
    );

    return result;
  }

  async getJobsByUserId(
    userId: UUID,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobData[]> {
    this.validateUuid(userId, "User ID");

    // Enforce maximum limit to prevent memory issues
    const maxLimit = Math.min(limit, 100);
    const safeOffset = Math.max(offset, 0);

    const query = `
      SELECT * FROM jobs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const results = await this.executeQuery<JobData>(
      query,
      [userId, maxLimit, safeOffset],
      "get jobs by user ID"
    );

    return results;
  }

  async updateJob(
    jobId: UUID,
    userId: UUID,
    updateData: Partial<CreateJobData>
  ): Promise<JobData> {
    this.validateUuid(jobId, "Job ID");
    this.validateUuid(userId, "User ID");

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(updateData.title);
    }

    if (updateData.company !== undefined) {
      updateFields.push(`company = $${paramIndex++}`);
      params.push(updateData.company);
    }

    if (updateData.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      params.push(updateData.location);
    }

    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(updateData.description);
    }

    if (updateData.url !== undefined) {
      updateFields.push(`url = $${paramIndex++}`);
      params.push(updateData.url);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(jobId, userId);

    const query = `
      UPDATE jobs 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    const result = await this.executeQueryRequired<JobData>(
      query,
      params,
      "update job",
      "Job"
    );

    Logger.info("Job updated successfully", {
      jobId,
      userId,
      updatedFields: updateFields.length,
    });

    return result;
  }

  async deleteJob(jobId: UUID, userId: UUID): Promise<boolean> {
    this.validateUuid(jobId, "Job ID");
    this.validateUuid(userId, "User ID");

    const query = `
      DELETE FROM jobs 
      WHERE id = $1 AND user_id = $2
    `;

    const deleted = await this.executeDelete(
      query,
      [jobId, userId],
      "delete job"
    );

    if (deleted) {
      Logger.info("Job deleted successfully", { jobId, userId });
    }

    return deleted;
  }

  async getJobCount(userId: UUID): Promise<number> {
    this.validateUuid(userId, "User ID");

    const query = `
      SELECT COUNT(*) as count FROM jobs WHERE user_id = $1
    `;

    const result = await this.executeQueryRequired<{ count: string }>(
      query,
      [userId],
      "get job count"
    );

    return parseInt(result.count);
  }

  async searchJobs(
    userId: UUID,
    searchTerm: string,
    limit: number = 20
  ): Promise<JobData[]> {
    this.validateUuid(userId, "User ID");
    this.validateRequired(searchTerm, "Search term");

    // Enforce maximum limit and minimum search term length
    const maxLimit = Math.min(limit, 50);
    const trimmedTerm = searchTerm.trim();

    if (trimmedTerm.length < 2) {
      return []; // Return empty for very short search terms
    }

    const query = `
      SELECT * FROM jobs 
      WHERE user_id = $1 
      AND (
        title ILIKE $2 
        OR company ILIKE $2 
        OR location ILIKE $2 
        OR description ILIKE $2
      )
      ORDER BY created_at DESC 
      LIMIT $3
    `;

    const searchPattern = `%${trimmedTerm}%`;

    const results = await this.executeQuery<JobData>(
      query,
      [userId, searchPattern, maxLimit],
      "search jobs"
    );

    return results;
  }
}

// Export singleton instance
export const jobService = new JobService();
