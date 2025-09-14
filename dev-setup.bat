@echo off
REM Development Setup Script for AI Resume App (Windows)
REM This script helps you run the application in development mode with hot reloading

echo 🚀 Setting up AI Resume App Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.dev.yml down

REM Remove old containers and images to ensure clean build
echo 🧹 Cleaning up old containers and images...
docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans

REM Build and start development environment
echo 🔨 Building and starting development environment...
docker-compose -f docker-compose.dev.yml up --build

echo ✅ Development environment is ready!
echo.
echo 📋 Services available at:
echo   - Backend API: http://localhost:3001
echo   - PostgreSQL: localhost:5433
echo   - Redis: localhost:6379
echo   - MinIO: http://localhost:9000 (Console: http://localhost:9001)
echo   - PDF Parser: http://localhost:8000
echo.
echo 🔄 Hot reloading is enabled - code changes will automatically restart the backend!
echo.
echo To stop the environment, run: docker-compose -f docker-compose.dev.yml down
pause

