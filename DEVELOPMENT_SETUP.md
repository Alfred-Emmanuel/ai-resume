# Development Setup Guide

This guide will help you set up the AI Resume App for development with hot reloading.

## Prerequisites

- Docker Desktop installed and running
- Git (for cloning the repository)

## Quick Start

### Option 1: Using the Setup Script (Recommended)

**Windows:**

```bash
./dev-setup.bat
```

**Linux/Mac:**

```bash
chmod +x dev-setup.sh
./dev-setup.sh
```

### Option 2: Manual Setup

1. **Stop existing containers:**

   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

2. **Clean up old containers:**

   ```bash
   docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
   ```

3. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

## What's Different in Development Mode

### Hot Reloading

- **Backend**: Automatically restarts when you change any TypeScript files in `apps/backend/src/`
- **No rebuild required**: Changes are reflected immediately
- **Volume mounting**: Source code is mounted into the container

### Development vs Production

| Feature       | Development | Production |
| ------------- | ----------- | ---------- |
| Hot Reloading | ✅ Yes      | ❌ No      |
| Source Maps   | ✅ Yes      | ❌ No      |
| Debug Logging | ✅ Verbose  | ❌ Minimal |
| Port          | 3001        | 5000       |
| Environment   | development | production |

## Services

Once running, the following services will be available:

- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379
- **MinIO**: http://localhost:9000 (Console: http://localhost:9001)
- **PDF Parser**: http://localhost:8000

## Development Workflow

1. **Make code changes** in `apps/backend/src/`
2. **Save the file** - the backend will automatically restart
3. **Test your changes** via the API endpoints
4. **View logs** in the Docker Compose output

## API Testing

Test the new job endpoints:

```bash
# Get jobs (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/jobs/

# Capture a job
curl -X POST http://localhost:3001/api/v1/jobs/capture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "rawText": "We are looking for a software engineer...",
    "source": "linkedin"
  }'
```

## Troubleshooting

### Port Already in Use

If you get port conflicts, stop the production containers:

```bash
docker-compose down
```

### Database Connection Issues

Make sure PostgreSQL is running and accessible:

```bash
docker-compose -f docker-compose.dev.yml logs postgres
```

### Backend Not Reloading

Check that the volume mounts are working:

```bash
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/apps/backend/src
```

### Environment Variables

Make sure your `.env` file in `apps/backend/` has the required variables:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=resume_app
# ... other variables
```

## Stopping the Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

## Useful Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Execute Commands in Container

```bash
# Access backend container
docker-compose -f docker-compose.dev.yml exec backend bash

# Run tests
docker-compose -f docker-compose.dev.yml exec backend pnpm test
```

### Rebuild Specific Service

```bash
docker-compose -f docker-compose.dev.yml up --build backend
```

## File Watching

The development setup watches these directories for changes:

- `apps/backend/src/` - Backend source code
- `packages/` - Shared packages
- Configuration files (package.json, tsconfig.json, etc.)

## Performance Tips

1. **Use .dockerignore**: Exclude unnecessary files from the build context
2. **Volume mounts**: Only mount directories you're actively editing
3. **Resource limits**: Adjust Docker Desktop memory allocation if needed

## Next Steps

1. Start the development environment
2. Test the new job capture and generation endpoints
3. Verify hot reloading is working by making a small change
4. Check the API documentation at http://localhost:3001/api/v1/

Happy coding! 🚀

