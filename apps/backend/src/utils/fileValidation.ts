export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  contentType?: string;
}

export const validateResumeFile = (
  file: Express.Multer.File
): FileValidationResult => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size exceeds 10MB limit",
    };
  }

  // Check file type
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ];

  const allowedExtensions = [".pdf", ".docx", ".doc"];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: "Invalid file type. Only PDF and DOCX files are allowed",
    };
  }

  // Check file extension
  const fileExtension = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf("."));
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error:
        "Invalid file extension. Only .pdf, .docx, and .doc files are allowed",
    };
  }

  return {
    isValid: true,
    contentType: file.mimetype,
  };
};

export const getFileExtension = (filename: string): string => {
  return filename.toLowerCase().substring(filename.lastIndexOf("."));
};

export const sanitizeFilename = (filename: string): string => {
  // Remove any potentially dangerous characters
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
};
