import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generationService,
  GenerationRequest,
} from "../src/services/generation.js";
import { db } from "../src/config/database.js";
import { v4 as uuidv4 } from "uuid";

// Mock the LLM service
vi.mock("../src/services/llmService.js", () => ({
  llmService: {
    generateResume: vi.fn(),
    generateCoverLetter: vi.fn(),
  },
}));

// Mock the resume service
vi.mock("../src/services/resume.js", () => ({
  resumeService: {
    getResumeByIdRequired: vi.fn(),
  },
}));

// Mock the job service
vi.mock("../src/services/job.js", () => ({
  jobService: {
    getJobById: vi.fn(),
  },
}));

describe("Generation Service", () => {
  const testUserId = uuidv4();
  const testResumeId = uuidv4();
  const testJobId = uuidv4();

  const mockResume = {
    id: testResumeId,
    user_id: testUserId,
    file_key: "test-file-key",
    canonical_json: {
      contact: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1-555-0123",
        location: "San Francisco, CA",
      },
      summary: "Experienced software engineer with 5 years of experience.",
      experience: [
        {
          company: "Tech Corp",
          position: "Senior Software Engineer",
          startDate: "2020-01",
          endDate: "2024-01",
          description: [
            "Developed web applications using React and Node.js",
            "Led a team of 3 developers",
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
    },
    created_at: new Date("2024-01-01T00:00:00Z"),
    updated_at: new Date("2024-01-01T00:00:00Z"),
  };

  const mockJob = {
    id: testJobId,
    user_id: testUserId,
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    description:
      "We are looking for a full-stack developer with experience in React, Node.js, and cloud technologies.",
    url: "https://example.com/job/123",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockLLMResult = {
    generatedText: "Generated resume content with tailored experience...",
    diff: {
      added: ["Enhanced React experience"],
      removed: [],
      modified: ["Updated skills section"],
    },
    metadata: {
      tokensUsed: 1500,
      model: "gpt-4o-mini",
      processingTimeMs: 2000,
    },
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("generateResume", () => {
    it("should generate resume successfully", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);
      vi.mocked(llmService.generateResume).mockResolvedValue(mockLLMResult);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: {
          preview_only: true,
          format: "pdf",
          includeCoverLetter: false,
        },
      };

      const result = await generationService.generateResume(request);

      expect(result).toBeDefined();
      expect(result.generation_id).toBeDefined();
      expect(result.generated_text).toBe(mockLLMResult.generatedText);
      expect(result.diff).toEqual(mockLLMResult.diff);
      expect(result.metadata.tokensUsed).toBe(1500);
      expect(result.metadata.model).toBe("gpt-4o-mini");
      expect(result.status).toBe("completed");
      expect(result.metadata.hallucinationCheck.passed).toBe(true);
    });

    it("should fail when resume doesn't belong to user", async () => {
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks with different user
      const resumeWithDifferentUser = { ...mockResume, user_id: uuidv4() };
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        resumeWithDifferentUser
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: true },
      };

      const result = await generationService.generateResume(request);

      expect(result.status).toBe("failed");
      expect(result.generated_text).toBe("");
    });

    it("should run hallucination guard and reject bad content", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);

      // Mock LLM result with invented content
      const badLLMResult = {
        ...mockLLMResult,
        generatedText:
          "Worked at Google from 2020-2024 as a Senior Engineer...", // Invented company and dates
      };
      vi.mocked(llmService.generateResume).mockResolvedValue(badLLMResult);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: false }, // Not preview only, so should reject
      };

      const result = await generationService.generateResume(request);

      expect(result.status).toBe("failed");
      expect(result.metadata.hallucinationCheck.passed).toBe(false);
      expect(result.metadata.hallucinationCheck.issues.length).toBeGreaterThan(
        0
      );
    });

    it("should allow bad content in preview mode", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);

      // Mock LLM result with invented content
      const badLLMResult = {
        ...mockLLMResult,
        generatedText:
          "Worked at Google from 2020-2024 as a Senior Engineer...", // Invented company and dates
      };
      vi.mocked(llmService.generateResume).mockResolvedValue(badLLMResult);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: true }, // Preview mode, so should allow
      };

      const result = await generationService.generateResume(request);

      expect(result.status).toBe("completed");
      expect(result.generated_text).toBe(badLLMResult.generatedText);
      expect(result.metadata.hallucinationCheck.passed).toBe(false); // Still flagged but allowed
    });
  });

  describe("generateCoverLetter", () => {
    it("should generate cover letter successfully", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);
      vi.mocked(llmService.generateCoverLetter).mockResolvedValue(
        mockLLMResult
      );

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: true },
      };

      const result = await generationService.generateCoverLetter(request);

      expect(result).toBeDefined();
      expect(result.generation_id).toBeDefined();
      expect(result.generated_text).toBe(mockLLMResult.generatedText);
      expect(result.diff).toEqual(mockLLMResult.diff);
      expect(result.status).toBe("completed");
      expect(result.metadata.hallucinationCheck.passed).toBe(true);
    });

    it("should handle LLM service errors gracefully", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);
      vi.mocked(llmService.generateCoverLetter).mockRejectedValue(
        new Error("LLM service error")
      );

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: true },
      };

      const result = await generationService.generateCoverLetter(request);

      expect(result.status).toBe("failed");
      expect(result.generated_text).toBe("");
      expect(result.metadata.hallucinationCheck.issues).toContain(
        "Generation failed"
      );
    });
  });

  describe("hallucination guard", () => {
    it("should detect invented employers", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);

      // Mock LLM result with invented company
      const badLLMResult = {
        ...mockLLMResult,
        generatedText: "Worked at Google Inc. as a Senior Software Engineer...", // Invented company
      };
      vi.mocked(llmService.generateResume).mockResolvedValue(badLLMResult);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: false },
      };

      const result = await generationService.generateResume(request);

      expect(result.metadata.hallucinationCheck.passed).toBe(false);
      expect(result.metadata.hallucinationCheck.issues).toContain(
        "Invented employer: Google Inc."
      );
    });

    it("should detect invented dates", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);

      // Mock LLM result with invented date
      const badLLMResult = {
        ...mockLLMResult,
        generatedText: "Graduated from University in 2025...", // Invented future date
      };
      vi.mocked(llmService.generateResume).mockResolvedValue(badLLMResult);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: false },
      };

      const result = await generationService.generateResume(request);

      expect(result.metadata.hallucinationCheck.passed).toBe(false);
      expect(
        result.metadata.hallucinationCheck.issues.some((issue) =>
          issue.includes("Invented date: 2025")
        )
      ).toBe(true);
    });

    it("should detect invented skills", async () => {
      const { llmService } = await import("../src/services/llmService.js");
      const { resumeService } = await import("../src/services/resume.js");
      const { jobService } = await import("../src/services/job.js");

      // Setup mocks
      vi.mocked(resumeService.getResumeByIdRequired).mockResolvedValue(
        mockResume
      );
      vi.mocked(jobService.getJobById).mockResolvedValue(mockJob);

      // Mock LLM result with invented skill
      const badLLMResult = {
        ...mockLLMResult,
        generatedText: "Expert in Rust programming language...", // Invented skill not in original
      };
      vi.mocked(llmService.generateResume).mockResolvedValue(badLLMResult);

      const request: GenerationRequest = {
        user_id: testUserId,
        resume_id: testResumeId,
        job_id: testJobId,
        options: { preview_only: false },
      };

      const result = await generationService.generateResume(request);

      expect(result.metadata.hallucinationCheck.passed).toBe(false);
      expect(
        result.metadata.hallucinationCheck.issues.some((issue) =>
          issue.includes("Invented skill")
        )
      ).toBe(true);
    });
  });
});
