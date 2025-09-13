import { v4 as uuidv4 } from "uuid";
import { BaseService } from "./baseService.js";
import { Logger } from "../utils/logger.js";
export class ResumeService extends BaseService {
    async createResume(data) {
        this.validateRequired(data.user_id, "User ID");
        this.validateRequired(data.file_key, "File key");
        this.validateUuid(data.user_id, "User ID");
        const id = uuidv4();
        Logger.info("Creating resume", {
            userId: data.user_id,
            fileKey: data.file_key,
        });
        return await this.executeInsert("INSERT INTO resumes (id, user_id, file_key, canonical_json) VALUES ($1, $2, $3, $4) RETURNING *", [id, data.user_id, data.file_key, data.canonical_json], "create resume");
    }
    async getResumeById(id) {
        this.validateRequired(id, "Resume ID");
        this.validateUuid(id, "Resume ID");
        Logger.debug("Getting resume by ID", { resumeId: id });
        return await this.executeQuerySingle("SELECT * FROM resumes WHERE id = $1", [id], "get resume by ID");
    }
    async getResumeByIdRequired(id) {
        this.validateRequired(id, "Resume ID");
        this.validateUuid(id, "Resume ID");
        Logger.debug("Getting resume by ID (required)", { resumeId: id });
        return await this.executeQueryRequired("SELECT * FROM resumes WHERE id = $1", [id], "get resume by ID", "Resume");
    }
    async getResumesByUserId(userId) {
        this.validateRequired(userId, "User ID");
        this.validateUuid(userId, "User ID");
        Logger.debug("Getting resumes by user ID", { userId });
        return await this.executeQuery("SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC", [userId], "get resumes by user ID");
    }
    async updateResumeCanonicalJson(id, canonicalJson) {
        this.validateRequired(id, "Resume ID");
        this.validateUuid(id, "Resume ID");
        Logger.info("Updating resume canonical JSON", { resumeId: id });
        return await this.executeQueryRequired("UPDATE resumes SET canonical_json = $1, updated_at = NOW() WHERE id = $2 RETURNING *", [canonicalJson, id], "update resume canonical JSON", "Resume");
    }
    async deleteResume(id) {
        this.validateRequired(id, "Resume ID");
        this.validateUuid(id, "Resume ID");
        Logger.info("Deleting resume", { resumeId: id });
        return await this.executeDelete("DELETE FROM resumes WHERE id = $1", [id], "delete resume");
    }
    async getResumeCountByUserId(userId) {
        this.validateRequired(userId, "User ID");
        this.validateUuid(userId, "User ID");
        Logger.debug("Getting resume count by user ID", { userId });
        const result = await this.executeQuerySingle("SELECT COUNT(*) as count FROM resumes WHERE user_id = $1", [userId], "get resume count by user ID");
        return result ? parseInt(result.count) : 0;
    }
    async getResumesByUserIdPaginated(userId, page = 1, limit = 10) {
        this.validateRequired(userId, "User ID");
        this.validateUuid(userId, "User ID");
        const offset = (page - 1) * limit;
        Logger.debug("Getting paginated resumes by user ID", {
            userId,
            page,
            limit,
        });
        const [resumes, totalResult] = await Promise.all([
            this.executeQuery("SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [userId, limit, offset], "get paginated resumes by user ID"),
            this.executeQuerySingle("SELECT COUNT(*) as count FROM resumes WHERE user_id = $1", [userId], "get total resume count"),
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
export const createResume = (data) => resumeService.createResume(data);
export const getResumeById = (id) => resumeService.getResumeById(id);
export const getResumesByUserId = (userId) => resumeService.getResumesByUserId(userId);
export const updateResumeCanonicalJson = (id, canonicalJson) => resumeService.updateResumeCanonicalJson(id, canonicalJson);
export const deleteResume = (id) => resumeService.deleteResume(id);
