// Shared types for the backend application

// Database entity types
export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Resume {
  id: string;
  user_id: string;
  file_key: string;
  canonical_json?: any;
  created_at: Date;
  updated_at: Date;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Generation {
  id: string;
  user_id: string;
  resume_id: string;
  job_id?: string;
  prompt: string;
  response: string;
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
    id: string; // Database user ID
  };
  file?: Express.Multer.File;
  params: { [key: string]: string };
}

// Service layer types
export interface CreateUserData {
  firebase_uid: string;
  email: string;
  email_verified?: boolean;
}

export interface CreateResumeData {
  user_id: string;
  file_key: string;
  canonical_json?: any;
}

export interface CreateJobData {
  user_id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
}

export interface CreateGenerationData {
  user_id: string;
  resume_id: string;
  job_id?: string;
  prompt: string;
  response: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// File upload types
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  contentType?: string;
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// Storage service types
export interface StorageService {
  uploadFile(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string>;
  getFileUrl(fileKey: string): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
}

// Configuration types
export interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface FirebaseConfig {
  projectId: string;
  serviceAccountKey: any;
}

export interface StorageConfig {
  type: "minio" | "s3";
  endpoint: string;
  port?: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

// Logging types
export interface LogLevel {
  ERROR: "error";
  WARN: "warn";
  INFO: "info";
  DEBUG: "debug";
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
