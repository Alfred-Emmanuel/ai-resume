# PDF Parser Service

A high-accuracy PDF text extraction microservice using PyMuPDF (fitz) and FastAPI.

## Features

- **High Accuracy**: Uses PyMuPDF (fitz) for superior PDF text extraction compared to Node.js libraries
- **Page-by-Page Parsing**: Returns both full text and individual page content
- **Production Ready**: Includes health checks, error handling, and proper logging
- **Docker Support**: Containerized for easy deployment
- **RESTful API**: Clean FastAPI endpoints with automatic documentation

## API Endpoints

### Health Check

```
GET /health
```

Returns service health status.

### Parse PDF (Full Response)

```
POST /parse
Content-Type: multipart/form-data
```

Returns detailed parsing results with page-by-page breakdown.

**Response:**

```json
{
  "text": "Full extracted text...",
  "pages": [
    {
      "page_number": 1,
      "text": "Page 1 content..."
    },
    {
      "page_number": 2,
      "text": "Page 2 content..."
    }
  ],
  "metadata": {
    "page_count": 2,
    "filename": "document.pdf",
    "file_size": 12345
  }
}
```

### Parse PDF (Text Only)

```
POST /parse-text-only
Content-Type: multipart/form-data
```

Returns simplified response with only the full text.

**Response:**

```json
{
  "text": "Full extracted text...",
  "page_count": 2,
  "filename": "document.pdf"
}
```

## Running the Service

### Local Development

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker

1. Build the image:

```bash
docker build -t pdf-parser-service .
```

2. Run the container:

```bash
docker run -p 8000:8000 pdf-parser-service
```

### Docker Compose

The service is included in the main `docker-compose.yml` and will start automatically with other services.

## Integration with Node.js Backend

The Node.js backend automatically uses this service for PDF parsing when available, with fallback to the original `pdf-parse` library.

### Environment Variables

- `PDF_PARSER_SERVICE_URL`: URL of the PDF parser service (default: `http://localhost:8000`)

### Testing the Integration

1. Start the services:

```bash
docker-compose up -d
```

2. Test the PDF parser endpoint:

```bash
curl -X POST http://localhost:4000/api/v1/pdf-parser/upload-resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@your-resume.pdf"
```

3. Check service health:

```bash
curl http://localhost:4000/api/v1/pdf-parser/health
```

## Error Handling

The service includes comprehensive error handling for:

- Invalid PDF files
- Corrupted documents
- Network timeouts
- Service unavailability

All errors return appropriate HTTP status codes and descriptive error messages.

## Performance

- PyMuPDF is significantly more accurate than Node.js PDF libraries
- Handles complex PDF layouts, tables, and formatting better
- Supports encrypted PDFs and various PDF versions
- Memory efficient for large documents

## Security

- Non-root user in Docker container
- Input validation for file types
- Proper error handling without information leakage
- CORS configuration for production use
