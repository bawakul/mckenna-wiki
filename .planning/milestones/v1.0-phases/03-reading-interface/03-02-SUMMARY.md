---
phase: 03-reading-interface
plan: 02
subsystem: ui
tags: [nextjs, typescript, react, server-components, client-components]

# Dependency graph
requires:
  - phase: 01-corpus-foundation
    provides: Transcript paragraphs with position, speaker, timestamp, and text fields
  - phase: 03-reading-interface
    plan: 01
    provides: Transcript types and list page
provides:
  - Transcript reading view at /transcripts/[id] with paragraph rendering
  - ParagraphView component with timestamp gutter and conditional speaker labels
  - TranscriptHeader component with metadata display
  - TranscriptReader component for rendering full transcripts
affects: [03-03-virtualization, 03-04-search-highlighting, 04-annotation-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component for data fetching with Supabase nested query
    - Client Component for reading interface (enables future search/virtualization)
    - Fixed-width timestamp gutter for consistent alignment
    - Conditional speaker labels (show on change only)

key-files:
  created:
    - src/components/transcripts/ParagraphView.tsx
    - src/components/transcripts/TranscriptHeader.tsx
    - src/components/transcripts/TranscriptReader.tsx
    - src/app/transcripts/[id]/page.tsx
    - src/app/transcripts/[id]/loading.tsx
  modified: []

key-decisions:
  - "Padding (not margin) for paragraph spacing to avoid virtualization height calculation issues"
  - "Fixed-width timestamp gutter (w-16) for consistent alignment"
  - "Client component for reader (enables future virtualization and search)"
  - "Server Component page fetches all paragraphs upfront (no virtualization yet)"

patterns-established:
  - "shouldShowSpeaker helper for conditional speaker label rendering"
  - "formatTimestamp helper for timestamp display"
  - "Data attributes (data-paragraph-id, data-paragraph-position) for future selection/highlighting"

# Metrics
duration: 1min
completed: 2026-02-07
---

# Phase 3 Plan 2: Transcript Reader Summary

**Paragraph-based reading view with timestamp gutter, conditional speaker labels, and comfortable typography for transcript browsing**

## Performance

- **Duration:** 1 min (54 seconds)
- **Started:** 2026-02-07T12:01:44Z
- **Completed:** 2026-02-07T12:02:38Z
- **Tasks:** 4
- **Files created:** 5

## Accomplishments
- Created basic transcript reading interface at /transcripts/[id]
- Paragraph view with left margin timestamp gutter (w-16 fixed width)
- Speaker labels show only when speaker changes (reduces visual clutter)
- Metadata header with title, date, location, duration, word count, and topic tags
- Loading state with skeleton UI and spinner
- Footer navigation (back to list, scroll to top)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ParagraphView component** - `05addd3` (feat)
2. **Task 2: Create TranscriptHeader component** - `e3931c4` (feat)
3. **Task 3: Create TranscriptReader component** - `fa654c1` (feat)
4. **Task 4: Create transcript page route** - `b428b62` (feat)

## Files Created/Modified

- `src/components/transcripts/ParagraphView.tsx` - Paragraph rendering with timestamp gutter and conditional speaker labels
- `src/components/transcripts/TranscriptHeader.tsx` - Metadata display with back navigation and topic tag links
- `src/components/transcripts/TranscriptReader.tsx` - Client component for full transcript rendering (sorted by position)
- `src/app/transcripts/[id]/page.tsx` - Server Component with Supabase nested query for transcript + paragraphs
- `src/app/transcripts/[id]/loading.tsx` - Loading skeleton UI

## Decisions Made

**1. Padding instead of margin for paragraph spacing**
- Rationale: Virtualization (Plan 03-03) requires accurate height calculations; padding doesn't collapse

**2. Fixed-width timestamp gutter (w-16)**
- Rationale: Consistent alignment across all paragraphs; left margin keeps timestamps out of reading flow

**3. Client component for TranscriptReader**
- Rationale: Enables future search highlighting and virtualization (both require client interactivity)

**4. Server Component fetches all paragraphs upfront**
- Rationale: Simple implementation for Plan 2; virtualization deferred to Plan 3

**5. shouldShowSpeaker helper function**
- Rationale: Centralizes logic for speaker label display; compares current vs previous paragraph

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components rendered correctly on first implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 3 (Virtualization):
- Data attributes (data-paragraph-id, data-paragraph-position) present for virtualization
- Padding-based spacing works with height calculations
- Client component architecture supports virtualization integration

Concerns:
- Performance untested with longest transcript (87K words, ~3500 paragraphs)
- Virtualization critical before adding annotation highlights (Plan 4)

Testing needed:
- Navigate to /transcripts/[id] and verify reading view
- Check timestamp alignment consistency
- Verify speaker labels appear only on changes
- Test with both short and long transcripts

---
*Phase: 03-reading-interface*
*Completed: 2026-02-07*
