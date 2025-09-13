# Environment Setup for Firebase Auth

## Required Environment Variables

Create a `.env` file in the `apps/backend` directory with the following variables:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ai_resume_db

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Storage Configuration (MinIO for local development)
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ai-resume-files

# JWT Configuration (for any custom tokens if needed)
JWT_SECRET=your-jwt-secret-key

# External Services
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

## Firebase Service Account Key

The `FIREBASE_SERVICE_ACCOUNT_KEY` should be the entire JSON content of your Firebase service account key file. You can either:

1. **Option 1**: Copy the entire JSON content as a single line string
2. **Option 2**: Store the file path and modify the Firebase config to read from file

## Getting Firebase Configuration

### 1. Firebase Project ID

- Go to Firebase Console → Project Settings
- Copy the Project ID

### 2. Service Account Key

- Go to Firebase Console → Project Settings → Service Accounts
- Click "Generate new private key"
- Download the JSON file
- Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY`

### 3. Frontend Firebase Config

For your frontend applications, you'll need:

- Go to Firebase Console → Project Settings → General
- Scroll to "Your apps" section
- Copy the config object for web apps

## Database Setup

Make sure PostgreSQL is running and create a database:

```sql
CREATE DATABASE ai_resume_db;
```

The application will automatically create the required tables on startup.

## Storage Setup (MinIO)

For local development, you can use MinIO (S3-compatible storage):

### Option 1: Using Docker Compose

The project includes a `docker-compose.yml` file that sets up MinIO:

```bash
docker-compose up minio
```

### Option 2: Manual MinIO Setup

1. Download MinIO from https://min.io/download
2. Start MinIO server:

```bash
minio server /path/to/data --console-address ":9001"
```

3. Access MinIO console at http://localhost:9001
4. Default credentials: minioadmin / minioadmin

### Option 3: Production (AWS S3)

For production, set these environment variables:

```bash
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```
