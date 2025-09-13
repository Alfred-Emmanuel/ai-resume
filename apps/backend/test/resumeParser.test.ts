import { describe, it, expect } from "vitest";
import { ResumeParserService } from "../src/services/resumeParser.js";
import { ExtractedText } from "../src/services/textExtraction.js";

describe("ResumeParserService", () => {
  const parser = new ResumeParserService();

  describe("parseContactInfo", () => {
    it("should extract email, phone, and LinkedIn from text", async () => {
      const sampleText = `
        John Doe
        john.doe@email.com
        (555) 123-4567
        https://linkedin.com/in/johndoe
        New York, NY
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.contact.email).toBe("john.doe@email.com");
      expect(result.contact.phone).toBe("(555) 123-4567");
      expect(result.contact.linkedin).toBe("https://linkedin.com/in/johndoe");
      expect(result.contact.name).toBe("John Doe");
    });

    it("should handle various phone number formats", async () => {
      const phoneFormats = [
        "(555) 123-4567",
        "555-123-4567",
        "555.123.4567",
        "555 123 4567",
        "+1-555-123-4567",
      ];

      for (const phone of phoneFormats) {
        const sampleText = `John Doe\n${phone}\njohn@email.com`;
        const extractedText: ExtractedText = { text: sampleText };
        const result = await parser.parseResume(extractedText);
        expect(result.contact.phone).toBe(phone);
      }
    });
  });

  describe("parseExperience", () => {
    it("should parse work experience entries", async () => {
      const sampleText = `
        John Doe
        john@email.com
        
        EXPERIENCE
        
        Senior Software Engineer - Tech Corp - 2020-2023
        • Led development of microservices architecture
        • Improved system performance by 40%
        • Mentored junior developers
        
        Software Engineer - Startup Inc - 2018-2020
        • Developed REST APIs using Node.js
        • Implemented CI/CD pipelines
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.experience).toHaveLength(2);
      expect(result.experience[0].position).toBe("Senior Software Engineer");
      expect(result.experience[0].company).toBe("Tech Corp");
      expect(result.experience[0].startDate).toBe("2020");
      expect(result.experience[0].endDate).toBe("2023");
      expect(result.experience[0].achievements).toContain(
        "Led development of microservices architecture"
      );
    });

    it("should handle current position", async () => {
      const sampleText = `
        EXPERIENCE
        
        Senior Developer - Current Company - 2022-Present
        • Building scalable web applications
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.experience[0].current).toBe(true);
      expect(result.experience[0].endDate).toBe("Present");
    });
  });

  describe("parseEducation", () => {
    it("should parse education entries", async () => {
      const sampleText = `
        EDUCATION
        
        Bachelor of Science in Computer Science - University of Technology - 2018
        GPA: 3.8/4.0
        
        Master of Science in Software Engineering - Tech University - 2020
        GPA: 3.9/4.0
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.education).toHaveLength(2);
      expect(result.education[0].degree).toBe(
        "Bachelor of Science in Computer Science"
      );
      expect(result.education[0].institution).toBe("University of Technology");
      expect(result.education[0].endDate).toBe("2018");
      expect(result.education[0].gpa).toBe("3.8");
    });
  });

  describe("parseSkills", () => {
    it("should parse skills section", async () => {
      const sampleText = `
        SKILLS
        
        JavaScript, TypeScript, Node.js, React, Python, Java
        AWS, Docker, Kubernetes, PostgreSQL, MongoDB
        Agile, Scrum, Git, CI/CD
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.skills).toContain("JavaScript");
      expect(result.skills).toContain("TypeScript");
      expect(result.skills).toContain("Node.js");
      expect(result.skills).toContain("React");
      expect(result.skills).toContain("AWS");
      expect(result.skills).toContain("Docker");
    });

    it("should remove duplicate skills", async () => {
      const sampleText = `
        SKILLS
        
        JavaScript, TypeScript, JavaScript, React, TypeScript
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      const uniqueSkills = [...new Set(result.skills)];
      expect(result.skills).toEqual(uniqueSkills);
    });
  });

  describe("parseSummary", () => {
    it("should parse summary/objective section", async () => {
      const sampleText = `
        SUMMARY
        
        Experienced software engineer with 5+ years of experience in full-stack development.
        Passionate about building scalable applications and leading technical teams.
        Strong background in JavaScript, Python, and cloud technologies.
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.summary).toContain("Experienced software engineer");
      expect(result.summary).toContain("5+ years of experience");
      expect(result.summary).toContain("full-stack development");
    });
  });

  describe("parseCertifications", () => {
    it("should parse certifications section", async () => {
      const sampleText = `
        CERTIFICATIONS
        
        AWS Certified Solutions Architect - Amazon Web Services - 2022
        Certified Kubernetes Administrator - Cloud Native Computing Foundation - 2021
        Google Cloud Professional Developer - Google - 2020
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.certifications).toHaveLength(3);
      expect(result.certifications![0].name).toBe(
        "AWS Certified Solutions Architect"
      );
      expect(result.certifications![0].issuer).toBe("Amazon Web Services");
      expect(result.certifications![0].date).toBe("2022");
    });
  });

  describe("parseProjects", () => {
    it("should parse projects section", async () => {
      const sampleText = `
        PROJECTS
        
        E-commerce Platform - https://github.com/johndoe/ecommerce
        Built a full-stack e-commerce application using React and Node.js
        
        Task Management App - https://github.com/johndoe/taskapp
        Developed a collaborative task management tool with real-time updates
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.projects).toHaveLength(2);
      expect(result.projects![0].name).toBe("E-commerce Platform");
      expect(result.projects![0].url).toBe(
        "https://github.com/johndoe/ecommerce"
      );
    });
  });

  describe("parseLanguages", () => {
    it("should parse languages section", async () => {
      const sampleText = `
        LANGUAGES
        
        English - Native
        Spanish - Fluent
        French - Intermediate
      `;

      const extractedText: ExtractedText = { text: sampleText };
      const result = await parser.parseResume(extractedText);

      expect(result.languages).toHaveLength(3);
      expect(result.languages![0].language).toBe("English");
      expect(result.languages![0].proficiency).toBe("Native");
      expect(result.languages![1].language).toBe("Spanish");
      expect(result.languages![1].proficiency).toBe("Fluent");
    });
  });

  describe("complex resume parsing", () => {
    it("should parse a complete resume with all sections", async () => {
      const completeResume = `
        John Doe
        john.doe@email.com
        (555) 123-4567
        https://linkedin.com/in/johndoe
        New York, NY
        
        SUMMARY
        
        Experienced software engineer with 5+ years of experience in full-stack development.
        Passionate about building scalable applications and leading technical teams.
        
        EXPERIENCE
        
        Senior Software Engineer - Tech Corp - 2020-2023
        • Led development of microservices architecture
        • Improved system performance by 40%
        • Mentored junior developers
        
        Software Engineer - Startup Inc - 2018-2020
        • Developed REST APIs using Node.js
        • Implemented CI/CD pipelines
        
        EDUCATION
        
        Bachelor of Science in Computer Science - University of Technology - 2018
        GPA: 3.8/4.0
        
        SKILLS
        
        JavaScript, TypeScript, Node.js, React, Python, Java
        AWS, Docker, Kubernetes, PostgreSQL, MongoDB
        
        CERTIFICATIONS
        
        AWS Certified Solutions Architect - Amazon Web Services - 2022
        
        PROJECTS
        
        E-commerce Platform - https://github.com/johndoe/ecommerce
        Built a full-stack e-commerce application using React and Node.js
        
        LANGUAGES
        
        English - Native
        Spanish - Fluent
      `;

      const extractedText: ExtractedText = { text: completeResume };
      const result = await parser.parseResume(extractedText);

      // Verify all sections are parsed
      expect(result.contact.name).toBe("John Doe");
      expect(result.contact.email).toBe("john.doe@email.com");
      expect(result.contact.phone).toBe("(555) 123-4567");
      expect(result.summary).toContain("Experienced software engineer");
      expect(result.experience).toHaveLength(2);
      expect(result.education).toHaveLength(1);
      expect(result.skills.length).toBeGreaterThan(0);
      expect(result.certifications).toHaveLength(1);
      expect(result.projects).toHaveLength(1);
      expect(result.languages).toHaveLength(2);
    });
  });
});
