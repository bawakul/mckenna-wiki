---
phase: 06-export
plan: 02
subsystem: ui
tags: [export, user-interface, downloads]

requires:
  - phase: "06"
    plan: "01"
    reason: "Depends on export API endpoints (markdown/CSV)"

provides:
  what: "Export UI components with single and bulk export capabilities"
  features:
    - "Single module MD/CSV export buttons on trace pages"
    - "Bulk module ZIP/CSV export buttons on modules list"
    - "Loading states during async export operations"
    - "Browser download integration with proper cleanup"

affects:
  - context: "User workflow"
    impact: "Users can now export module annotations for external analysis"
  - context: "Analysis workflow"
    impact: "Enables external tooling integration (markdown editors, spreadsheets)"

tech-stack:
  added: []
  patterns:
    - "Client-side download via URL.createObjectURL"
    - "Parallel fetch for bulk operations with Promise.all"
    - "Browser-side ZIP generation with client-zip"
    - "Proper resource cleanup with URL.revokeObjectURL"

key-files:
  created:
    - path: "src/components/export/ExportButtons.tsx"
      purpose: "Single module export component (MD/CSV buttons)"
    - path: "src/components/export/BulkExportButton.tsx"
      purpose: "Bulk export component (ZIP/CSV for all modules)"
  modified:
    - path: "src/app/analysis/modules/[id]/page.tsx"
      change: "Added ExportButtons to module trace page header"
    - path: "src/app/modules/page.tsx"
      change: "Added bulk export buttons to modules page header"

decisions: []

metrics:
  duration: "2 min"
  completed: "2026-02-23"
---

# Phase 06 Plan 02: Export UI Summary

**One-liner:** Export buttons on trace and modules pages with single/bulk download support

## What Was Built

Connected export infrastructure from Plan 01 to user-facing buttons on module detail and list pages.

### Components Created

**ExportButtons Component:**
- Two buttons: "Export MD" and "Export CSV"
- Independent loading states per format
- Fetches from `/api/export/{format}/{moduleId}`
- Extracts filename from Content-Disposition header
- Downloads via URL.createObjectURL + link.click pattern
- Proper cleanup with URL.revokeObjectURL
- Error handling with user-facing alerts

**BulkExportButton Component:**
- Separate instances for markdown (ZIP) and CSV formats
- Parallel fetch all modules with Promise.all
- Markdown: Creates ZIP with one .md file per module using client-zip
- CSV: Combines all module CSVs into single file
- Timestamp-based filenames (YYYY-MM-DD)
- sanitize-filename for safe ZIP entry names
- Disabled state when no modules exist

### UI Integration

**Module Trace Page (`/analysis/modules/[id]`):**
- Export buttons positioned below module description
- Aligned left within header section
- Both MD and CSV export options visible

**Modules Page (`/modules`):**
- Bulk export buttons next to "New Module" button
- "Export All (ZIP)" for markdown ZIP download
- "Export All (CSV)" for combined CSV download
- Buttons disabled when modules array empty

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create export button components | 13e7f8e | ExportButtons.tsx, BulkExportButton.tsx |
| 2 | Integrate export buttons into pages | e7997c8 | page.tsx (trace + modules) |

## Technical Implementation

### Client-Side Download Pattern

```typescript
// Fetch from API
const response = await fetch(`/api/export/${format}/${moduleId}`)
const blob = await response.blob()

// Create download link
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = filename
link.click()

// Cleanup
link.remove()
URL.revokeObjectURL(url)
```

### Bulk Export Flow

1. **Parallel fetch:** Use Promise.all to fetch all modules simultaneously
2. **Format-specific handling:**
   - Markdown: Generate ZIP with client-zip, one .md file per module
   - CSV: Concatenate all CSV strings into single file
3. **Download:** Same URL.createObjectURL pattern as single export
4. **Filenames:** Include timestamp for version tracking

### Loading States

Each button maintains independent loading state:
- Single exports: `loadingMd` and `loadingCsv` separate
- Bulk exports: Single `loading` state per button instance
- Disabled state during operation prevents double-clicks

## Verification Performed

**TypeScript Compilation:**
- ✅ `npx tsc --noEmit` passed after each task

**Code Review:**
- ✅ Components follow existing patterns (Tailwind, dark mode)
- ✅ Imports added to both pages
- ✅ ExportButtons integrated in trace page header
- ✅ BulkExportButton integrated in modules page header
- ✅ All must_haves truths satisfied

**Dev Server Test:**
- ✅ Server started successfully on http://localhost:3000
- ✅ Export endpoint responding (confirmed with test request)
- ✅ TypeScript compilation working with new components

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues

None identified during implementation.

## Next Phase Readiness

**Phase 6 Complete:**
- ✅ Export infrastructure (Plan 01)
- ✅ Export UI (Plan 02)
- All success criteria met
- No blockers or concerns

**Export Feature Complete:**
- Users can export single modules (MD/CSV) from trace pages
- Users can bulk export all modules (ZIP/CSV) from modules list
- Loading states provide feedback during operations
- Error handling prevents silent failures
- File downloads work via browser download mechanism

**No remaining work in Phase 6.**

## Technical Debt

None introduced.

## Performance Considerations

**Bulk Export:**
- Parallel fetch minimizes total wait time
- All module data loaded into memory for ZIP/CSV generation
- Current scale (10-50 modules typical) handles well
- For hundreds of modules, may need streaming or chunked approach

**Browser Compatibility:**
- URL.createObjectURL widely supported (all modern browsers)
- client-zip uses Web Streams API (supported since 2020)
- No polyfills needed for target audience
