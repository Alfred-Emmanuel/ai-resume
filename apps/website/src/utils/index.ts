// Utility functions

import { FILE_UPLOAD } from "../constants";

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getFileTypeFromKey = (fileKey: string): string => {
  const extension = fileKey.split(".").pop()?.toUpperCase();
  switch (extension) {
    case "PDF":
      return "PDF";
    case "DOCX":
      return "DOCX";
    case "DOC":
      return "DOC";
    default:
      return "Unknown";
  }
};

export const validateFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const { MAX_SIZE, ALLOWED_TYPES } = FILE_UPLOAD;

  if (!ALLOWED_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: "Please select a PDF or DOCX file.",
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: "File size must be less than 10MB.",
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
