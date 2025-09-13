// Shared types for the website application

export interface Resume {
  id: string;
  user_id: string;
  file_key: string;
  canonical_json?: any;
  created_at: string;
  updated_at: string;
}

export interface User {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  resume_id: string;
  message: string;
}

export interface FileUploadState {
  uploading: boolean;
  message: string;
  error?: string;
}

export interface ResumeListState {
  resumes: Resume[];
  loading: boolean;
  error?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  loading: boolean;
}

// UI component props
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
}

export interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}
