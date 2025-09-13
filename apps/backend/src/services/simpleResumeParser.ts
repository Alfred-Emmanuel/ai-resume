import { Logger } from "../utils/logger.js";

export interface RawResumeSections {
  contact?: string;
  summary?: string;
  experience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certifications?: string;
  languages?: string;
  interests?: string;
  other?: string;
  [key: string]: string | undefined;
}

export class SimpleResumeParser {
  /**
   * Parse resume into raw text sections
   */
  parseResume(text: string): RawResumeSections {
    Logger.info("Starting simple resume parsing");

    // Clean the text by removing null characters and other problematic characters
    const cleanedText = text
      .replace(/\u0000/g, "") // Remove null characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove other control characters
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n"); // Normalize line endings

    const lines = cleanedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const sections: RawResumeSections = {};

    let currentSection = "other";
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Check if this line is a section header
      const sectionType = this.detectSectionHeader(lowerLine);

      if (sectionType && sectionType !== currentSection) {
        // Save previous section content
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }

        // Start new section
        currentSection = sectionType;
        currentContent = [];
      } else {
        // Add content to current section
        currentContent.push(line);
      }
    }

    // Save the last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    Logger.info("Simple resume parsing completed", {
      sectionsFound: Object.keys(sections).length,
      sections: Object.keys(sections),
    });

    return sections;
  }

  /**
   * Detect if a line is a section header
   */
  private detectSectionHeader(line: string): string | null {
    // Contact information patterns
    if (
      line.includes("contact") ||
      line.includes("personal information") ||
      line.includes("name:") ||
      line.includes("email:") ||
      line.includes("phone:")
    ) {
      return "contact";
    }

    // Summary/Objective patterns
    if (
      line.includes("summary") ||
      line.includes("objective") ||
      line.includes("profile") ||
      line.includes("about") ||
      line.includes("overview")
    ) {
      return "summary";
    }

    // Experience patterns
    if (
      line.includes("experience") ||
      line.includes("employment") ||
      line.includes("work history") ||
      line.includes("career") ||
      line.includes("professional experience")
    ) {
      return "experience";
    }

    // Education patterns
    if (
      line.includes("education") ||
      line.includes("academic") ||
      line.includes("qualifications") ||
      line.includes("degrees")
    ) {
      return "education";
    }

    // Skills patterns
    if (
      line.includes("skills") ||
      line.includes("technical skills") ||
      line.includes("technologies") ||
      line.includes("competencies") ||
      line.includes("expertise")
    ) {
      return "skills";
    }

    // Projects patterns
    if (
      line.includes("projects") ||
      line.includes("portfolio") ||
      line.includes("personal projects") ||
      line.includes("work samples")
    ) {
      return "projects";
    }

    // Certifications patterns
    if (
      line.includes("certifications") ||
      line.includes("certificates") ||
      line.includes("licenses") ||
      line.includes("credentials")
    ) {
      return "certifications";
    }

    // Languages patterns
    if (
      line.includes("languages") ||
      line.includes("language skills") ||
      line.includes("linguistic")
    ) {
      return "languages";
    }

    // Interests patterns
    if (
      line.includes("interests") ||
      line.includes("hobbies") ||
      line.includes("activities") ||
      line.includes("personal interests")
    ) {
      return "interests";
    }

    return null;
  }
}

// Export singleton instance
export const simpleResumeParser = new SimpleResumeParser();
