export type UUID = string;

export interface UserProfile {
  id: UUID;
  email: string;
  name?: string;
  rolePreferences?: string[];
  locationPreference?: string;
  skills?: string[];
}

export interface ResumeDocument {
  id: UUID;
  userId: UUID;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface JobPosting {
  id: UUID;
  title: string;
  company?: string;
  location?: string;
  source?: "linkedin" | "indeed" | "other";
  rawText: string;
  capturedAt: string;
}

export interface GenerationOptions {
  format: "pdf" | "docx";
  includeCoverLetter?: boolean;
}

export interface GenerationRequest {
  user_id: UUID;
  resume_id: UUID;
  job_id: UUID;
  options: GenerationOptions;
}

export interface GenerationResponse {
  generation_id: UUID;
  status: "queued" | "processing" | "ready" | "failed";
  estimated_size_kb?: number;
  downloadUrl?: string;
}
