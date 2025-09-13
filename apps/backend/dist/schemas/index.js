// Zod validation schemas
import { z } from "zod";
// Auth schemas
export const VerifyTokenSchema = z.object({
    idToken: z.string().min(1, "Token is required"),
});
// Resume schemas
export const UploadResponseSchema = z.object({
    resume_id: z.string().uuid(),
    file_key: z.string().min(1),
    filename: z.string().min(1),
});
export const ResumeResponseSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    file_key: z.string().min(1),
    canonical_json: z.any().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export const ResumeListResponseSchema = z.array(ResumeResponseSchema);
// Job schemas
export const CreateJobSchema = z.object({
    title: z.string().min(1, "Title is required").max(500),
    company: z.string().max(500).optional(),
    location: z.string().max(500).optional(),
    description: z.string().optional(),
    url: z.string().url().max(1000).optional(),
});
export const JobResponseSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string(),
    company: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// Generation schemas
export const CreateGenerationSchema = z.object({
    resume_id: z.string().uuid(),
    job_id: z.string().uuid().optional(),
    prompt: z.string().min(1, "Prompt is required"),
});
export const GenerationResponseSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    resume_id: z.string().uuid(),
    job_id: z.string().uuid().optional(),
    prompt: z.string(),
    response: z.string(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// File validation schemas
export const FileValidationSchema = z.object({
    isValid: z.boolean(),
    error: z.string().optional(),
    contentType: z.string().optional(),
});
// Common schemas
export const UuidParamSchema = z.object({
    id: z.string().uuid("Invalid ID format"),
});
export const PaginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});
// Error response schema
export const ErrorResponseSchema = z.object({
    error: z.string(),
    message: z.string().optional(),
    stack: z.string().optional(),
});
// Success response schema
export const SuccessResponseSchema = z.object({
    data: z.any().optional(),
    message: z.string().optional(),
});
