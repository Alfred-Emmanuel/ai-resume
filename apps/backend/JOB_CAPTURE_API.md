# Job Capture API Documentation

## Overview

The Job Capture API allows users to capture and store job postings from various sources (LinkedIn, Indeed, etc.) for later use in resume generation.

## Endpoints

### POST /api/v1/jobs/capture

Captures a job posting and stores it in the database.

**Authentication:** Required (JWT token)

**Request Body:**

```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "description": "Looking for a senior software engineer with React and Node.js experience.",
  "url": "https://example.com/job/123"
}
```

**Request Fields:**

- `title` (required): Job title
- `company` (optional): Company name
- `location` (optional): Job location
- `description` (optional): Job description
- `url` (optional): URL to the original job posting

**Response (201 Created):**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job captured successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

### GET /api/v1/jobs

Retrieves all jobs for the authenticated user with pagination.

**Authentication:** Required (JWT token)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "Looking for a senior software engineer...",
      "url": "https://example.com/job/123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "message": "Jobs retrieved successfully"
}
```

### GET /api/v1/jobs/:id

Retrieves a specific job by ID.

**Authentication:** Required (JWT token)

**Path Parameters:**

- `id`: Job UUID

**Response (200 OK):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "description": "Looking for a senior software engineer...",
    "url": "https://example.com/job/123",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Job retrieved successfully"
}
```

**Error Responses:**

- `404 Not Found`: Job not found or doesn't belong to user

### PUT /api/v1/jobs/:id

Updates a specific job.

**Authentication:** Required (JWT token)

**Path Parameters:**

- `id`: Job UUID

**Request Body:** (Partial update - all fields optional)

```json
{
  "title": "Updated Job Title",
  "company": "Updated Company",
  "location": "Updated Location",
  "description": "Updated description",
  "url": "https://updated-url.com"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "title": "Updated Job Title",
    "company": "Updated Company",
    "location": "Updated Location",
    "description": "Updated description",
    "url": "https://updated-url.com",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "Job updated successfully"
}
```

### DELETE /api/v1/jobs/:id

Deletes a specific job.

**Authentication:** Required (JWT token)

**Path Parameters:**

- `id`: Job UUID

**Response (200 OK):**

```json
{
  "message": "Job deleted successfully"
}
```

**Error Responses:**

- `404 Not Found`: Job not found or doesn't belong to user

### GET /api/v1/jobs/search

Searches jobs by title, company, location, or description.

**Authentication:** Required (JWT token)

**Query Parameters:**

- `q` (required): Search term
- `limit` (optional): Maximum results (default: 20)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "Looking for a senior software engineer...",
      "url": "https://example.com/job/123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Job search completed successfully",
  "searchTerm": "software",
  "count": 1
}
```

## Usage Examples

### Capture a Job from LinkedIn

```bash
curl -X POST http://localhost:5000/api/v1/jobs/capture \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Full Stack Developer",
    "company": "StartupXYZ",
    "location": "Remote",
    "description": "We are looking for a full-stack developer with experience in React, Node.js, and cloud technologies.",
    "url": "https://linkedin.com/jobs/456"
  }'
```

### Get All Jobs

```bash
curl -X GET "http://localhost:5000/api/v1/jobs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search Jobs

```bash
curl -X GET "http://localhost:5000/api/v1/jobs/search?q=react&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

The jobs are stored in the `jobs` table with the following structure:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  company VARCHAR(500),
  location VARCHAR(500),
  description TEXT,
  url VARCHAR(1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security

- All endpoints require authentication via JWT token
- Users can only access their own jobs
- Input validation prevents SQL injection and XSS attacks
- Rate limiting should be implemented at the API gateway level

## Error Handling

The API uses consistent error response format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [] // Optional: validation error details
}
```

Common error types:

- `VALIDATION_ERROR`: Invalid input data
- `USER_NOT_AUTHENTICATED`: Missing or invalid authentication
- `JOB_NOT_FOUND`: Job doesn't exist or doesn't belong to user
- `INTERNAL_ERROR`: Server error
