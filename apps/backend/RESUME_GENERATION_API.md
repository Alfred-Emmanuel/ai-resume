# Resume Generation API

## Overview

The Resume Generation API provides endpoints for generating tailored resumes and cover letters using AI/LLM services. This implementation includes hallucination guards to ensure generated content maintains factual accuracy.

## Endpoints

### POST /api/v1/generate/resume

Generates a tailored resume based on a job posting.

#### Request Body

```json
{
  "resume_id": "uuid",
  "job_id": "uuid",
  "options": {
    "preview_only": true,
    "format": "pdf",
    "includeCoverLetter": false
  }
}
```

#### Parameters

- `resume_id` (required): UUID of the resume to tailor
- `job_id` (required): UUID of the job posting to tailor against
- `options.preview_only` (optional): If true, allows content that fails hallucination check (default: true)
- `options.format` (optional): Output format - "pdf" or "docx" (default: "pdf")
- `options.includeCoverLetter` (optional): Whether to include cover letter (default: false)

#### Response

```json
{
  "generation_id": "uuid",
  "generated_text": "Tailored resume content...",
  "diff": {
    "added": ["New content added"],
    "removed": ["Content removed"],
    "modified": ["Content modified"]
  },
  "metadata": {
    "tokensUsed": 1500,
    "model": "gpt-4o-mini",
    "processingTimeMs": 2000,
    "hallucinationCheck": {
      "passed": true,
      "issues": []
    }
  },
  "status": "completed",
  "message": "Resume generated successfully"
}
```

#### Error Responses

**400 Bad Request** - Validation error or hallucination check failed

```json
{
  "error": "Resume generation failed",
  "message": "Generated content failed hallucination check",
  "details": ["Invented employer: Google Inc."],
  "generation_id": "uuid"
}
```

**404 Not Found** - Resume or job not found

```json
{
  "error": "Resume not found"
}
```

### POST /api/v1/generate/coverletter

Generates a cover letter based on a resume and job posting.

#### Request Body

```json
{
  "resume_id": "uuid",
  "job_id": "uuid",
  "options": {
    "preview_only": true
  }
}
```

#### Response

```json
{
  "generation_id": "uuid",
  "generated_text": "Dear Hiring Manager...",
  "diff": {
    "added": ["Generated cover letter"],
    "removed": [],
    "modified": []
  },
  "metadata": {
    "tokensUsed": 800,
    "model": "gpt-4o-mini",
    "processingTimeMs": 1500,
    "hallucinationCheck": {
      "passed": true,
      "issues": []
    }
  },
  "status": "completed",
  "message": "Cover letter generated successfully"
}
```

### GET /api/v1/generate/:id/status

Get the status of a generation request.

#### Response

```json
{
  "generation_id": "uuid",
  "status": "completed",
  "message": "Generation completed"
}
```

### GET /api/v1/generate/:id/download

Get download URL for generated content.

#### Response

```json
{
  "generation_id": "uuid",
  "downloadUrl": "https://example.com/download/uuid",
  "message": "Download URL generated"
}
```

## Authentication

All endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Hallucination Guard

The system includes a comprehensive hallucination guard that validates generated content against the original resume data:

### Checks Performed

1. **Employer Validation**: Ensures no new companies are invented
2. **Date Validation**: Verifies all dates match original resume
3. **Skill Validation**: Detects obviously invented skills outside the candidate's tech stack

### Preview Mode

When `preview_only: true`:

- Generated content is returned even if hallucination check fails
- Issues are still reported in metadata
- Useful for user review before final generation

When `preview_only: false`:

- Generation is rejected if hallucination check fails
- Returns error response with details
- Ensures only factually accurate content is generated

## LLM Provider Support

The system supports multiple LLM providers:

- **Stub**: Local development with deterministic output
- **OpenAI**: GPT models (gpt-4o-mini, gpt-4, etc.)
- **Anthropic**: Claude models (claude-3-haiku, claude-3-sonnet, etc.)
- **DeepSeek**: DeepSeek models (deepseek-chat, etc.)

Configure via environment variables:

```bash
LLM_PROVIDER=openai  # or anthropic, deepseek, stub
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
```

## Error Handling

The API provides comprehensive error handling:

- **Validation Errors**: Invalid UUIDs, missing required fields
- **Authentication Errors**: Invalid or missing Firebase tokens
- **Authorization Errors**: Resume/job doesn't belong to user
- **LLM Errors**: API failures, rate limits, invalid responses
- **Hallucination Errors**: Generated content fails fact-checking

## Rate Limiting

Consider implementing rate limiting for production:

```typescript
const generationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 generations per window
  message: "Too many generation requests",
});
```

## Performance Considerations

- **Caching**: Consider caching frequently accessed resume/job data
- **Async Processing**: For large generations, consider async processing with status polling
- **Token Limits**: Monitor LLM token usage and implement limits
- **Database Optimization**: Index resume and job tables for fast lookups

## Testing

Run the test suite:

```bash
pnpm test generationService.test.ts
```

The tests cover:

- Successful resume generation
- Cover letter generation
- Hallucination guard validation
- Error handling scenarios
- Authentication and authorization

## Example Usage

### Generate Resume

```bash
curl -X POST http://localhost:3000/api/v1/generate/resume \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "123e4567-e89b-12d3-a456-426614174000",
    "job_id": "987fcdeb-51a2-43d1-9f12-345678901234",
    "options": {
      "preview_only": true,
      "format": "pdf"
    }
  }'
```

### Generate Cover Letter

```bash
curl -X POST http://localhost:3000/api/v1/generate/coverletter \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "123e4567-e89b-12d3-a456-426614174000",
    "job_id": "987fcdeb-51a2-43d1-9f12-345678901234",
    "options": {
      "preview_only": true
    }
  }'
```

## Future Enhancements

- **Batch Generation**: Generate multiple resumes for different jobs
- **Template Support**: Different resume formats and styles
- **A/B Testing**: Compare different LLM prompts
- **Analytics**: Track generation success rates and user preferences
- **Caching**: Cache generated content for reuse
- **Webhooks**: Notify clients when generation completes
