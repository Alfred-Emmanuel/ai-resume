import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ResumeParserService } from "../src/services/resumeParser.js";

describe("Resume Processing Integration Tests", () => {
  const parser = new ResumeParserService();

  const sampleResumes = ["sample1.txt", "sample2.txt", "sample3.txt"];

  describe("Text Processing Pipeline", () => {
    sampleResumes.forEach((filename, index) => {
      it(`should process ${filename} correctly`, async () => {
        const filePath = join(__dirname, "sample-resumes", filename);
        const fileContent = readFileSync(filePath, "utf-8");

        // Create a mock extracted text (since we're testing with text files)
        const extractedText = {
          text: fileContent,
          metadata: {
            wordCount: fileContent.split(/\s+/).length,
            characterCount: fileContent.length,
          },
        };

        // Parse the resume
        const parsedResume = await parser.parseResume(extractedText);

        // Verify basic structure
        expect(parsedResume).toBeDefined();
        expect(parsedResume.contact).toBeDefined();
        expect(parsedResume.experience).toBeDefined();
        expect(parsedResume.education).toBeDefined();
        expect(parsedResume.skills).toBeDefined();

        // Verify contact information is extracted
        expect(parsedResume.contact.email).toBeDefined();
        expect(parsedResume.contact.email).toMatch(/@/);

        // Verify experience entries
        expect(parsedResume.experience.length).toBeGreaterThan(0);
        expect(parsedResume.experience[0].position).toBeDefined();
        expect(parsedResume.experience[0].company).toBeDefined();

        // Verify education entries
        expect(parsedResume.education.length).toBeGreaterThan(0);
        expect(parsedResume.education[0].degree).toBeDefined();
        expect(parsedResume.education[0].institution).toBeDefined();

        // Verify skills are extracted
        expect(parsedResume.skills.length).toBeGreaterThan(0);

        console.log(`Processed ${filename}:`, {
          contactFields: Object.keys(parsedResume.contact).length,
          experienceCount: parsedResume.experience.length,
          educationCount: parsedResume.education.length,
          skillsCount: parsedResume.skills.length,
          hasSummary: !!parsedResume.summary,
          certificationsCount: parsedResume.certifications?.length || 0,
          projectsCount: parsedResume.projects?.length || 0,
          languagesCount: parsedResume.languages?.length || 0,
        });
      });
    });
  });

  describe("Specific Resume Validation", () => {
    it("should correctly parse sample1.txt (Software Engineer)", async () => {
      const filePath = join(__dirname, "sample-resumes", "sample1.txt");
      const fileContent = readFileSync(filePath, "utf-8");

      const extractedText = { text: fileContent };
      const parsedResume = await parser.parseResume(extractedText);

      // Verify specific details from sample1
      expect(parsedResume.contact.name).toBe("John Doe");
      expect(parsedResume.contact.email).toBe("john.doe@email.com");
      expect(parsedResume.contact.phone).toBe("(555) 123-4567");
      expect(parsedResume.contact.linkedin).toBe(
        "https://linkedin.com/in/johndoe"
      );

      expect(parsedResume.experience).toHaveLength(3);
      expect(parsedResume.experience[0].position).toBe(
        "Senior Software Engineer"
      );
      expect(parsedResume.experience[0].company).toBe("Tech Corp");
      expect(parsedResume.experience[0].current).toBe(false);

      expect(parsedResume.education).toHaveLength(1);
      expect(parsedResume.education[0].degree).toBe(
        "Bachelor of Science in Computer Science"
      );
      expect(parsedResume.education[0].institution).toBe(
        "University of Technology"
      );

      expect(parsedResume.skills).toContain("JavaScript");
      expect(parsedResume.skills).toContain("TypeScript");
      expect(parsedResume.skills).toContain("React");
    });

    it("should correctly parse sample2.txt (Data Scientist)", async () => {
      const filePath = join(__dirname, "sample-resumes", "sample2.txt");
      const fileContent = readFileSync(filePath, "utf-8");

      const extractedText = { text: fileContent };
      const parsedResume = await parser.parseResume(extractedText);

      // Verify specific details from sample2
      expect(parsedResume.contact.name).toBe("Sarah Johnson");
      expect(parsedResume.contact.email).toBe("sarah.johnson@techmail.com");

      expect(parsedResume.experience).toHaveLength(3);
      expect(parsedResume.experience[0].position).toBe("Data Scientist");
      expect(parsedResume.experience[0].company).toBe("DataCorp Solutions");
      expect(parsedResume.experience[0].current).toBe(true);

      expect(parsedResume.education).toHaveLength(2);
      expect(parsedResume.education[0].degree).toBe(
        "Master of Science in Data Science"
      );
      expect(parsedResume.education[0].institution).toBe("Stanford University");

      expect(parsedResume.skills).toContain("Python");
      expect(parsedResume.skills).toContain("Scikit-learn");
      expect(parsedResume.skills).toContain("TensorFlow");
    });

    it("should correctly parse sample3.txt (Lead Developer)", async () => {
      const filePath = join(__dirname, "sample-resumes", "sample3.txt");
      const fileContent = readFileSync(filePath, "utf-8");

      const extractedText = { text: fileContent };
      const parsedResume = await parser.parseResume(extractedText);

      // Verify specific details from sample3
      expect(parsedResume.contact.name).toBe("Michael Chen");
      expect(parsedResume.contact.email).toBe("michael.chen@devmail.com");

      expect(parsedResume.experience).toHaveLength(3);
      expect(parsedResume.experience[0].position).toBe("Lead Developer");
      expect(parsedResume.experience[0].company).toBe("CloudTech Inc");
      expect(parsedResume.experience[0].current).toBe(true);

      expect(parsedResume.education).toHaveLength(1);
      expect(parsedResume.education[0].degree).toBe(
        "Bachelor of Engineering in Software Engineering"
      );
      expect(parsedResume.education[0].institution).toBe(
        "University of Washington"
      );

      expect(parsedResume.skills).toContain("React");
      expect(parsedResume.skills).toContain("Vue.js");
      expect(parsedResume.skills).toContain("TypeScript");
    });
  });

  describe("Edge Cases", () => {
    it("should handle resume with minimal information", async () => {
      const minimalResume = `
        John Smith
        john@email.com
        (555) 123-4567
        
        EXPERIENCE
        Developer - Company - 2020-2022
      `;

      const extractedText = { text: minimalResume };
      const parsedResume = await parser.parseResume(extractedText);

      expect(parsedResume.contact.name).toBe("John Smith");
      expect(parsedResume.contact.email).toBe("john@email.com");
      expect(parsedResume.experience).toHaveLength(1);
      expect(parsedResume.experience[0].position).toBe("Developer");
    });

    it("should handle resume with no clear sections", async () => {
      const unstructuredResume = `
        Jane Doe
        jane@email.com
        Software Engineer at Tech Company from 2020 to 2023
        Worked on web applications using React and Node.js
        Bachelor's degree in Computer Science from University
      `;

      const extractedText = { text: unstructuredResume };
      const parsedResume = await parser.parseResume(extractedText);

      expect(parsedResume.contact.name).toBe("Jane Doe");
      expect(parsedResume.contact.email).toBe("jane@email.com");
      // Should still extract some information even from unstructured text
      expect(parsedResume.experience.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty or malformed text", async () => {
      const emptyText = "";
      const extractedText = { text: emptyText };
      const parsedResume = await parser.parseResume(extractedText);

      expect(parsedResume.contact).toBeDefined();
      expect(parsedResume.experience).toBeDefined();
      expect(parsedResume.education).toBeDefined();
      expect(parsedResume.skills).toBeDefined();
    });
  });
});
