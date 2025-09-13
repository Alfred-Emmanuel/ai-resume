import { Logger } from "../utils/logger.js";

export interface PDFParseResponse {
  text: string;
  pages: Array<{
    page_number: number;
    text: string;
  }>;
  metadata: {
    page_count: number;
    filename: string;
    file_size: number;
  };
}

export interface PDFParseTextOnlyResponse {
  text: string;
  page_count: number;
  filename: string;
}

export class PDFParserService {
  private baseUrl: string;

  constructor(
    baseUrl: string = process.env.PDF_PARSER_SERVICE_URL ||
      "http://localhost:8000"
  ) {
    this.baseUrl = baseUrl;
  }

  /**
   * Parse PDF using the Python FastAPI service
   * @param buffer PDF file buffer
   * @param filename Original filename
   * @returns Parsed PDF data with page-by-page breakdown
   */
  async parsePDF(buffer: Buffer, filename: string): Promise<PDFParseResponse> {
    try {
      Logger.info("Sending PDF to Python parser service", { filename });

      // Create FormData for multipart upload using native FormData
      const formData = new FormData();

      // Create a Blob from the buffer
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/pdf",
      });
      formData.append("file", blob, filename);

      // Make request to Python service
      const response = await fetch(`${this.baseUrl}/parse`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error("PDF parser service error", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `PDF parser service failed: ${response.status} ${response.statusText}`
        );
      }

      const result: PDFParseResponse = await response.json();

      Logger.info("PDF parsing completed successfully", {
        filename,
        pageCount: result.metadata.page_count,
        textLength: result.text.length,
      });

      return result;
    } catch (error) {
      Logger.error("Failed to parse PDF with Python service", {
        filename,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Parse PDF and return only the full text (simplified version)
   * @param buffer PDF file buffer
   * @param filename Original filename
   * @returns Simple response with extracted text
   */
  async parsePDFTextOnly(
    buffer: Buffer,
    filename: string
  ): Promise<PDFParseTextOnlyResponse> {
    try {
      Logger.info("Sending PDF to Python parser service (text-only)", {
        filename,
      });

      // Create FormData for multipart upload using native FormData
      const formData = new FormData();

      // Create a Blob from the buffer
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/pdf",
      });
      formData.append("file", blob, filename);

      // Make request to Python service
      const response = await fetch(`${this.baseUrl}/parse-text-only`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error("PDF parser service error (text-only)", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `PDF parser service failed: ${response.status} ${response.statusText}`
        );
      }

      const result: PDFParseTextOnlyResponse = await response.json();

      Logger.info("PDF parsing completed successfully (text-only)", {
        filename,
        pageCount: result.page_count,
        textLength: result.text.length,
      });

      return result;
    } catch (error) {
      Logger.error("Failed to parse PDF with Python service (text-only)", {
        filename,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Check if the PDF parser service is healthy
   * @returns Promise<boolean> Service health status
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
      });

      return response.ok;
    } catch (error) {
      Logger.warn("PDF parser service health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }
}

// Export singleton instance
export const pdfParserService = new PDFParserService();
