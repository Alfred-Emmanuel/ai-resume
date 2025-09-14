# Extension Preview UI Guide

## Overview

The browser extension now includes a comprehensive preview UI for generating and reviewing AI-tailored resumes and cover letters. This guide covers the implementation and usage of the preview features.

## Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx
│   ├── generation/
│   │   └── GenerationPreview.tsx
│   ├── jobs/
│   │   └── JobSelector.tsx
│   └── resume/
│       └── ResumeSelector.tsx
└── popup/
    └── popup.tsx (updated)
```

### State Management

The popup component manages the following states:

```typescript
const [currentView, setCurrentView] = useState<
  "main" | "resume-selector" | "job-selector" | "generation-preview"
>("main");
const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
```

## Components

### 1. GenerationPreview Component

**Purpose**: Display and manage AI-generated content

**Key Features**:

- Resume/Cover Letter generation toggle
- Real-time generation with loading states
- Diff visualization (added/removed/modified)
- Hallucination guard warnings
- Approve/reject functionality
- Compact UI optimized for popup

**API Integration**:

```typescript
const response = await fetch(`http://localhost:3001/api/v1${endpoint}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    resume_id: resumeId,
    job_id: jobId,
    options: { preview_only: true },
  }),
});
```

### 2. JobSelector Component

**Purpose**: Display and select from captured job postings

**Key Features**:

- Scrollable job list (max 400px height)
- Job details with truncation
- Status indicators
- Direct links to original postings
- Error handling with retry

**Data Structure**:

```typescript
interface Job {
  id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  created_at: string;
}
```

### 3. ResumeSelector Component

**Purpose**: Display and select from user's resumes

**Key Features**:

- Resume list with status indicators
- Processing/Ready status
- File information display
- Error handling

**Status Logic**:

```typescript
const getResumeStatus = (resume: Resume) => {
  if (!resume.canonical_json) {
    return { status: "Processing", color: "#f59e0b" };
  }
  return { status: "Ready", color: "#10b981" };
};
```

## User Flow

### 1. Main View

- User sees extension popup with two main actions:
  - "Capture Job Description" (existing functionality)
  - "Generate Resume/Cover Letter" (new functionality)

### 2. Resume Selection

- User clicks "Generate Resume/Cover Letter"
- Extension shows ResumeSelector
- User selects a processed resume
- Only resumes with `canonical_json` are selectable

### 3. Job Selection

- Extension shows JobSelector
- User selects a captured job posting
- Job details are displayed for context

### 4. Generation Preview

- Extension shows GenerationPreview
- User can choose between Resume or Cover Letter
- AI generates content in preview mode
- User reviews generated content and diff

### 5. Approval/Rejection

- User can approve content (triggers callback)
- User can request new generation
- User can navigate back to previous steps

## Styling Guidelines

### Design Principles

- **Compact**: Optimized for 320px popup width
- **Consistent**: Unified color scheme and spacing
- **Accessible**: High contrast, readable fonts
- **Responsive**: Adapts to content length

### Color Scheme

```css
Primary: #007bff (blue)
Success: #10b981 (green)
Warning: #f59e0b (amber)
Error: #ef4444 (red)
Neutral: #6b7280 (gray)
Background: #f9fafb (light gray)
```

### Typography

- **Headers**: 16px, bold
- **Body**: 14px, regular
- **Small**: 12px, regular
- **Tiny**: 10px, regular
- **Monospace**: 11px (for generated content)

## API Integration

### Authentication

Uses Chrome Identity API for token management:

```typescript
const token = await chrome.identity.getAuthToken();
```

### Endpoints

- `GET /api/v1/resumes/` - Fetch user resumes
- `GET /api/v1/jobs/` - Fetch captured jobs
- `POST /api/v1/generate/resume` - Generate resume
- `POST /api/v1/generate/coverletter` - Generate cover letter

### Error Handling

```typescript
try {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Request failed");
  } else {
    setResult(data);
  }
} catch (err) {
  setError(err instanceof Error ? err.message : "Network error");
}
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Components load only when needed
2. **State Management**: Efficient state updates
3. **Memory Management**: Cleanup on component unmount
4. **Network Optimization**: Minimal API calls

### Loading States

- All async operations show loading indicators
- Disabled buttons during operations
- Clear error messages for failures

## Testing

### Manual Testing Checklist

1. **Authentication Flow**:

   - [ ] Login with valid credentials
   - [ ] Handle authentication errors
   - [ ] Logout functionality

2. **Resume Selection**:

   - [ ] Load resumes list
   - [ ] Handle empty state
   - [ ] Select processed resume
   - [ ] Handle unprocessed resumes

3. **Job Selection**:

   - [ ] Load jobs list
   - [ ] Handle empty state
   - [ ] Select job posting
   - [ ] View job details

4. **Generation Flow**:

   - [ ] Generate resume
   - [ ] Generate cover letter
   - [ ] View diff visualization
   - [ ] Handle hallucination warnings
   - [ ] Approve content
   - [ ] Request regeneration

5. **Error Scenarios**:
   - [ ] Network failures
   - [ ] Authentication errors
   - [ ] Invalid data
   - [ ] API errors

### Debug Mode

Enable debug logging by adding `console.log` statements or using Chrome DevTools.

## Troubleshooting

### Common Issues

1. **"Authentication required" error**:

   - User needs to log in through the extension
   - Check Firebase configuration

2. **"No resumes found" error**:

   - User needs to upload resumes on the website
   - Resumes need to be processed

3. **"No jobs found" error**:

   - User needs to capture job postings first
   - Check job capture functionality

4. **Generation failures**:
   - Check API connectivity
   - Verify backend is running
   - Check authentication token

### Debug Steps

1. Open Chrome DevTools
2. Go to Extensions tab
3. Click "Inspect views: popup"
4. Check Console for errors
5. Check Network tab for API calls

## Future Enhancements

1. **Offline Support**: Cache generated content
2. **Batch Generation**: Multiple versions at once
3. **Template Selection**: Different formats
4. **Export Integration**: Direct download
5. **Real-time Updates**: Live preview
6. **Collaboration**: Share previews
7. **Analytics**: Usage tracking

## Security Considerations

1. **Token Management**: Secure storage and refresh
2. **API Security**: HTTPS endpoints only
3. **Data Privacy**: No sensitive data in logs
4. **Input Validation**: Sanitize all inputs
5. **Error Handling**: Don't expose sensitive information

## Deployment

### Build Process

```bash
cd apps/extension
npm run build
```

### Manifest Updates

Ensure `manifest.json` includes necessary permissions:

```json
{
  "permissions": ["identity", "activeTab", "storage"],
  "host_permissions": ["http://localhost:3001/*"]
}
```

### Testing in Chrome

1. Load unpacked extension
2. Test all functionality
3. Check for console errors
4. Verify API integration

