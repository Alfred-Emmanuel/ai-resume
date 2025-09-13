import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { LLM } from "../constants/index.js";
import { Logger } from "../utils/logger.js";

// Types for LLM service
export interface ResumeData {
  contact: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills: string[];
}

export interface JobData {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
}

export interface GenerationResult {
  generatedText: string;
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  metadata: {
    tokensUsed?: number;
    model?: string;
    processingTimeMs: number;
  };
}

export interface LLMService {
  generateResume(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult>;
  generateCoverLetter(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult>;
}

// Stub implementation for local development
class StubLLMService implements LLMService {
  async generateResume(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using stub LLM service for resume generation");

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate deterministic rewrite based on job keywords
    const jobKeywords = this.extractKeywords(jobData.description);
    const tailoredExperience = this.tailorExperience(
      resumeData.experience,
      jobKeywords
    );
    const tailoredSkills = this.tailorSkills(resumeData.skills, jobKeywords);

    const generatedText = this.formatResumeText({
      ...resumeData,
      experience: tailoredExperience,
      skills: tailoredSkills,
    });

    const diff = this.calculateDiff(resumeData, {
      ...resumeData,
      experience: tailoredExperience,
      skills: tailoredSkills,
    });

    return {
      generatedText,
      diff,
      metadata: {
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  async generateCoverLetter(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using stub LLM service for cover letter generation");

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 800));

    const generatedText = this.formatCoverLetterText(resumeData, jobData);

    return {
      generatedText,
      diff: {
        added: [generatedText],
        removed: [],
        modified: [],
      },
      metadata: {
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, this would be more sophisticated
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  private tailorExperience(
    experience: ResumeData["experience"],
    keywords: string[]
  ): ResumeData["experience"] {
    return experience.map((exp) => {
      const tailoredDescription = exp.description.map((desc) => {
        // Add relevant keywords to descriptions
        const relevantKeywords = keywords.filter(
          (keyword) =>
            desc.toLowerCase().includes(keyword) ||
            keyword.includes(exp.position.toLowerCase()) ||
            keyword.includes(exp.company.toLowerCase())
        );

        if (relevantKeywords.length > 0) {
          return `${desc} (Enhanced with ${relevantKeywords.join(", ")})`;
        }
        return desc;
      });

      return {
        ...exp,
        description: tailoredDescription,
      };
    });
  }

  private tailorSkills(skills: string[], keywords: string[]): string[] {
    // Add relevant keywords as skills if they're not already present
    const newSkills = keywords.filter(
      (keyword) =>
        !skills.some((skill) =>
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
    );

    return [...skills, ...newSkills.slice(0, 3)]; // Add up to 3 new skills
  }

  private formatResumeText(resumeData: ResumeData): string {
    let text = `RESUME\n\n`;
    text += `CONTACT INFORMATION\n`;
    text += `Name: ${resumeData.contact.name}\n`;
    text += `Email: ${resumeData.contact.email}\n`;
    if (resumeData.contact.phone)
      text += `Phone: ${resumeData.contact.phone}\n`;
    if (resumeData.contact.location)
      text += `Location: ${resumeData.contact.location}\n`;

    text += `\nPROFESSIONAL SUMMARY\n${resumeData.summary}\n\n`;

    text += `EXPERIENCE\n`;
    resumeData.experience.forEach((exp) => {
      text += `${exp.position} at ${exp.company}\n`;
      text += `${exp.startDate} - ${exp.endDate || "Present"}\n`;
      exp.description.forEach((desc) => {
        text += `• ${desc}\n`;
      });
      text += `\n`;
    });

    text += `EDUCATION\n`;
    resumeData.education.forEach((edu) => {
      text += `${edu.degree} in ${edu.field}\n`;
      text += `${edu.institution}, ${edu.graduationDate}\n\n`;
    });

    text += `SKILLS\n${resumeData.skills.join(", ")}\n`;

    return text;
  }

  private formatCoverLetterText(
    resumeData: ResumeData,
    jobData: JobData
  ): string {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${
      jobData.title
    } position at ${jobData.company}. With my background in ${
      resumeData.experience[0]?.position || "relevant field"
    } and expertise in ${resumeData.skills
      .slice(0, 3)
      .join(
        ", "
      )}, I am confident that I would be a valuable addition to your team.

In my current role as ${
      resumeData.experience[0]?.position || "a professional"
    }, I have developed strong skills in ${resumeData.skills
      .slice(0, 2)
      .join(" and ")}. My experience at ${
      resumeData.experience[0]?.company || "previous companies"
    } has prepared me to contribute effectively to ${jobData.company}'s mission.

I am excited about the opportunity to bring my skills and enthusiasm to ${
      jobData.company
    } and would welcome the chance to discuss how I can contribute to your team's success.

Sincerely,
${resumeData.contact.name}`;
  }

  private calculateDiff(
    original: ResumeData,
    modified: ResumeData
  ): GenerationResult["diff"] {
    const added: string[] = [];
    const removed: string[] = [];
    const modifiedItems: string[] = [];

    // Compare skills
    const originalSkills = original.skills.join(", ");
    const modifiedSkills = modified.skills.join(", ");
    if (originalSkills !== modifiedSkills) {
      modifiedItems.push(`Skills: ${originalSkills} → ${modifiedSkills}`);
    }

    // Compare experience descriptions
    original.experience.forEach((origExp, index) => {
      const modExp = modified.experience[index];
      if (modExp) {
        origExp.description.forEach((origDesc, descIndex) => {
          const modDesc = modExp.description[descIndex];
          if (modDesc && origDesc !== modDesc) {
            modifiedItems.push(
              `Experience ${index + 1}, Point ${
                descIndex + 1
              }: ${origDesc} → ${modDesc}`
            );
          }
        });
      }
    });

    return { added, removed, modified: modifiedItems };
  }
}

// Production implementation using OpenAI
class OpenAILLMService implements LLMService {
  private client: OpenAI;

  constructor() {
    if (!LLM.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is required for production mode");
    }

    this.client = new OpenAI({
      apiKey: LLM.OPENAI_API_KEY,
    });
  }

  async generateResume(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using OpenAI for resume generation");

    const prompt = this.buildResumePrompt(resumeData, jobData);

    try {
      const response = await this.client.chat.completions.create({
        model: LLM.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume writer who tailors resumes to match job requirements. Always maintain factual accuracy and never invent new employers, dates, skills, or qualifications.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: LLM.MAX_TOKENS,
        temperature: LLM.TEMPERATURE,
      });

      const generatedText = response.choices[0]?.message?.content || "";
      const tokensUsed = response.usage?.total_tokens || 0;

      // Calculate diff (simplified for now)
      const diff = this.calculateDiff(resumeData, generatedText);

      return {
        generatedText,
        diff,
        metadata: {
          tokensUsed,
          model: LLM.OPENAI_MODEL,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      Logger.error("OpenAI API error:", error);
      throw new Error("Failed to generate resume with OpenAI");
    }
  }

  async generateCoverLetter(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using OpenAI for cover letter generation");

    const prompt = this.buildCoverLetterPrompt(resumeData, jobData);

    try {
      const response = await this.client.chat.completions.create({
        model: LLM.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert cover letter writer who creates compelling, personalized cover letters that highlight relevant experience and skills.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: LLM.MAX_TOKENS,
        temperature: LLM.TEMPERATURE,
      });

      const generatedText = response.choices[0]?.message?.content || "";
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        generatedText,
        diff: {
          added: [generatedText],
          removed: [],
          modified: [],
        },
        metadata: {
          tokensUsed,
          model: LLM.OPENAI_MODEL,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      Logger.error("OpenAI API error:", error);
      throw new Error("Failed to generate cover letter with OpenAI");
    }
  }

  private buildResumePrompt(resumeData: ResumeData, jobData: JobData): string {
    return `Please tailor this resume for the following job posting:

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
Description: ${jobData.description}

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Please provide a tailored resume that:
1. Emphasizes relevant experience and skills for this specific job
2. Uses keywords from the job description naturally
3. Maintains all factual information (no invented employers, dates, skills, or qualifications)
4. Formats the output as plain text resume

Return only the tailored resume text, no additional commentary.`;
  }

  private buildCoverLetterPrompt(
    resumeData: ResumeData,
    jobData: JobData
  ): string {
    return `Please write a professional cover letter for this job application:

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
Description: ${jobData.description}

CANDIDATE INFORMATION:
${JSON.stringify(resumeData, null, 2)}

Please write a cover letter that:
1. Demonstrates understanding of the role and company
2. Highlights relevant experience and achievements
3. Shows enthusiasm for the position
4. Is professional and concise (3-4 paragraphs)
5. Uses the candidate's actual name: ${resumeData.contact.name}

Return only the cover letter text, no additional commentary.`;
  }

  private calculateDiff(
    original: ResumeData,
    generatedText: string
  ): GenerationResult["diff"] {
    // Simplified diff calculation for production
    // In a real implementation, you'd parse the generated text and compare it more thoroughly
    return {
      added: ["Generated tailored resume content"],
      removed: [],
      modified: ["Experience descriptions", "Skills section"],
    };
  }
}

// Production implementation using Anthropic
class AnthropicLLMService implements LLMService {
  private client: Anthropic;

  constructor() {
    if (!LLM.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key is required for production mode");
    }

    this.client = new Anthropic({
      apiKey: LLM.ANTHROPIC_API_KEY,
    });
  }

  async generateResume(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using Anthropic for resume generation");

    const prompt = this.buildResumePrompt(resumeData, jobData);

    try {
      const response = await this.client.messages.create({
        model: LLM.ANTHROPIC_MODEL,
        max_tokens: LLM.MAX_TOKENS,
        temperature: LLM.TEMPERATURE,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const generatedText =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      const tokensUsed =
        response.usage?.input_tokens + response.usage?.output_tokens || 0;

      const diff = this.calculateDiff(resumeData, generatedText);

      return {
        generatedText,
        diff,
        metadata: {
          tokensUsed,
          model: LLM.ANTHROPIC_MODEL,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      Logger.error("Anthropic API error:", error);
      throw new Error("Failed to generate resume with Anthropic");
    }
  }

  async generateCoverLetter(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using Anthropic for cover letter generation");

    const prompt = this.buildCoverLetterPrompt(resumeData, jobData);

    try {
      const response = await this.client.messages.create({
        model: LLM.ANTHROPIC_MODEL,
        max_tokens: LLM.MAX_TOKENS,
        temperature: LLM.TEMPERATURE,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const generatedText =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      const tokensUsed =
        response.usage?.input_tokens + response.usage?.output_tokens || 0;

      return {
        generatedText,
        diff: {
          added: [generatedText],
          removed: [],
          modified: [],
        },
        metadata: {
          tokensUsed,
          model: LLM.ANTHROPIC_MODEL,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      Logger.error("Anthropic API error:", error);
      throw new Error("Failed to generate cover letter with Anthropic");
    }
  }

  private buildResumePrompt(resumeData: ResumeData, jobData: JobData): string {
    return `Please tailor this resume for the following job posting:

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
Description: ${jobData.description}

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Please provide a tailored resume that:
1. Emphasizes relevant experience and skills for this specific job
2. Uses keywords from the job description naturally
3. Maintains all factual information (no invented employers, dates, or qualifications)
4. Formats the output as plain text resume

Return only the tailored resume text, no additional commentary.`;
  }

  private buildCoverLetterPrompt(
    resumeData: ResumeData,
    jobData: JobData
  ): string {
    return `Please write a professional cover letter for this job application:

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
Description: ${jobData.description}

CANDIDATE INFORMATION:
${JSON.stringify(resumeData, null, 2)}

Please write a cover letter that:
1. Demonstrates understanding of the role and company
2. Highlights relevant experience and achievements
3. Shows enthusiasm for the position
4. Is professional and concise (3-4 paragraphs)
5. Uses the candidate's actual name: ${resumeData.contact.name}

Return only the cover letter text, no additional commentary.`;
  }

  private calculateDiff(
    original: ResumeData,
    generatedText: string
  ): GenerationResult["diff"] {
    return {
      added: ["Generated tailored resume content"],
      removed: [],
      modified: ["Experience descriptions", "Skills section"],
    };
  }
}

// Production implementation using DeepSeek
class DeepSeekLLMService implements LLMService {
  private apiKey: string;
  private baseUrl: string = "https://api.deepseek.com";

  constructor() {
    if (!LLM.DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key is required for production mode");
    }

    this.apiKey = LLM.DEEPSEEK_API_KEY;
  }

  async generateResume(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using DeepSeek for resume generation");

    const prompt = this.buildResumePrompt(resumeData, jobData);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: LLM.DEEPSEEK_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are an expert resume writer who tailors resumes to match job requirements. Always maintain factual accuracy and never invent new employers, dates, skills, or qualifications.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: LLM.MAX_TOKENS,
          temperature: LLM.TEMPERATURE,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens || 0;

      const diff = this.calculateDiff(resumeData, generatedText);

      return {
        generatedText,
        diff,
        metadata: {
          tokensUsed,
          model: LLM.DEEPSEEK_MODEL,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      Logger.error("DeepSeek API error:", error);
      throw new Error("Failed to generate resume with DeepSeek");
    }
  }

  async generateCoverLetter(
    resumeData: ResumeData,
    jobData: JobData
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    Logger.info("Using DeepSeek for cover letter generation");

    const prompt = this.buildCoverLetterPrompt(resumeData, jobData);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: LLM.DEEPSEEK_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are an expert cover letter writer who creates compelling, personalized cover letters that highlight relevant experience and skills.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: LLM.MAX_TOKENS,
          temperature: LLM.TEMPERATURE,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        generatedText,
        diff: {
          added: [generatedText],
          removed: [],
          modified: [],
        },
        metadata: {
          tokensUsed,
          model: LLM.DEEPSEEK_MODEL,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      Logger.error("DeepSeek API error:", error);
      throw new Error("Failed to generate cover letter with DeepSeek");
    }
  }

  private buildResumePrompt(resumeData: ResumeData, jobData: JobData): string {
    return `Please tailor this resume for the following job posting:

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
Description: ${jobData.description}

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Please provide a tailored resume that:
1. Emphasizes relevant experience and skills for this specific job
2. Uses keywords from the job description naturally
3. Maintains all factual information (no invented employers, dates, skills, or qualifications)
4. Formats the output as plain text resume

Return only the tailored resume text, no additional commentary.`;
  }

  private buildCoverLetterPrompt(
    resumeData: ResumeData,
    jobData: JobData
  ): string {
    return `Please write a professional cover letter for this job application:

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
Description: ${jobData.description}

CANDIDATE INFORMATION:
${JSON.stringify(resumeData, null, 2)}

Please write a cover letter that:
1. Demonstrates understanding of the role and company
2. Highlights relevant experience and achievements
3. Shows enthusiasm for the position
4. Is professional and concise (3-4 paragraphs)
5. Uses the candidate's actual name: ${resumeData.contact.name}

Return only the cover letter text, no additional commentary.`;
  }

  private calculateDiff(
    original: ResumeData,
    generatedText: string
  ): GenerationResult["diff"] {
    return {
      added: ["Generated tailored resume content"],
      removed: [],
      modified: ["Experience descriptions", "Skills section"],
    };
  }
}

// Factory function to create the appropriate LLM service
export function createLLMService(): LLMService {
  switch (LLM.PROVIDER) {
    case "openai":
      return new OpenAILLMService();
    case "anthropic":
      return new AnthropicLLMService();
    case "deepseek":
      return new DeepSeekLLMService();
    case "stub":
    default:
      return new StubLLMService();
  }
}

// Export the singleton instance
export const llmService = createLLMService();
