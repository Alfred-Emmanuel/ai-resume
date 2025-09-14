// Application constants

export const API_BASE_URL = "http://localhost:3001/api/v1";

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  ALLOWED_EXTENSIONS: [".pdf", ".docx", ".doc"],
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const UI = {
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
} as const;

export const MESSAGES = {
  UPLOAD_SUCCESS: "Resume uploaded successfully!",
  UPLOAD_ERROR: "Failed to upload resume. Please try again.",
  LOADING_RESUMES: "Loading resumes...",
  NO_RESUMES: "No resumes uploaded yet.",
  EMAIL_VERIFICATION_SENT: "Verification email sent! Check your inbox.",
  EMAIL_VERIFICATION_FAILED:
    "Failed to send verification email. Please try again.",
  LOGOUT_SUCCESS: "Logged out successfully",
  LOGOUT_ERROR: "Failed to logout. Please try again.",
} as const;

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
} as const;
