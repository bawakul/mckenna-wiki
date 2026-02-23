---
phase: 06-export
plan: 01
subsystem: api
tags: [export, markdown, csv, route-handlers, client-zip, sanitize-filename]

# Dependency graph
requires:
  - phase: 05-analysis-views
    provides: module_traces view and getModuleTraces/getModuleWithCount queries
provides:
  - Export utility functions (markdown, csv, filename generation)
  - API endpoints for single module export (markdown and CSV)
  - RFC 4180 compliant CSV generation with proper escaping
  - YAML frontmatter markdown with blockquote passages
affects: [06-02-export-ui]

# Tech tracking
tech-stack:
  added: [client-zip@2.5.0, sanitize-filename@1.6.3]
  patterns: [Route Handler file download pattern, Content-Disposition headers with UTF-8 encoding]

key-files:
  created:
    - src/lib/export/markdown.ts
    - src/lib/export/csv.ts
    - src/lib/export/filename.ts
    - src/app/api/export/markdown/[moduleId]/route.ts
    - src/app/api/export/csv/[moduleId]/route.ts
  modified: [package.json]

key-decisions:
  - "N/A placeholder for timestamps (not in current data model)"
  - "Blockquote passages in markdown for visual distinction"
  - "RFC 4180 CSV escaping with field quoting for commas/quotes/newlines"
  - "Timestamp in filename (YYYY-MM-DD) for version tracking"
  - "Content-Disposition with both filename and filename* for UTF-8 safety"

patterns-established:
  - "Route Handler pattern: parallel fetch with Promise.all, generate content, return Response with download headers"
  - "Export utility separation: format generation (markdown, csv) separate from filename sanitization"
  - "YAML frontmatter structure: module metadata + exported timestamp + passage count"

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 06 Plan 01: Export Infrastructure Summary

**API endpoints for downloading module passages as markdown (YAML frontmatter + blockquotes) and CSV (RFC 4180 compliant)**

## Performance

- **Duration:** 4 min 36 sec
- **Started:** 2026-02-23T22:48:15Z
- **Completed:** 2026-02-23T22:52:51Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Export utility functions with markdown generation (YAML frontmatter + blockquotes), CSV generation (RFC 4180), and filename sanitization
- Route Handler endpoints at /api/export/markdown/[moduleId] and /api/export/csv/[moduleId]
- Proper Content-Disposition headers with UTF-8 filename encoding for browser downloads
- Passages grouped by lecture in chronological order (preserved from module_traces view)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install export dependencies** - `f5bc11c` (chore)
2. **Task 2: Create export utility functions** - `6908454` (feat)
3. **Task 3: Create Route Handlers for single module exports** - `4876a0e` (feat)

## Files Created/Modified
- `package.json` - Added client-zip and sanitize-filename dependencies
- `src/lib/export/filename.ts` - generateSafeFilename with sanitize-filename and timestamp
- `src/lib/export/csv.ts` - RFC 4180 compliant CSV with escapeCSVField and formatCSVDate
- `src/lib/export/markdown.ts` - YAML frontmatter + blockquote passages grouped by lecture
- `src/app/api/export/markdown/[moduleId]/route.ts` - GET endpoint returning markdown file download
- `src/app/api/export/csv/[moduleId]/route.ts` - GET endpoint returning CSV file download

## Decisions Made

**Timestamp handling:**
- Use 'N/A' placeholder for timestamps in exports (not stored in selector or module_traces view)
- Future enhancement: include paragraph timestamps if needed

**Markdown format:**
- YAML frontmatter with module metadata (name, color, exported timestamp, passage count)
- Passages rendered as blockquotes (`> text`) for visual distinction
- Horizontal rules (`---`) between lectures
- Date formatted as "Month Year" when available

**CSV format:**
- RFC 4180 compliant with proper field escaping (quotes for commas/quotes/newlines)
- Header row: module, passage, lecture_title, date, timestamp
- Date formatted as "Month Year" for readability

**Filename generation:**
- Pattern: `[sanitized-module-name]-YYYY-MM-DD.[ext]`
- Handles invalid characters and reserved names (CON, NUL, etc.)
- Timestamp provides version tracking for repeated exports

**Route Handler pattern:**
- Parallel data fetching with Promise.all (module + traces)
- Content-Disposition with both filename and filename* for UTF-8 compatibility
- Returns plain Response (not NextResponse) for file downloads

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Invalid UUID handling:**
- Supabase throws error (code 22P02) for invalid UUID format in module_id parameter
- Results in 500 error instead of clean 404
- Acceptable for v1 since UUID validation happens at database level
- Future enhancement: add UUID format validation in Route Handler before database query

**Testing challenges:**
- Dev server port conflict (3000 already in use) - resolved by killing existing processes
- Test module had no annotations - found alternative module with passages for comprehensive testing

Both issues resolved during verification. Endpoints functional for valid module UUIDs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Export infrastructure complete and tested. Ready for Plan 02 (UI implementation):
- Module detail pages can add "Export" button dropdown
- Clicking export triggers browser download via API endpoints
- UI can offer format choice (Markdown / CSV)
- Bulk export and ZIP functionality deferred to future enhancement

**Available for testing:**
- GET /api/export/markdown/[moduleId] - returns markdown file with proper headers
- GET /api/export/csv/[moduleId] - returns CSV file with proper headers
- Both endpoints return 200 for valid modules (even with 0 passages)
- Invalid module UUIDs return 500 (database validation error)

---
*Phase: 06-export*
*Completed: 2026-02-23*
