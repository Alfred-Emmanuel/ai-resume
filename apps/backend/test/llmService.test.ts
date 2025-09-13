import { describe, it, expect } from "vitest";
import {
  createLLMService,
  ResumeData,
  JobData,
} from "../src/services/llmService.js";

describe("LLM Service", () => {
  const sampleResumeData: ResumeData = {
    contact: {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1-555-0123",
      location: "San Francisco, CA",
    },
    summary:
      "Experienced software engineer with 5 years of experience in full-stack development.",
    experience: [
      {
        company: "Tech Corp",
        position: "Senior Software Engineer",
        startDate: "2020-01",
        endDate: "2024-01",
        description: [
          "Developed and maintained web applications using React and Node.js",
          "Led a team of 3 developers on multiple projects",
          "Implemented CI/CD pipelines and automated testing",
        ],
      },
    ],
    education: [
      {
        institution: "University of California",
        degree: "Bachelor of Science",
        field: "Computer Science",
        graduationDate: "2019-05",
      },
    ],
    skills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
  };

  const sampleJobData: JobData = {
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    description:
      "We are looking for a full-stack developer with experience in React, Node.js, and cloud technologies. The ideal candidate should have strong problem-solving skills and experience with modern web development practices.",
    requirements: ["React", "Node.js", "JavaScript", "AWS", "Problem-solving"],
    responsibilities: [
      "Develop web applications",
      "Collaborate with team",
      "Deploy to cloud",
    ],
  };

  it("should create stub LLM service by default", () => {
    const service = createLLMService();
    expect(service).toBeDefined();
  });

  it("should generate resume with stub service", async () => {
    const service = createLLMService();
    const result = await service.generateResume(
      sampleResumeData,
      sampleJobData
    );

    expect(result).toBeDefined();
    expect(result.generatedText).toBeDefined();
    expect(result.generatedText).toContain("John Doe");
    expect(result.generatedText).toContain("Tech Corp");
    expect(result.diff).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
  });

  it("should generate cover letter with stub service", async () => {
    const service = createLLMService();
    const result = await service.generateCoverLetter(
      sampleResumeData,
      sampleJobData
    );

    expect(result).toBeDefined();
    expect(result.generatedText).toBeDefined();
    expect(result.generatedText).toContain("John Doe");
    expect(result.generatedText).toContain("StartupXYZ");
    expect(result.generatedText).toContain("Full Stack Developer");
    expect(result.diff).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
  });

  it("should include relevant keywords in generated content", async () => {
    const service = createLLMService();
    const result = await service.generateResume(
      sampleResumeData,
      sampleJobData
    );

    // The stub service should enhance content with job keywords
    expect(result.generatedText.toLowerCase()).toMatch(
      /react|node\.js|javascript|aws/
    );
  });

  it("should maintain factual accuracy in generated content", async () => {
    const service = createLLMService();
    const result = await service.generateResume(
      sampleResumeData,
      sampleJobData
    );

    // Should not invent new companies or dates
    expect(result.generatedText).toContain("Tech Corp");
    expect(result.generatedText).toContain("2020-01");
    expect(result.generatedText).toContain("2024-01");
    expect(result.generatedText).toContain("University of California");
  });
});
