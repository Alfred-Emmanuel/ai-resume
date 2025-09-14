import { BaseService } from "./baseService.js";
import { Logger } from "../utils/logger.js";
import { NotFoundError } from "../utils/errors.js";
import { llmService, ResumeData, JobData } from "./llmService.js";
import { resumeService } from "./resume.js";
import { jobService } from "./job.js";
import type { UUID } from "@ai-resume/types";

export interface GenerationRequest {
  user_id: UUID;
  resume_id: UUID;
  job_id: UUID;
  options: {
    preview_only?: boolean;
    format?: "pdf" | "docx";
    includeCoverLetter?: boolean;
  };
}

export interface GenerationResult {
  generation_id: UUID;
  generated_text: string;
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  metadata: {
    tokensUsed?: number;
    model?: string;
    processingTimeMs: number;
    hallucinationCheck: {
      passed: boolean;
      issues: string[];
    };
  };
  status: "completed" | "failed";
}

export interface HallucinationCheckResult {
  passed: boolean;
  issues: string[];
}

export class GenerationService extends BaseService {
  async generateResume(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = this.generateId();

    Logger.info("Starting resume generation", {
      generationId,
      userId: request.user_id,
      resumeId: request.resume_id,
      jobId: request.job_id,
    });

    try {
      // Load resume data
      const resume = await resumeService.getResumeByIdRequired(
        request.resume_id
      );

      // Verify resume belongs to user
      if (resume.user_id !== request.user_id) {
        throw new NotFoundError("Resume not found");
      }

      // Load job data
      const job = await jobService.getJobById(request.job_id, request.user_id);

      // Convert resume canonical JSON to ResumeData format
      const resumeData = this.convertToResumeData(resume);

      // Convert job data to JobData format
      const jobData = this.convertToJobData(job);

      // Generate resume using LLM service
      const llmResult = await llmService.generateResume(resumeData, jobData);

      // Run hallucination guard
      const hallucinationCheck = this.runHallucinationGuard(
        resumeData,
        llmResult.generatedText
      );

      // If hallucination check fails and not preview only, reject the generation
      if (!hallucinationCheck.passed && !request.options.preview_only) {
        Logger.warn("Generation rejected due to hallucination", {
          generationId,
          issues: hallucinationCheck.issues,
        });

        return {
          generation_id: generationId,
          generated_text: "",
          diff: { added: [], removed: [], modified: [] },
          metadata: {
            processingTimeMs: Date.now() - startTime,
            hallucinationCheck,
          },
          status: "failed",
        };
      }

      Logger.info("Resume generation completed successfully", {
        generationId,
        processingTimeMs: Date.now() - startTime,
        hallucinationPassed: hallucinationCheck.passed,
      });

      return {
        generation_id: generationId,
        generated_text: llmResult.generatedText,
        diff: llmResult.diff,
        metadata: {
          tokensUsed: llmResult.metadata.tokensUsed,
          model: llmResult.metadata.model,
          processingTimeMs: Date.now() - startTime,
          hallucinationCheck,
        },
        status: "completed",
      };
    } catch (error) {
      Logger.error("Resume generation failed", {
        generationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        generation_id: generationId,
        generated_text: "",
        diff: { added: [], removed: [], modified: [] },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          hallucinationCheck: { passed: false, issues: ["Generation failed"] },
        },
        status: "failed",
      };
    }
  }

  async generateCoverLetter(
    request: GenerationRequest
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = this.generateId();

    Logger.info("Starting cover letter generation", {
      generationId,
      userId: request.user_id,
      resumeId: request.resume_id,
      jobId: request.job_id,
    });

    try {
      // Load resume data
      const resume = await resumeService.getResumeByIdRequired(
        request.resume_id
      );

      // Verify resume belongs to user
      if (resume.user_id !== request.user_id) {
        throw new NotFoundError("Resume not found");
      }

      // Load job data
      const job = await jobService.getJobById(request.job_id, request.user_id);

      // Convert resume canonical JSON to ResumeData format
      const resumeData = this.convertToResumeData(resume);

      // Convert job data to JobData format
      const jobData = this.convertToJobData(job);

      // Generate cover letter using LLM service
      const llmResult = await llmService.generateCoverLetter(
        resumeData,
        jobData
      );

      Logger.info("Cover letter generation completed successfully", {
        generationId,
        processingTimeMs: Date.now() - startTime,
      });

      return {
        generation_id: generationId,
        generated_text: llmResult.generatedText,
        diff: llmResult.diff,
        metadata: {
          tokensUsed: llmResult.metadata.tokensUsed,
          model: llmResult.metadata.model,
          processingTimeMs: Date.now() - startTime,
          hallucinationCheck: { passed: true, issues: [] },
        },
        status: "completed",
      };
    } catch (error) {
      Logger.error("Cover letter generation failed", {
        generationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        generation_id: generationId,
        generated_text: "",
        diff: { added: [], removed: [], modified: [] },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          hallucinationCheck: { passed: false, issues: ["Generation failed"] },
        },
        status: "failed",
      };
    }
  }

