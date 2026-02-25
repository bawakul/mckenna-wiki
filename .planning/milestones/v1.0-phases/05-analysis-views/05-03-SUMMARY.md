---
phase: 05-analysis-views
plan: 03
subsystem: ui
tags: [navigation, module-tracing, routing, react, next.js]

# Dependency graph
requires:
  - phase: 05-02
    provides: Module trace page UI with TraceList component
  - phase: 02-04
    provides: ModuleCard component on modules page
provides:
  - ModuleSwitcher dropdown component for switching between module traces
  - Module cards display passage counts and "View traces" links
  - Complete navigation flow: Modules → Trace → Different Trace
affects: [05-04, future-navigation-improvements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dropdown navigation pattern with backdrop and z-index layering"
    - "Efficient annotation counting via single query with client-side aggregation"

key-files:
  created:
    - src/components/analysis/ModuleSwitcher.tsx
  modified:
    - src/app/analysis/modules/[id]/page.tsx
    - src/components/modules/ModuleCard.tsx
    - src/app/modules/page.tsx

key-decisions:
  - "Simple dropdown implementation without Floating UI dependency for module switcher"
  - "Client-side count aggregation for passage counts (efficient for expected data scale)"
  - "Non-link ModuleCard with action links (Edit + View traces) instead of single clickable card"

patterns-established:
  - "Backdrop pattern for dropdowns: fixed inset-0 z-10 layer with click-to-close"
  - "Parallel data fetching in modules page: modules + annotations together"
  - "Optional props for backward compatibility (passageCount?: number)"

# Metrics
duration: 2min
completed: 2026-02-14
---

# Phase 05 Plan 03: Navigation Entry Points Summary

**Module switcher dropdown and passage counts on module cards enable complete navigation flow through trace views**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-14T13:12:11Z
- **Completed:** 2026-02-14T13:14:01Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Users can switch between module traces using dropdown in trace view header
- Module cards show passage counts next to "View traces" link
- Complete navigation flow works: Modules page → Trace view → Different module trace

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Create ModuleSwitcher and integrate in trace page** - `da2cfa9` (feat)
2. **Task 3: Add passage counts and trace links to module cards** - `e90f43f` (feat)

## Files Created/Modified
- `src/components/analysis/ModuleSwitcher.tsx` - Dropdown for switching between module traces with color indicators
- `src/app/analysis/modules/[id]/page.tsx` - Added ModuleSwitcher to header, fetches all modules for dropdown
- `src/components/modules/ModuleCard.tsx` - Shows "Edit" and "View traces" actions with passage count
- `src/app/modules/page.tsx` - Fetches annotation counts and passes to ModuleCard

## Decisions Made

**Simple dropdown implementation**
- Used basic dropdown with backdrop instead of Floating UI
- Rationale: Simpler implementation for straightforward use case, no complex positioning needed

**Client-side count aggregation**
- Single query for all annotations, count aggregated in JavaScript
- Rationale: Efficient for expected scale (thousands of annotations, tens of modules)

**Non-clickable card with action links**
- ModuleCard changed from Link wrapper to div with separate Edit/View traces links
- Rationale: Supports two navigation targets from one card

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Navigation entry points complete. Ready for plan 05-04 (analysis landing page if needed) or Phase 6.

All module tracing features now fully accessible:
- From modules page: click "View traces" to see module passages
- From trace view: switch to different module via dropdown
- Passage counts visible on module cards for quick overview

---
*Phase: 05-analysis-views*
*Completed: 2026-02-14*
