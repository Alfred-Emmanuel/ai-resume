// Dynamic import to avoid initialization issues
import mammoth from "mammoth";
import { Logger } from "../utils/logger.js";
import { pdfParserService } from "./pdfParserService.js";

export interface ExtractedText {
  text: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    characterCount?: number;
    parser?: string;
  };
}

export interface ParsedResume {
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    achievements?: string[];
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency?: string;
  }>;
}

export class TextExtractionService {
  /**
   * Extract text from PDF using pdf-parse (faster, simpler)
   */
  async extractFromPDFSimple(buffer: Buffer): Promise<ExtractedText> {
    try {
      Logger.info("Extracting text from PDF using pdf-parse");

      const pdf = await import("pdf-parse");
      const data = await pdf.default(buffer);

      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          characterCount: data.text.length,
        },
      };
    } catch (error) {
      Logger.error("Error extracting text from PDF with pdf-parse", { error });
      throw new Error(
        `PDF extraction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract text from PDF using pdf-parse (alternative method)
   */
  async extractFromPDFAlternative(buffer: Buffer): Promise<ExtractedText> {
    try {
      Logger.info(
        "Extracting text from PDF using pdf-parse alternative method"
      );

      const pdf = await import("pdf-parse");
      const data = await pdf.default(buffer, {
        // Additional options for better extraction
        max: 0, // No page limit
        version: "v1.10.100", // Use specific version
      });

      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          characterCount: data.text.length,
        },
      };
    } catch (error) {
      Logger.error(
        "Error extracting text from PDF with pdf-parse alternative",
        { error }
      );
      throw new Error(
        `PDF extraction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract text from DOCX using mammoth
   */
  async extractFromDOCX(buffer: Buffer): Promise<ExtractedText> {
    try {
      Logger.info("Extracting text from DOCX using mammoth");

      const result = await mammoth.extractRawText({ buffer });

      return {
        text: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          characterCount: result.value.length,
        },
      };
    } catch (error) {
      Logger.error("Error extracting text from DOCX with mammoth", { error });
      throw new Error(
        `DOCX extraction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract text from DOCX using mammoth with additional options
   */
  async extractFromDOCXAdvanced(buffer: Buffer): Promise<ExtractedText> {
    try {
      Logger.info(
        "Extracting text from DOCX using mammoth with advanced options"
      );

      const result = await mammoth.extractRawText({ buffer });

      return {
        text: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          characterCount: result.value.length,
        },
      };
    } catch (error) {
      Logger.error("Error extracting text from DOCX with mammoth advanced", {
        error,
      });
      throw new Error(
        `DOCX extraction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract text from file based on content type
   */
  async extractText(
    buffer: Buffer,
    contentType: string,
    filename?: string
  ): Promise<ExtractedText> {
    Logger.info("Extracting text from file", { contentType, filename });

    try {
      if (contentType === "application/pdf") {
        // Try Python PyMuPDF service first for better accuracy
        try {
          const isHealthy = await pdfParserService.isHealthy();
          if (isHealthy) {
            Logger.info("Using Python PyMuPDF service for PDF parsing");
            const result = await pdfParserService.parsePDFTextOnly(
              buffer,
              filename || "document.pdf"
            );

            return {
              text: result.text,
              metadata: {
                pages: result.page_count,
                wordCount: result.text.split(/\s+/).length,
                characterCount: result.text.length,
                parser: "PyMuPDF",
              },
            };
          } else {
            Logger.warn(
              "Python PDF parser service is not available, falling back to pdf-parse"
            );
          }
        } catch (error) {
          Logger.warn(
            "Python PDF parser service failed, falling back to pdf-parse",
            { error }
          );
        }

        // Fallback to pdf-parse
        try {
          return await this.extractFromPDFAlternative(buffer);
        } catch (error) {
          Logger.warn(
            "pdf-parse advanced failed, falling back to simple method",
            { error }
          );
          return await this.extractFromPDFSimple(buffer);
        }
      } else if (
        contentType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // Try mammoth with advanced options first, fallback to simple method
        try {
          return await this.extractFromDOCXAdvanced(buffer);
        } catch (error) {
          Logger.warn(
            "mammoth advanced failed, falling back to simple method",
            { error }
          );
          return await this.extractFromDOCX(buffer);
        }
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      Logger.error("Text extraction failed", { error, contentType });
      throw error;
    }
  }
}

// Export singleton instance
export const textExtractionService = new TextExtractionService();