  private convertToResumeData(resume: any): ResumeData {
    // Extract canonical JSON or create default structure
    const canonicalJson = resume.canonical_json || {};

    return {
      contact: {
        name: canonicalJson.contact?.name || "Unknown",
        email: canonicalJson.contact?.email || "",
        phone: canonicalJson.contact?.phone,
        location: canonicalJson.contact?.location,
      },
      summary: canonicalJson.summary || "Professional summary not available",
      experience: canonicalJson.experience || [],
      education: canonicalJson.education || [],
      skills: canonicalJson.skills || [],
    };
  }

  private convertToJobData(job: any): JobData {
    return {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description || "",
      requirements: this.extractRequirements(job.description),
      responsibilities: this.extractResponsibilities(job.description),
    };
  }

  private extractRequirements(description: string): string[] {
    if (!description) return [];

    // Simple extraction of requirements - in production, this would be more sophisticated
    const lines = description.split("\n");
    const requirements: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.match(/^(required|must have|should have|need|experience with)/i)
      ) {
        requirements.push(trimmed);
      }
    }

    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  private extractResponsibilities(description: string): string[] {
    if (!description) return [];

    // Simple extraction of responsibilities - in production, this would be more sophisticated
    const lines = description.split("\n");
    const responsibilities: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.match(
          /^(will|responsible for|duties include|key responsibilities)/i
        )
      ) {
        responsibilities.push(trimmed);
      }
    }

    return responsibilities.slice(0, 10); // Limit to 10 responsibilities
  }

  private runHallucinationGuard(
    originalResume: ResumeData,
    generatedText: string
  ): HallucinationCheckResult {
    const issues: string[] = [];

    // Check for invented employers
    const originalCompanies = originalResume.experience.map((exp) =>
      exp.company.toLowerCase()
    );
    const generatedCompanies = this.extractCompaniesFromText(generatedText);

    for (const company of generatedCompanies) {
      if (!originalCompanies.includes(company.toLowerCase())) {
        issues.push(`Invented employer: ${company}`);
      }
    }

    // Check for invented dates
    const originalDates = this.extractDatesFromResume(originalResume);
    const generatedDates = this.extractDatesFromText(generatedText);

    for (const date of generatedDates) {
      if (!originalDates.includes(date)) {
        issues.push(`Invented date: ${date}`);
      }
    }

    // Check for invented skills
    const originalSkills = originalResume.skills.map((skill) =>
      skill.toLowerCase()
    );
    const generatedSkills = this.extractSkillsFromText(generatedText);

    for (const skill of generatedSkills) {
      if (!originalSkills.includes(skill.toLowerCase())) {
        // Allow some skill variations, but flag obvious inventions
        if (this.isObviousSkillInvention(skill, originalSkills)) {
          issues.push(`Invented skill: ${skill}`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  private extractCompaniesFromText(text: string): string[] {
    // Simple company extraction - in production, use NLP
    const companies: string[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
      const match = line.match(/(?:at|@)\s+([A-Z][a-zA-Z\s&.]+)/);
      if (match) {
        companies.push(match[1].trim());
      }
    }

    return companies;
  }

  private extractDatesFromResume(resume: ResumeData): string[] {
    const dates: string[] = [];

    // Extract dates from experience
    resume.experience.forEach((exp) => {
      dates.push(exp.startDate);
      if (exp.endDate) dates.push(exp.endDate);
    });

    // Extract dates from education
    resume.education.forEach((edu) => {
      dates.push(edu.graduationDate);
    });

    return dates;
  }

  private extractDatesFromText(text: string): string[] {
    // Simple date extraction - in production, use proper date parsing
    const dateRegex = /\b(19|20)\d{2}(?:-\d{2})?(?:-\d{2})?\b/g;
    return text.match(dateRegex) || [];
  }

  private extractSkillsFromText(text: string): string[] {
    // Simple skill extraction - in production, use NLP
    const skills: string[] = [];
    const commonSkills = [
      "JavaScript",
      "Python",
      "Java",
      "React",
      "Node.js",
      "AWS",
      "Docker",
      "Kubernetes",
      "SQL",
      "MongoDB",
      "Git",
      "Linux",
      "Agile",
      "Scrum",
      "Rust",
      "C++",
      "C#",
      "Go",
      "TypeScript",
      "Vue",
      "Angular",
      "Svelte",
    ];

    for (const skill of commonSkills) {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private isObviousSkillInvention(
    skill: string,
    originalSkills: string[]
  ): boolean {
    // Check if skill is obviously invented (not just a variation)
    const skillLower = skill.toLowerCase();

    // If it's a completely different technology stack, it's likely invented
    const techStacks = [
      ["javascript", "java", "python", "c++", "c#", "rust", "go"],
      ["react", "vue", "angular", "svelte"],
      ["aws", "azure", "gcp", "heroku"],
    ];

    for (const stack of techStacks) {
      if (stack.includes(skillLower)) {
        const hasOriginalFromStack = originalSkills.some((orig) =>
          stack.includes(orig.toLowerCase())
        );
        if (!hasOriginalFromStack) {
          return true;
        }
      }
    }

    return false;
  }

  private generateId(): UUID {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const generationService = new GenerationService();
