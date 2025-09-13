import { Logger } from "../utils/logger.js";
export class SimpleResumeParser {
    /**
     * Parse resume into raw text sections
     */
    parseResume(text) {
        Logger.info("Starting simple resume parsing");
        const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        const sections = {};
        let currentSection = "other";
        let currentContent = [];
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
            }
            else {
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
    detectSectionHeader(line) {
        // Contact information patterns
        if (line.includes("contact") ||
            line.includes("personal information") ||
            line.includes("name:") ||
            line.includes("email:") ||
            line.includes("phone:")) {
            return "contact";
        }
        // Summary/Objective patterns
        if (line.includes("summary") ||
            line.includes("objective") ||
            line.includes("profile") ||
            line.includes("about") ||
            line.includes("overview")) {
            return "summary";
        }
        // Experience patterns
        if (line.includes("experience") ||
            line.includes("employment") ||
            line.includes("work history") ||
            line.includes("career") ||
            line.includes("professional experience")) {
            return "experience";
        }
        // Education patterns
        if (line.includes("education") ||
            line.includes("academic") ||
            line.includes("qualifications") ||
            line.includes("degrees")) {
            return "education";
        }
        // Skills patterns
        if (line.includes("skills") ||
            line.includes("technical skills") ||
            line.includes("technologies") ||
            line.includes("competencies") ||
            line.includes("expertise")) {
            return "skills";
        }
        // Projects patterns
        if (line.includes("projects") ||
            line.includes("portfolio") ||
            line.includes("personal projects") ||
            line.includes("work samples")) {
            return "projects";
        }
        // Certifications patterns
        if (line.includes("certifications") ||
            line.includes("certificates") ||
            line.includes("licenses") ||
            line.includes("credentials")) {
            return "certifications";
        }
        // Languages patterns
        if (line.includes("languages") ||
            line.includes("language skills") ||
            line.includes("linguistic")) {
            return "languages";
        }
        // Interests patterns
        if (line.includes("interests") ||
            line.includes("hobbies") ||
            line.includes("activities") ||
            line.includes("personal interests")) {
            return "interests";
        }
        return null;
    }
}
// Export singleton instance
export const simpleResumeParser = new SimpleResumeParser();
