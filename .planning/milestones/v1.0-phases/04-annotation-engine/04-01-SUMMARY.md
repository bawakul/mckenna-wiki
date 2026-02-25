---
phase: 04-annotation-engine
plan: 01
subsystem: database
tags: [annotations, w3c-selectors, jsonb, postgresql, typescript]

# Dependency graph
requires:
  - phase: 01-corpus-foundation
    provides: transcripts and transcript_paragraphs tables
  - phase: 02-module-system
    provides: modules table for tagging
provides:
  - Annotations table with hybrid W3C selector storage
  - TypeScript types for annotation system
  - Selector creation utilities for DOM Range conversion
affects: [04-02, 04-03, 04-04, annotation-crud, highlight-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - W3C Web Annotation hybrid selectors (TextQuote + TextPosition + ParagraphAnchor)
    - JSONB for flexible selector storage with GIN index
    - DOM Range to W3C selector conversion

key-files:
  created:
    - supabase/migrations/005_create_annotations_table.sql
    - src/lib/types/annotation.ts
    - src/lib/annotations/selectors.ts
  modified: []

key-decisions:
  - "JSONB for selector column - allows evolving selector strategy without migrations"
  - "ON DELETE SET NULL for module_id - highlights persist without module tag"
  - "ON DELETE CASCADE for paragraph FKs - annotations removed if paragraph deleted"
  - "32-char prefix/suffix for TextQuoteSelector (SELECTOR_CONTEXT_LENGTH constant)"

patterns-established:
  - "W3C RangeSelector with refinedBy array for fallback anchoring strategies"
  - "data-paragraph-id attribute for DOM-to-database paragraph linking"
  - "TreeWalker for precise character offset calculation"

# Metrics
duration: 3min
completed: 2026-02-09
---

# Phase 04 Plan 01: Annotation Foundation Summary

**W3C-compliant annotation schema with hybrid selectors (TextQuote + TextPosition + ParagraphAnchor) and DOM Range conversion utilities**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-09T20:41:33Z
- **Completed:** 2026-02-09T20:44:28Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Annotations table with JSONB selector storage and proper foreign keys
- TypeScript types matching W3C Web Annotation model
- Selector utilities for word boundary snapping and hybrid selector creation
- GIN index on selector JSONB for efficient re-anchoring queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Create annotations database migration** - `631582f` (feat)
2. **Task 2: Create annotation TypeScript types** - `2ed5660` (feat)
3. **Task 3: Create selector utilities** - `9d4baf0` (feat)

## Files Created/Modified

- `supabase/migrations/005_create_annotations_table.sql` - Annotations table with hybrid selector storage
- `src/lib/types/annotation.ts` - TypeScript types for W3C selectors and annotations
- `src/lib/annotations/selectors.ts` - DOM Range to W3C selector conversion utilities

## Decisions Made

- **JSONB for selector column:** Flexible storage allows evolving selector strategy without database migrations
- **ON DELETE SET NULL for module_id:** Highlights exist independently; deleting module keeps the highlight
- **ON DELETE CASCADE for paragraph FKs:** Deleting a paragraph removes annotations (data integrity)
- **32-char context length:** Standard W3C prefix/suffix length for TextQuoteSelector

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added explicit TypeScript type annotations for sibling traversal**
- **Found during:** Task 3 (Selector utilities)
- **Issue:** TypeScript inferred implicit `any` for `prev` and `next` variables due to circular reference in DOM traversal
- **Fix:** Added explicit `ChildNode | null` type annotations
- **Files modified:** src/lib/annotations/selectors.ts
- **Verification:** Build passes with no type errors
- **Committed in:** 9d4baf0 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type annotation fix required for TypeScript strictness. No scope creep.

## Issues Encountered

- Supabase CLI not linked to cloud project (expected for local dev) - SQL syntax verified by pattern matching with existing migrations

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Database schema ready for annotation CRUD operations
- TypeScript types ready for import in components and actions
- Selector utilities ready for use with DOM Range from text selection
- Next: Annotation CRUD server actions (04-02)

---
*Phase: 04-annotation-engine*
*Completed: 2026-02-09*
