import { v4 as uuidv4 } from "uuid";
import { Resume, CreateResumeData } from "../types/index.js";
import { BaseService } from "./baseService.js";
import { Logger } from "../utils/logger.js";

export class ResumeService extends BaseService {
  async createResume(data: CreateResumeData): Promise<Resume> {
    this.validateRequired(data.user_id, "User ID");
    this.validateRequired(data.file_key, "File key");
    this.validateUuid(data.user_id, "User ID");

    const id = uuidv4();
    Logger.info("Creating resume", {
      userId: data.user_id,
      fileKey: data.file_key,
    });

    return await this.executeInsert<Resume>(
      "INSERT INTO resumes (id, user_id, file_key, canonical_json) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, data.user_id, data.file_key, data.canonical_json],
      "create resume"
    );
  }

  async getResumeById(id: string): Promise<Resume | null> {
    this.validateRequired(id, "Resume ID");
    this.validateUuid(id, "Resume ID");

    Logger.debug("Getting resume by ID", { resumeId: id });

    return await this.executeQuerySingle<Resume>(
      "SELECT * FROM resumes WHERE id = $1",
      [id],
      "get resume by ID"
    );
  }

  async getResumeByIdRequired(id: string): Promise<Resume> {
    this.validateRequired(id, "Resume ID");
    this.validateUuid(id, "Resume ID");

    Logger.debug("Getting resume by ID (required)", { resumeId: id });

    return await this.executeQueryRequired<Resume>(
      "SELECT * FROM resumes WHERE id = $1",
      [id],
      "get resume by ID",
      "Resume"
    );
  }

  async getResumesByUserId(userId: string): Promise<Resume[]> {
    this.validateRequired(userId, "User ID");
    this.validateUuid(userId, "User ID");

    Logger.debug("Getting resumes by user ID", { userId });

    return await this.executeQuery<Resume>(
      "SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
      "get resumes by user ID"
    );
  }

  async updateResumeCanonicalJson(
    id: string,
    canonicalJson: any
  ): Promise<Resume> {
    this.validateRequired(id, "Resume ID");
    this.validateUuid(id, "Resume ID");

    Logger.info("Updating resume canonical JSON", { resumeId: id });

    return await this.executeQueryRequired<Resume>(
      "UPDATE resumes SET canonical_json = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [canonicalJson, id],
      "update resume canonical JSON",
      "Resume"
    );
  }

  async deleteResume(id: string): Promise<boolean> {
    this.validateRequired(id, "Resume ID");
    this.validateUuid(id, "Resume ID");

    Logger.info("Deleting resume", { resumeId: id });

    return await this.executeDelete(
      "DELETE FROM resumes WHERE id = $1",
      [id],
      "delete resume"
    );
  }

  async getResumeCountByUserId(userId: string): Promise<number> {
    this.validateRequired(userId, "User ID");
    this.validateUuid(userId, "User ID");

    Logger.debug("Getting resume count by user ID", { userId });

    const result = await this.executeQuerySingle<{ count: string }>(
      "SELECT COUNT(*) as count FROM resumes WHERE user_id = $1",
      [userId],
      "get resume count by user ID"
    );

    return result ? parseInt(result.count) : 0;
  }

  async getResumesByUserIdPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    resumes: Resume[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.validateRequired(userId, "User ID");
    this.validateUuid(userId, "User ID");

    const offset = (page - 1) * limit;
    Logger.debug("Getting paginated resumes by user ID", {
      userId,
      page,
      limit,
    });

    const [resumes, totalResult] = await Promise.all([
      this.executeQuery<Resume>(
        "SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [userId, limit, offset],
        "get paginated resumes by user ID"
      ),
      this.executeQuerySingle<{ count: string }>(
        "SELECT COUNT(*) as count FROM resumes WHERE user_id = $1",
        [userId],
        "get total resume count"
      ),
    ]);

    const total = totalResult ? parseInt(totalResult.count) : 0;

    return {
      resumes,
      total,
      page,
      limit,
    };
  }
}

// Export singleton instance
export const resumeService = new ResumeService();

// Export individual functions for backward compatibility
export const createResume = (data: CreateResumeData) =>
  resumeService.createResume(data);
export const getResumeById = (id: string) => resumeService.getResumeById(id);
export const getResumesByUserId = (userId: string) =>
  resumeService.getResumesByUserId(userId);
export const updateResumeCanonicalJson = (id: string, canonicalJson: any) =>
  resumeService.updateResumeCanonicalJson(id, canonicalJson);
export const deleteResume = (id: string) => resumeService.deleteResume(id);
