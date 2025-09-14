# Preview UI Guide

## Overview

The Preview UI provides users with a comprehensive interface to preview, review, and approve AI-generated resume and cover letter content. This guide covers both the website and browser extension implementations.

## Website Implementation

### Components

#### 1. GenerationPreview Component

**Location**: `src/components/generation/GenerationPreview.tsx`

**Features**:

- Generate resume or cover letter with preview mode
- Display generated content with syntax highlighting
- Show diff visualization (added, removed, modified content)
- Hallucination guard warnings
- Approve/reject functionality
- Generation metadata display

**Usage**:

```tsx
<GenerationPreview
  resume={resume}
  jobId={jobId}
  onBack={() => setShowGenerationPreview(false)}
  onApproved={(generatedText) => handleApprovedGeneration(generatedText)}
/>
```

#### 2. JobSelector Component

**Location**: `src/components/jobs/JobSelector.tsx`

**Features**:

- List all captured job postings
- Search and filter functionality
- Job details preview
- Direct links to original postings
- Pagination support

**Usage**:

```tsx
<JobSelector
  onJobSelected={(jobId) => handleJobSelected(jobId)}
  onBack={() => setShowJobSelector(false)}
/>
```

#### 3. Updated ResumeDetails Component

**Location**: `src/components/resume/ResumeDetails.tsx`

**New Features**:

- "Generate Resume" button integration
- Navigation to job selector
- Navigation to generation preview
- Approval workflow integration

### User Flow

1. **Start Generation**: User clicks "Generate Resume" button in ResumeDetails
2. **Select Job**: User selects a job from JobSelector
3. **Preview Content**: User reviews generated content in GenerationPreview
4. **Review Changes**: User can view diff to see what changed
5. **Approve/Reject**: User approves content or requests regeneration

### API Integration

The preview UI integrates with the following API endpoints:

- `POST /api/v1/generate/resume` - Generate tailored resume
- `POST /api/v1/generate/coverletter` - Generate cover letter
- `GET /api/v1/jobs/` - Fetch user's job postings

## Browser Extension Implementation

### Components

#### 1. GenerationPreview Component

**Location**: `src/components/generation/GenerationPreview.tsx`

**Features**:

- Compact UI optimized for popup window
- Resume/cover letter generation toggle
- Diff visualization in compact format
- Hallucination warnings
- Approve/reject functionality

#### 2. JobSelector Component

**Location**: `src/components/jobs/JobSelector.tsx`

**Features**:

- Scrollable job list
- Compact job cards
- Direct selection
- Error handling and retry

#### 3. ResumeSelector Component

**Location**: `src/components/resume/ResumeSelector.tsx`

**Features**:

- List user's resumes
- Status indicators (Processing/Ready)
- Resume selection
- Error handling

#### 4. Updated Popup Component

**Location**: `src/popup/popup.tsx`

**New Features**:

- Multi-step generation flow
- State management for navigation
- Integration with all selector components

### User Flow

1. **Start Generation**: User clicks "Generate Resume/Cover Letter" in popup
2. **Select Resume**: User selects a resume from ResumeSelector
3. **Select Job**: User selects a job from JobSelector
4. **Preview Content**: User reviews generated content in GenerationPreview
5. **Approve/Reject**: User approves content or requests regeneration

## Key Features

### Diff Visualization

Both implementations show:

- **Added**: New content (green)
- **Removed**: Deleted content (red)
- **Modified**: Changed content (blue)

### Hallucination Guard

The UI displays warnings when the AI detects:

- Invented employers
- Invented dates
- Invented skills
- Other factual inconsistencies

### Preview Mode

All generation requests use `preview_only: true` to:

- Allow users to review before committing
- Enable regeneration without penalties
- Provide safe testing environment

### Error Handling

Comprehensive error handling for:

- Network failures
- Authentication issues
- API errors
- Invalid data

## Styling

### Website

- Uses Tailwind CSS classes
- Responsive design
- Consistent with existing UI patterns
- Accessible color schemes

### Extension

- Inline styles for popup constraints
- Compact, efficient layouts
- Consistent color scheme
- Optimized for 320px width

## Testing

### Manual Testing Checklist

1. **Website Flow**:

   - [ ] Navigate to resume details
   - [ ] Click "Generate Resume"
   - [ ] Select job from list
   - [ ] Review generated content
   - [ ] View diff visualization
   - [ ] Approve/reject content

2. **Extension Flow**:

   - [ ] Open extension popup
   - [ ] Click "Generate Resume/Cover Letter"
   - [ ] Select resume
   - [ ] Select job
   - [ ] Review generated content
   - [ ] Approve/reject content

3. **Error Scenarios**:
   - [ ] Test with no jobs/resumes
   - [ ] Test with network failures
   - [ ] Test with authentication issues
   - [ ] Test with invalid data

## Future Enhancements

1. **Real-time Preview**: Live preview as user types
2. **Batch Operations**: Generate multiple versions
3. **Template Selection**: Choose from different formats
4. **Export Options**: Direct PDF/Word export
5. **Collaboration**: Share previews with others
6. **Version History**: Track all generated versions
7. **Custom Prompts**: User-defined generation instructions

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure user is logged in
2. **Empty Job Lists**: Capture jobs using extension first
3. **Generation Failures**: Check API connectivity
4. **UI Not Loading**: Verify component imports

### Debug Mode

Enable debug logging by setting `DEBUG=true` in environment variables.

