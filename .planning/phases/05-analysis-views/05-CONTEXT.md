# Phase 5: Analysis Views - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Cross-corpus pattern discovery through module tracing. Display all passages tagged with a specific module across all lectures, sorted chronologically. Users see how themes appear and evolve across McKenna's body of work.

This phase does NOT include: comparative analysis between modules, statistical dashboards, or visualization charts.

</domain>

<decisions>
## Implementation Decisions

### Trace View Layout
- Card stack layout — each passage as distinct card with clear separation
- Expandable context — highlighted text by default, click to reveal paragraph plus neighbors
- Minimal metadata on cards — lecture title + date only
- "View in lecture" button on each card navigates to transcript reader (same tab)
- Header shows passage count: "Time (47 passages)"
- Chronological order (oldest first) — no timeline visual, just sort order
- No evolution markers or year groupings — user draws their own conclusions
- No bulk actions — view only, editing happens in transcript reader
- Load all passages at once — no pagination or virtual scroll

### Navigation & Filtering
- Both entry paths work: navigate from modules page OR switch modules within trace view
- No date range filtering — always show all passages
- Text search within trace — filter passages by keyword
- Shareable URLs: /analysis/modules/[id] — bookmarkable traces

### Passage Presentation
- Module color as text highlight (background color on text, consistent with reader)
- Expanded view shows paragraph containing highlight plus one paragraph before and after
- Show other module tags as small chips/dots when passage has multiple modules

### Entry Points
- Modules page: each module card has "View traces" action with passage count displayed
- Dedicated analysis landing page: module grid showing all modules with passage counts
- No top-level nav item for Analysis — accessed through Modules section

### Claude's Discretion
- Exact card styling (shadows, borders, spacing)
- Search input placement and styling
- Module selector dropdown design within trace view
- Loading states and transitions
- How to handle modules with zero passages

</decisions>

<specifics>
## Specific Ideas

- Cards should feel scannable — the chronological flow of McKenna discussing a concept is the core value
- "View in lecture" is important even though metadata is minimal — need the quick path back to full context
- Cross-module chips on passages help spot theme intersections without separate comparative features

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-analysis-views*
*Context gathered: 2026-02-13*
