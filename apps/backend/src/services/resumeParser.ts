import { ExtractedText, ParsedResume } from "./textExtraction.js";
import { Logger } from "../utils/logger.js";

export class ResumeParserService {
  /**
   * Parse extracted text into structured resume data
   */
  async parseResume(extractedText: ExtractedText): Promise<ParsedResume> {
    Logger.info("Parsing resume text into structured data");

    const text = extractedText.text;
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed: ParsedResume = {
      contact: {},
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
    };

    try {
      // Parse contact information
      parsed.contact = this.parseContactInfo(text, lines);

      // Parse summary/objective
      parsed.summary = this.parseSummary(text, lines);

      // Parse experience
      parsed.experience = this.parseExperience(text, lines);

      // Parse education
      parsed.education = this.parseEducation(text, lines);

      // Parse skills
      parsed.skills = this.parseSkills(text, lines);

      // Parse certifications
      parsed.certifications = this.parseCertifications(text, lines);

      // Parse projects
      parsed.projects = this.parseProjects(text, lines);

      // Parse languages
      parsed.languages = this.parseLanguages(text, lines);

      Logger.info("Resume parsing completed", {
        hasContact: Object.keys(parsed.contact).length > 0,
        hasSummary: !!parsed.summary,
        experienceCount: parsed.experience.length,
        educationCount: parsed.education.length,
        skillsCount: parsed.skills.length,
        certificationsCount: parsed.certifications?.length || 0,
        projectsCount: parsed.projects?.length || 0,
        languagesCount: parsed.languages?.length || 0,
      });

      return parsed;
    } catch (error) {
      Logger.error("Error parsing resume", { error });
      throw new Error(
        `Resume parsing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private parseContactInfo(
    text: string,
    lines: string[]
  ): ParsedResume["contact"] {
    const contact: ParsedResume["contact"] = {};

    // Email pattern - improved to avoid concatenation with URLs
    const emailMatch = text.match(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}(?![a-zA-Z])/g
    );
    if (emailMatch) {
      // Take the first valid email and clean it
      contact.email = emailMatch[0].replace(/[^a-zA-Z0-9@._-]/g, "");
    }

    // Phone patterns (various formats)
    const phonePatterns = [
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    ];

    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch) {
        contact.phone = phoneMatch[0];
        break;
      }
    }

    // LinkedIn URL
    const linkedinMatch = text.match(
      /https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-]+\/?/
    );
    if (linkedinMatch) {
      contact.linkedin = linkedinMatch[0];
    }

    // Website URL (excluding LinkedIn)
    const websiteMatch = text.match(/https?:\/\/(?!www\.linkedin\.com)[^\s]+/);
    if (websiteMatch) {
      contact.website = websiteMatch[0];
    }

    // Name (usually first line or after "Name:" label)
    const namePatterns = [
      /^Name:\s*(.+)$/i,
      /^(.+)$/, // First line if no label
    ];

    for (const pattern of namePatterns) {
      const nameMatch = lines[0]?.match(pattern);
      if (
        nameMatch &&
        nameMatch[1] &&
        !nameMatch[1].includes("@") &&
        !nameMatch[1].match(/\d/)
      ) {
        contact.name = nameMatch[1].trim();
        break;
      }
    }

    // Location (look for city, state patterns)
    const locationPatterns = [
      /^Location:\s*(.+)$/i,
      /^Address:\s*(.+)$/i,
      /^([A-Za-z\s]+,\s*[A-Z]{2})$/,
    ];

    for (const pattern of locationPatterns) {
      const locationMatch = text.match(pattern);
      if (locationMatch) {
        contact.location = locationMatch[1].trim();
        break;
      }
    }

    return contact;
  }

  private parseSummary(text: string, lines: string[]): string | undefined {
    const summaryKeywords = [
      "summary",
      "objective",
      "profile",
      "about",
      "overview",
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some((keyword) => line.includes(keyword))) {
        // Look for content in the next few lines
        let summary = "";
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j] && !this.isSectionHeader(lines[j])) {
            summary += lines[j] + " ";
          } else {
            break;
          }
        }
        return summary.trim() || undefined;
      }
    }

    return undefined;
  }

  private parseExperience(
    text: string,
    lines: string[]
  ): ParsedResume["experience"] {
    const experience: ParsedResume["experience"] = [];
    const experienceKeywords = [
      "experience",
      "employment",
      "work history",
      "career",
      "professional experience",
    ];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      // Look for experience section header (case insensitive, exact match or starts with)
      if (
        experienceKeywords.some(
          (keyword) =>
            line === keyword ||
            line.startsWith(keyword + " ") ||
            line.startsWith(keyword + "\n")
        )
      ) {
        startIndex = i;
        Logger.debug("Found experience section", { line: lines[i], index: i });
        break;
      }
    }

    if (startIndex === -1) return experience;

    // Parse experience entries
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip if we hit another major section
      if (
        this.isSectionHeader(line) &&
        !experienceKeywords.some((keyword) =>
          line.toLowerCase().includes(keyword)
        )
      ) {
        break;
      }

      // Look for job title patterns - improved to handle more formats
      const jobPatterns = [
        // Pattern: "Position - Company (Date - Date)" or "Position - Company (Date - Present)"
        /^(.+?)\s*-\s*(.+?)\s*\((\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})\)/,
        // Pattern: "Position at Company (Date - Date)" or "Position at Company (Date - Present)"
        /^(.+?)\s*at\s*(.+?)\s*\((\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})\)/,
        // Pattern: "Position, Company (Date - Date)" or "Position, Company (Date - Present)"
        /^(.+?)\s*,\s*(.+?)\s*\((\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})\)/,
        // Pattern: "Position - Company Date - Date" or "Position - Company Date - Present"
        /^(.+?)\s*-\s*(.+?)\s*(\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})/,
        // Pattern: "Position at Company Date - Date" or "Position at Company Date - Present"
        /^(.+?)\s*at\s*(.+?)\s*(\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})/,
        // Pattern: "Position, Company Date - Date" or "Position, Company Date - Present"
        /^(.+?)\s*,\s*(.+?)\s*(\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})/,
      ];

      for (const pattern of jobPatterns) {
        const match = line.match(pattern);
        if (match) {
          const entry = {
            position: match[1].trim(),
            company: match[2].trim().replace(/\s*-\s*$/, ""), // Remove trailing dash
            startDate: match[3].trim(),
            endDate: match[4] === "Present" ? undefined : match[4].trim(),
            current: match[4] === "Present",
            description: "",
            achievements: [] as string[],
          };

          // Collect description from following lines
          let j = i + 1;
          while (
            j < lines.length &&
            !this.isSectionHeader(lines[j]) &&
            !lines[j].match(jobPatterns[0])
          ) {
            if (lines[j].trim()) {
              if (
                lines[j].startsWith("•") ||
                lines[j].startsWith("-") ||
                lines[j].startsWith("*")
              ) {
                entry.achievements.push(
                  lines[j].replace(/^[•\-*]\s*/, "").trim()
                );
              } else {
                entry.description += lines[j] + " ";
              }
            }
            j++;
          }

          entry.description = entry.description.trim();
          experience.push(entry);
          i = j - 1; // Skip processed lines
          break;
        }
      }
    }

    return experience;
  }

  private parseEducation(
    text: string,
    lines: string[]
  ): ParsedResume["education"] {
    const education: ParsedResume["education"] = [];
    const educationKeywords = [
      "education",
      "academic",
      "qualifications",
      "degrees",
    ];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (educationKeywords.some((keyword) => line.includes(keyword))) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return education;

    // Parse education entries
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip if we hit another major section
      if (
        this.isSectionHeader(line) &&
        !educationKeywords.some((keyword) =>
          line.toLowerCase().includes(keyword)
        )
      ) {
        break;
      }

      // Look for degree patterns
      const degreePatterns = [
        /^(.+?)\s*-\s*(.+?)\s*(\d{4}|\d{1,2}\/\d{4})/,
        /^(.+?)\s*,\s*(.+?)\s*(\d{4}|\d{1,2}\/\d{4})/,
        /^(.+?)\s*(\d{4}|\d{1,2}\/\d{4})/,
      ];

      for (const pattern of degreePatterns) {
        const match = line.match(pattern);
        if (match) {
          const entry = {
            degree: match[1].trim(),
            institution: match[2]?.trim().replace(/\s*-\s*$/, "") || "", // Remove trailing dash
            endDate: match[3]?.trim() || match[2]?.trim(),
            field: undefined as string | undefined,
            location: undefined as string | undefined,
            gpa: undefined as string | undefined,
            achievements: [] as string[],
          };

          // Look for GPA in the same line or next few lines
          const gpaMatch = line.match(/GPA[:\s]*(\d+\.?\d*)/i);
          if (gpaMatch) {
            entry.gpa = gpaMatch[1];
          } else {
            // Check next few lines for GPA
            for (let k = i + 1; k < Math.min(i + 3, lines.length); k++) {
              const gpaLineMatch = lines[k].match(/GPA[:\s]*(\d+\.?\d*)/i);
              if (gpaLineMatch) {
                entry.gpa = gpaLineMatch[1];
                break;
              }
            }
          }

          education.push(entry);
          break;
        }
      }
    }

    return education;
  }

  private parseSkills(text: string, lines: string[]): string[] {
    const skills: string[] = [];
    const skillsKeywords = [
      "skills",
      "technical skills",
      "technologies",
      "competencies",
      "expertise",
    ];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      // Only match if it's a section header (short line) or contains specific patterns
      if (
        skillsKeywords.some((keyword) => line.includes(keyword)) &&
        (line.length < 50 ||
          line.match(
            /^(skills|technical skills|technologies|competencies|expertise)$/
          ))
      ) {
        startIndex = i;
        Logger.debug("Found skills section", { line: lines[i], index: i });
        break;
      }
    }

    if (startIndex === -1) {
      Logger.debug("No skills section found");
      return skills;
    }

    // Parse skills from following lines
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip if we hit another major section (more strict checking)
      if (this.isSectionHeader(line)) {
        const lowerLine = line.toLowerCase();
        // Stop if we hit any other major section
        if (
          lowerLine.includes("experience") ||
          lowerLine.includes("education") ||
          lowerLine.includes("projects") ||
          lowerLine.includes("interests") ||
          lowerLine.includes("certifications") ||
          lowerLine.includes("languages")
        ) {
          break;
        }
      }

      // Skip empty lines and lines that look like URLs or metadata
      if (
        !line.trim() ||
        line.includes("www.") ||
        line.includes("Powered by") ||
        line.length < 2 ||
        /^[^\w\s]+$/.test(line)
      ) {
        continue;
      }

      // Handle categorized skills (e.g., "Programming Languages: JavaScript, TypeScript")
      if (line.includes(":")) {
        const parts = line.split(":");
        if (parts.length >= 2) {
          // Split by commas and semicolons, but preserve hyphens in skill names
          const skillItems = parts[1]
            .split(/[,;|•*]/)
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0 && skill.length < 50); // Filter out very long items
          Logger.debug("Parsing categorized skills", { line, skillItems });
          skills.push(...skillItems);
        }
      } else {
        // For non-categorized skills, split by common separators but be more careful
        const skillItems = line
          .split(/[,;|•*]/)
          .map((skill) => skill.trim())
          .filter(
            (skill) =>
              skill.length > 0 &&
              skill.length < 50 &&
              !skill.toLowerCase().includes("interests") &&
              !skill.toLowerCase().includes("reading")
          ); // Filter out obvious non-skills
        if (skillItems.length > 0) {
          Logger.debug("Parsing non-categorized skills", { line, skillItems });
          skills.push(...skillItems);
        }
      }
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  private parseCertifications(
    text: string,
    lines: string[]
  ): ParsedResume["certifications"] {
    const certifications: ParsedResume["certifications"] = [];
    const certKeywords = [
      "certifications",
      "certificates",
      "licenses",
      "credentials",
    ];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (certKeywords.some((keyword) => line.includes(keyword))) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return certifications;

    // Parse certifications from following lines
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip if we hit another major section
      if (
        this.isSectionHeader(line) &&
        !certKeywords.some((keyword) => line.toLowerCase().includes(keyword))
      ) {
        break;
      }

      if (line.trim()) {
        const cert = {
          name: line.trim(),
          issuer: undefined as string | undefined,
          date: undefined as string | undefined,
          expiryDate: undefined as string | undefined,
        };

        // Look for issuer and date patterns
        const issuerMatch = line.match(
          /^(.+?)\s*-\s*(.+?)\s*(\d{4}|\d{1,2}\/\d{4})/
        );
        if (issuerMatch) {
          cert.name = issuerMatch[1].trim();
          cert.issuer = issuerMatch[2].trim().replace(/\s*-\s*$/, ""); // Remove trailing dash
          cert.date = issuerMatch[3].trim();
        }

        certifications.push(cert);
      }
    }

    return certifications;
  }

  private parseProjects(
    text: string,
    lines: string[]
  ): ParsedResume["projects"] {
    const projects: ParsedResume["projects"] = [];
    const projectKeywords = ["projects", "portfolio", "personal projects"];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      // Look for projects section header (case insensitive, exact match or starts with)
      if (
        projectKeywords.some(
          (keyword) =>
            line === keyword ||
            line.startsWith(keyword + " ") ||
            line.startsWith(keyword + "\n")
        )
      ) {
        startIndex = i;
        Logger.debug("Found projects section", { line: lines[i], index: i });
        break;
      }
    }

    if (startIndex === -1) return projects;

    // Parse projects from following lines
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip if we hit another major section
      if (
        this.isSectionHeader(line) &&
        !projectKeywords.some((keyword) => line.toLowerCase().includes(keyword))
      ) {
        break;
      }

      // Skip empty lines and lines that look like descriptions
      if (
        !line.trim() ||
        line.trim().startsWith("Built") ||
        line.trim().startsWith("Developed") ||
        line.trim().startsWith("Features") ||
        line.includes("www.") ||
        line.includes("Powered by")
      ) {
        continue;
      }

      // Look for project patterns with dates
      const projectPatterns = [
        // Pattern: "Project Name (Date - Date)" or "Project Name (Date - Present)"
        /^(.+?)\s*\((\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})\)/,
        // Pattern: "Project Name - Date - Date" or "Project Name - Date - Present"
        /^(.+?)\s*-\s*(\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(Present|\d{1,2}\/\d{4}|\d{4})/,
        // Pattern: "Project Name (OpenSource Contribution)" or similar
        /^(.+?)\s*\((.+?)\)/,
      ];

      let projectFound = false;
      for (const pattern of projectPatterns) {
        const match = line.match(pattern);
        if (match) {
          const project = {
            name: match[1].trim(),
            description: undefined as string | undefined,
            technologies: undefined as string[] | undefined,
            url: undefined as string | undefined,
            startDate: match[2] || undefined,
            endDate: match[3] === "Present" ? undefined : match[3] || undefined,
          };

          // Look for URL in the line
          const urlMatch = line.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            project.url = urlMatch[0];
          }

          projects.push(project);
          projectFound = true;
          break;
        }
      }

      // If no pattern matched but line looks like a project name (short and not a description)
      if (
        !projectFound &&
        line.trim() &&
        line.length < 100 &&
        !line.toLowerCase().includes("developed") &&
        !line.toLowerCase().includes("built") &&
        !line.toLowerCase().includes("features")
      ) {
        const project = {
          name: line.trim(),
          description: undefined as string | undefined,
          technologies: undefined as string[] | undefined,
          url: undefined as string | undefined,
          startDate: undefined as string | undefined,
          endDate: undefined as string | undefined,
        };

        // Look for URL and separate it from the name
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          project.url = urlMatch[0];
          project.name = line
            .replace(urlMatch[0], "")
            .trim()
            .replace(/\s*-\s*$/, "");
        }

        projects.push(project);
      }
    }

    return projects;
  }

  private parseLanguages(
    text: string,
    lines: string[]
  ): ParsedResume["languages"] {
    const languages: ParsedResume["languages"] = [];
    const languageKeywords = ["languages", "language skills"];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (languageKeywords.some((keyword) => line.includes(keyword))) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return languages;

    // Parse languages from following lines
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip if we hit another major section
      if (
        this.isSectionHeader(line) &&
        !languageKeywords.some((keyword) =>
          line.toLowerCase().includes(keyword)
        )
      ) {
        break;
      }

      if (line.trim()) {
        const language = {
          language: line.trim(),
          proficiency: undefined as string | undefined,
        };

        // Look for proficiency level
        const proficiencyMatch = line.match(/^(.+?)\s*[-–]\s*(.+)$/);
        if (proficiencyMatch) {
          language.language = proficiencyMatch[1].trim();
          language.proficiency = proficiencyMatch[2].trim();
        }

        languages.push(language);
      }
    }

    return languages;
  }

  private isSectionHeader(line: string): boolean {
    const sectionHeaders = [
      "experience",
      "employment",
      "work history",
      "career",
      "education",
      "academic",
      "qualifications",
      "skills",
      "technical skills",
      "technologies",
      "certifications",
      "certificates",
      "licenses",
      "projects",
      "portfolio",
      "languages",
      "language skills",
      "summary",
      "objective",
      "profile",
      "about",
      "contact",
      "personal information",
    ];

    const lowerLine = line.toLowerCase();
    return (
      sectionHeaders.some((header) => lowerLine.includes(header)) &&
      line.length < 50
    );
  }
}

// Export singleton instance
export const resumeParserService = new ResumeParserService();
