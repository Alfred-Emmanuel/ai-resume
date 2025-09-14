# Local Development (Without Docker)

If you prefer to run the backend locally without Docker for faster development, here's how to set it up:

## Prerequisites

- Node.js 20+ installed
- PostgreSQL running locally or via Docker
- Redis running locally or via Docker

## Quick Setup

### 1. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 2. Start Required Services (Docker)

```bash
# Start only the services (PostgreSQL, Redis, MinIO, PDF Parser)
docker-compose up postgres redis minio pdf-parser
```

### 3. Set Up Environment Variables

Create `apps/backend/.env` with:

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASS=postgres
DB_NAME=ai-resume

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_ENDPOINT=http://localhost:9000

# JWT
JWT_SECRET=your-secret-key

# LLM (optional for testing)
LLM_PROVIDER=stub
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
DEEPSEEK_API_KEY=your-key-here

# PDF Parser
PDF_PARSER_SERVICE_URL=http://localhost:8000

# Server
PORT=3001
NODE_ENV=development
```

### 4. Run Database Migrations

```bash
cd apps/backend
pnpm run migrate
```

### 5. Start Backend in Development Mode

```bash
cd apps/backend
pnpm dev
```

## Benefits of Local Development

- ⚡ **Faster startup**: No Docker build time
- 🔄 **Instant hot reload**: Changes reflect immediately
- 🐛 **Better debugging**: Direct access to Node.js debugger
- 📝 **Easier logging**: Direct console output

## Services Still Running in Docker

- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379
- **MinIO**: http://localhost:9000
- **PDF Parser**: http://localhost:8000

## Backend Running Locally

- **Backend API**: http://localhost:3001

## Testing Your Endpoints

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test job endpoints (after authentication setup)
curl http://localhost:3001/api/v1/jobs/
```

## Troubleshooting

### Port Conflicts

Make sure ports 3001, 5433, 6379, 8000, 9000 are available.

### Database Connection

Ensure PostgreSQL is running and accessible:

```bash
docker-compose logs postgres
```

### Missing Dependencies

If you get module errors, run:

```bash
pnpm install
```

## Switching Between Docker and Local

- **Docker**: `docker-compose -f docker-compose.dev.yml up`
- **Local**: Follow this guide + `pnpm dev`

Both approaches give you hot reloading, but local development is typically faster for iteration.

