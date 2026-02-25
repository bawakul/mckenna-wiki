---
phase: 07-polish-fixes
plan: 01
subsystem: database, annotations
tags: [supabase, rls, row-level-security, annotations, selectors, typescript]

# Dependency graph
requires:
  - phase: 04-annotation-engine
    provides: annotations table, getOffsetInParagraph in selectors.ts, ParagraphView structure
  - phase: 05-analysis-views
    provides: module_traces view (inherits RLS from underlying tables)
provides:
  - RLS enabled on all four tables with permissive anon policies
  - Fixed highlight offset calculation scoped to <p> element only
affects: [future annotation work, any Supabase policy changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS with permissive anon policies for personal Supabase tools"
    - "querySelector('p') ?? element fallback for scoping DOM operations to text content"

key-files:
  created:
    - supabase/migrations/007_enable_rls.sql
  modified:
    - src/lib/annotations/selectors.ts

key-decisions:
  - "Permissive anon policies (USING true / WITH CHECK true) are sufficient for personal tool — no auth requirement in v1"
  - "Scope getOffsetInParagraph to <p> element via querySelector to exclude timestamp/speaker text from offset calculation"
  - "Existing annotations with wrong offsets left as-is — TextQuoteSelector exact text is correct so re-anchoring still works"

patterns-established:
  - "querySelector('p') ?? paragraph: fallback pattern for scoping text operations to <p> inside data-paragraph-id wrapper div"

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-02-25
---

# Phase 7 Plan 01: RLS Migration and Highlight Offset Fix Summary

**RLS enabled on all four Supabase tables with permissive anon policies, and highlight offset bug fixed by scoping getOffsetInParagraph to the `<p>` text element instead of the wrapper div**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T07:14:13Z
- **Completed:** 2026-02-25T07:15:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `supabase/migrations/007_enable_rls.sql` enabling RLS on transcripts, transcript_paragraphs, modules, and annotations tables with permissive "Allow all access" policies for the anon role
- Fixed the most user-visible annotation bug: highlight rendering shifted forward due to timestamp/speaker label text being included in offset calculation
- Scoped getOffsetInParagraph's paragraphText lookup and TreeWalker root to the `<p>` element inside the wrapper div, excluding non-paragraph text from offset computation
- TypeScript compiles cleanly with no new errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RLS migration with permissive policies** - `331f98e` (feat)
2. **Task 2: Fix highlight offset bug in getOffsetInParagraph** - `de79e20` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `supabase/migrations/007_enable_rls.sql` - 4 ALTER TABLE ENABLE ROW LEVEL SECURITY statements + 4 permissive CREATE POLICY statements for anon role
- `src/lib/annotations/selectors.ts` - getOffsetInParagraph now scopes to `<p>` via querySelector('p') for both paragraphText and TreeWalker root

## Decisions Made
- Permissive anon policies are sufficient for this personal tool — no authenticated users in v1
- The `module_traces` view automatically inherits RLS from its underlying tables (transcripts + annotations), no separate policy needed
- Existing annotations with wrong offsets are not migrated — the TextQuoteSelector `exact` field is correct and re-anchoring via text search still works for those annotations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**Apply migration via Supabase dashboard:** The SQL in `supabase/migrations/007_enable_rls.sql` must be run via the Supabase dashboard SQL editor (consistent with how migrations 001–006 have been applied). This enables RLS and creates the policies.

Steps:
1. Open Supabase dashboard > SQL Editor
2. Paste contents of `supabase/migrations/007_enable_rls.sql`
3. Run query
4. Verify app still loads and annotations still work

## Next Phase Readiness
- RLS migration ready to apply via Supabase dashboard
- Highlight offset bug fixed — new annotations will render correctly over selected text
- Existing highlight offset mismatches persist (acceptable per plan)
- Ready for Phase 7 Plan 02

---
*Phase: 07-polish-fixes*
*Completed: 2026-02-25*
