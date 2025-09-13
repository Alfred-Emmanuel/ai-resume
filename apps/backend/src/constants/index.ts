// Application constants

export const API = {
  BASE_PATH: "/api/v1",
  PORT: process.env.PORT || 5000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  ALLOWED_EXTENSIONS: [".pdf", ".docx", ".doc"],
} as const;

export const DATABASE = {
  CONNECTION_STRING:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || "postgres"}:${
      process.env.DB_PASS || "postgres"
    }@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${
      process.env.DB_NAME || "resume_app"
    }`,
  SSL: process.env.NODE_ENV === "production",
} as const;

export const FIREBASE = {
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "",
} as const;

export const STORAGE = {
  TYPE: (process.env.STORAGE_TYPE as "minio" | "s3") || "minio",
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "localhost",
  MINIO_PORT: parseInt(process.env.MINIO_PORT || "9000"),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === "true",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minio",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || "minio123",
  MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || "ai-resume-files",
} as const;

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID_REGEX:
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

export const ERROR_MESSAGES = {
  // Authentication errors
  NO_TOKEN: "No token provided",
  INVALID_TOKEN: "Invalid token",
  USER_NOT_FOUND: "User not found",
  USER_NOT_AUTHENTICATED: "User not authenticated",

  // File upload errors
  NO_FILE_UPLOADED: "No file uploaded",
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_TOO_LARGE: "File size exceeds limit",

  // Resource errors
  RESUME_NOT_FOUND: "Resume not found",
  JOB_NOT_FOUND: "Job not found",
  GENERATION_NOT_FOUND: "Generation not found",
  ACCESS_DENIED: "Access denied",

  // Server errors
  INTERNAL_ERROR: "Internal server error",
  DATABASE_ERROR: "Database error",
  STORAGE_ERROR: "Storage error",
  VALIDATION_ERROR: "Validation error",
} as const;

export const SUCCESS_MESSAGES = {
  RESUME_UPLOADED: "Resume uploaded successfully",
  RESUME_DELETED: "Resume deleted successfully",
  USER_CREATED: "User created successfully",
  TOKEN_VERIFIED: "Token verified successfully",
} as const;

export const LLM = {
  PROVIDER:
    (process.env.LLM_PROVIDER as
      | "openai"
      | "anthropic"
      | "deepseek"
      | "stub") || "stub",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  MAX_TOKENS: parseInt(process.env.LLM_MAX_TOKENS || "4000"),
  TEMPERATURE: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
