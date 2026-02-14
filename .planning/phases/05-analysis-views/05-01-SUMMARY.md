---
phase: 05-analysis-views
plan: 01
subsystem: database
tags: [postgresql, views, supabase, typescript, query-optimization]

# Dependency graph
requires:
  - phase: 04-annotation-engine
    provides: annotations table with module_id, transcript_id, and selector data
provides:
  - module_traces PostgreSQL view joining annotations, transcripts, and modules
  - ModuleTrace TypeScript interface matching view output
  - Query functions (getModuleTraces, getModuleWithCount) for trace data
affects: [05-02, 05-03, analysis-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PostgreSQL views for denormalized query optimization"
    - "Parallel fetching with Promise.all in query functions"

key-files:
  created:
    - supabase/migrations/006_create_module_traces_view.sql
    - src/lib/types/trace.ts
    - src/lib/queries/module-traces.ts
  modified: []

key-decisions:
  - "INNER JOIN with transcripts filters orphaned annotations"
  - "LEFT JOIN with modules supports untagged highlights"
  - "ORDER BY in view (t.date ASC NULLS LAST) for chronological sorting"
  - "Regular view (not materialized) sufficient for 1000-row scale"

patterns-established:
  - "View-based query abstraction for complex joins"
  - "Server-side only query functions in lib/queries/"

# Metrics
duration: 2min
completed: 2026-02-14
---

# Phase 5 Plan 1: Module Traces Foundation Summary

**PostgreSQL view denormalizing annotations with transcript/module metadata, TypeScript types, and server-side query functions for cross-corpus module tracing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-14T07:29:36Z
- **Completed:** 2026-02-14T07:31:08Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `module_traces` PostgreSQL view joining annotations, transcripts, and modules
- Implemented TypeScript types matching view output structure
- Built query functions for fetching traces and module counts in parallel
- Verified TypeScript compilation with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create module_traces database view** - `360a6e2` (feat)
2. **Task 2: Create TypeScript types and query functions** - `0e460bd` (feat)

## Files Created/Modified

- `supabase/migrations/006_create_module_traces_view.sql` - PostgreSQL view definition with chronological sorting
- `src/lib/types/trace.ts` - ModuleTrace interface matching view output
- `src/lib/queries/module-traces.ts` - Server-side query functions (getModuleTraces, getModuleWithCount)

## Decisions Made

**INNER JOIN vs LEFT JOIN strategy:**
- INNER JOIN with transcripts filters out orphaned annotations (annotations with deleted transcripts)
- LEFT JOIN with modules preserves untagged highlights (module_id can be null)
- Matches existing data model where highlights can exist without module tags

**Regular view instead of materialized:**
- 1000 annotations is small by PostgreSQL standards
- Existing indexes (idx_annotations_module, idx_annotations_transcript) accelerate queries
- Research indicates <200ms performance without materialization complexity
- Can materialize later if profiling shows need (unlikely)

**Chronological sort with NULLS LAST:**
- Default sort: `ORDER BY t.date ASC NULLS LAST, a.created_at ASC`
- Lectures with known dates appear chronologically (oldest first)
- Lectures with unknown dates appear at end (not interspersed)
- Consistent with Phase 3 chronological ordering pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Supabase local project not linked:**
- `npx supabase db push` failed (no project ref)
- Migration file created and committed
- **Resolution:** Migration will be applied via Supabase dashboard SQL editor
- **Impact:** No functional difference - migration runs the same way

## User Setup Required

**Database migration must be applied manually:**

1. Open Supabase dashboard SQL editor: https://bzlpkrvppwspxeqgijlo.supabase.co
2. Copy contents of `supabase/migrations/006_create_module_traces_view.sql`
3. Run in SQL editor
4. Verify view exists:
   ```sql
   SELECT * FROM module_traces LIMIT 1;
   ```

**Why manual:** Local Supabase CLI not linked to project. Migration file is version-controlled but requires dashboard execution.

## Next Phase Readiness

**Ready for trace page implementation:**
- Database view exists (after manual migration)
- TypeScript types defined and compile successfully
- Query functions ready for use by Server Components
- View leverages existing indexes from Phase 4

**Blockers:**
- Manual migration must be applied before trace pages can query view
- View returns empty results until annotations are created (expected)

**Concerns:**
- Query performance not yet profiled with real data (defer to 05-02 or later)
- Paragraph context fetching pattern (for expanded cards) not yet decided

---
*Phase: 05-analysis-views*
*Completed: 2026-02-14*
