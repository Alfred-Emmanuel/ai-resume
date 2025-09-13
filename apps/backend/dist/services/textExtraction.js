import pdf from "pdf-parse";
import mammoth from "mammoth";
import { Logger } from "../utils/logger.js";
export class TextExtractionService {
    /**
     * Extract text from PDF using pdf-parse (faster, simpler)
     */
    async extractFromPDFSimple(buffer) {
        try {
            Logger.info("Extracting text from PDF using pdf-parse");
            const data = await pdf(buffer);
            return {
                text: data.text,
                metadata: {
                    pages: data.numpages,
                    wordCount: data.text.split(/\s+/).length,
                    characterCount: data.text.length,
                },
            };
        }
        catch (error) {
            Logger.error("Error extracting text from PDF with pdf-parse", { error });
            throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Extract text from PDF using pdf-parse (alternative method)
     */
    async extractFromPDFAlternative(buffer) {
        try {
            Logger.info("Extracting text from PDF using pdf-parse alternative method");
            const data = await pdf(buffer, {
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
        }
        catch (error) {
            Logger.error("Error extracting text from PDF with pdf-parse alternative", { error });
            throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Extract text from DOCX using mammoth
     */
    async extractFromDOCX(buffer) {
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
        }
        catch (error) {
            Logger.error("Error extracting text from DOCX with mammoth", { error });
            throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Extract text from DOCX using mammoth with additional options
     */
    async extractFromDOCXAdvanced(buffer) {
        try {
            Logger.info("Extracting text from DOCX using mammoth with advanced options");
            const result = await mammoth.extractRawText({ buffer });
            return {
                text: result.value,
                metadata: {
                    wordCount: result.value.split(/\s+/).length,
                    characterCount: result.value.length,
                },
            };
        }
        catch (error) {
            Logger.error("Error extracting text from DOCX with mammoth advanced", {
                error,
            });
            throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Extract text from file based on content type
     */
    async extractText(buffer, contentType) {
        Logger.info("Extracting text from file", { contentType });
        try {
            if (contentType === "application/pdf") {
                // Try pdf-parse with advanced options first, fallback to simple method
                try {
                    return await this.extractFromPDFAlternative(buffer);
                }
                catch (error) {
                    Logger.warn("pdf-parse advanced failed, falling back to simple method", { error });
                    return await this.extractFromPDFSimple(buffer);
                }
            }
            else if (contentType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                // Try mammoth with advanced options first, fallback to simple method
                try {
                    return await this.extractFromDOCXAdvanced(buffer);
                }
                catch (error) {
                    Logger.warn("mammoth advanced failed, falling back to simple method", { error });
                    return await this.extractFromDOCX(buffer);
                }
            }
            else {
                throw new Error(`Unsupported content type: ${contentType}`);
            }
        }
        catch (error) {
            Logger.error("Text extraction failed", { error, contentType });
            throw error;
        }
    }
}
// Export singleton instance
export const textExtractionService = new TextExtractionService();
