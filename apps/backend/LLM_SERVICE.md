# LLM Service Documentation

## Overview

The LLM Service provides a unified interface for generating tailored resumes and cover letters using different AI providers. It supports both local development (stub mode) and production modes with OpenAI and Anthropic.

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```bash
# LLM Provider Selection
LLM_PROVIDER=stub  # Options: "stub", "openai", "anthropic", "deepseek"

# OpenAI Configuration (when LLM_PROVIDER=openai)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Anthropic Configuration (when LLM_PROVIDER=anthropic)
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-haiku-20240307

# DeepSeek Configuration (when LLM_PROVIDER=deepseek)
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat

# General LLM Settings
LLM_MAX_TOKENS=4000
LLM_TEMPERATURE=0.7
```

## Usage

### Basic Usage

```typescript
import { llmService, ResumeData, JobData } from './services/llmService.js';

const resumeData: ResumeData = {
  contact: { name: "John Doe", email: "john@example.com" },
  summary: "Experienced developer...",
  experience: [...],
  education: [...],
  skills: ["JavaScript", "React", "Node.js"]
};

const jobData: JobData = {
  title: "Full Stack Developer",
  company: "Tech Corp",
  description: "Looking for a developer with React experience..."
};

// Generate tailored resume
const resumeResult = await llmService.generateResume(resumeData, jobData);
console.log(resumeResult.generatedText);

// Generate cover letter
const coverLetterResult = await llmService.generateCoverLetter(resumeData, jobData);
console.log(coverLetterResult.generatedText);
```

### Service Modes

#### Stub Mode (Default)

- **Purpose**: Local development and testing
- **Behavior**: Returns deterministic rewrites based on keyword matching
- **Benefits**: No API costs, fast responses, consistent results
- **Use Case**: Development, testing, demos

#### OpenAI Mode

- **Purpose**: Production use with OpenAI's GPT models
- **Requirements**: Valid OpenAI API key
- **Models**: Supports GPT-4, GPT-3.5-turbo, etc.
- **Use Case**: Production applications requiring high-quality generation

#### Anthropic Mode

- **Purpose**: Production use with Anthropic's Claude models
- **Requirements**: Valid Anthropic API key
- **Models**: Supports Claude-3 Haiku, Sonnet, Opus
- **Use Case**: Production applications preferring Claude's capabilities

#### DeepSeek Mode

- **Purpose**: Production use with DeepSeek's models
- **Requirements**: Valid DeepSeek API key
- **Models**: Supports DeepSeek Chat, DeepSeek Coder
- **Use Case**: Production applications requiring cost-effective, high-quality generation

## API Reference

### Types

```typescript
interface ResumeData {
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

interface JobData {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
}

interface GenerationResult {
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
```

### Methods

#### `generateResume(resumeData: ResumeData, jobData: JobData): Promise<GenerationResult>`

Generates a tailored resume based on the job requirements.

**Parameters:**

- `resumeData`: The candidate's resume information
- `jobData`: The target job posting details

**Returns:**

- `GenerationResult` containing the tailored resume text, diff information, and metadata

#### `generateCoverLetter(resumeData: ResumeData, jobData: JobData): Promise<GenerationResult>`

Generates a personalized cover letter for the job application.

**Parameters:**

- `resumeData`: The candidate's resume information
- `jobData`: The target job posting details

**Returns:**

- `GenerationResult` containing the cover letter text, diff information, and metadata

## Testing

Run the LLM service tests:

```bash
pnpm test llmService.test.ts
```

The test suite includes:

- Service creation and initialization
- Resume generation with stub service
- Cover letter generation with stub service
- Keyword enhancement verification
- Factual accuracy validation

## Error Handling

The service includes comprehensive error handling:

- **Missing API Keys**: Throws descriptive errors when required API keys are missing
- **API Failures**: Catches and logs API errors with fallback behavior
- **Invalid Input**: Validates input data before processing
- **Rate Limiting**: Handles API rate limits gracefully

## Development Notes

### Adding New Providers

To add a new LLM provider:

1. Create a new service class implementing the `LLMService` interface
2. Add provider configuration to constants
3. Update the factory function to include the new provider
4. Add tests for the new provider

### Prompt Engineering

The service uses carefully crafted prompts to ensure:

- Factual accuracy (no invented employers, dates, or qualifications)
- Relevance to job requirements
- Professional tone and formatting
- Consistent output structure

### Performance Considerations

- Stub mode: ~1-2 seconds response time
- OpenAI mode: ~3-10 seconds depending on model and complexity
- Anthropic mode: ~2-8 seconds depending on model and complexity
- Token usage is tracked and reported in metadata

## Security

- API keys are never logged or exposed in error messages
- Input validation prevents injection attacks
- Generated content is validated against source data to prevent hallucination
- All API calls are made over HTTPS in production
