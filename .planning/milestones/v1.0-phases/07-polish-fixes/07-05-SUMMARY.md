---
phase: 07-polish-fixes
plan: 05
subsystem: annotations, selection, rendering
tags: [multi-paragraph, highlights, selection, treewalker, paragraph-anchors, typescript]

# Dependency graph
requires:
  - phase: 07-polish-fixes
    plan: 01
    provides: "getOffsetInParagraph scoped to <p> element; ParagraphAnchor type in selectors"
  - phase: 04-annotation-engine
    provides: "HighlightRenderer, useTextSelection, SelectionToolbar, VirtualizedReader, ParagraphAnchor type"
provides:
  - "Multi-paragraph highlight creation (up to 15 paragraphs)"
  - "Middle paragraph full-span rendering for multi-paragraph annotations"
  - "Selection cap with user-visible warning (MAX_HIGHLIGHT_PARAGRAPHS = 15)"
affects: [future annotation work, highlight rendering for all multi-paragraph spans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TreeWalker with SHOW_ELEMENT + NodeFilter to count data-paragraph-id elements in Range"
    - "compareBoundaryPoints for Range intersection detection"
    - "endOffset=999999 for full-paragraph highlights, safely clamped by splitIntoSegments"
    - "exceedsLimit state pattern: set on validation failure, auto-dismiss after 3s"

key-files:
  created: []
  modified:
    - src/components/annotations/useTextSelection.ts
    - src/lib/annotations/selectors.ts
    - src/components/annotations/HighlightRenderer.tsx
    - src/components/annotations/SelectionToolbar.tsx
    - src/components/transcripts/VirtualizedReader.tsx

key-decisions:
  - "Use 999999 as endOffset for middle paragraphs — splitIntoSegments already clamps with Math.min(endOffset, text.length), no parameter changes needed"
  - "Dual strategy in getAllParagraphsBetween: direct sibling walk first (fast path), TreeWalker fallback for virtualized DOM structures"
  - "exceedsLimit warning shown as fixed-position toast at top-center, auto-dismisses after 3s"
  - "handleHighlightClick already uses document.querySelector (first DOM match = start paragraph mark) — no changes needed for popover anchoring"
  - "Middle paragraph fallback in getHighlightForParagraph supports both new (explicit anchors) and legacy multi-paragraph annotations"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 7 Plan 05: Multi-Paragraph Highlights Summary

**Multi-paragraph highlight creation and rendering: paragraph count validation capped at 15, ParagraphAnchors stored for all spanned paragraphs, and middle paragraphs render as full-span highlights**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T09:17:00Z
- **Completed:** 2026-02-25T09:19:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Exported `MAX_HIGHLIGHT_PARAGRAPHS = 15` constant from `useTextSelection.ts`
- Added `countParagraphsInRange` using TreeWalker + compareBoundaryPoints for reliable paragraph intersection detection
- Added `exceedsLimit` state and `clearExceedsLimit` callback to `useTextSelection` hook
- `SelectionToolbar` accepts `exceedsLimit`/`onClearExceedsLimit` props and shows fixed-position warning toast, auto-dismissed after 3 seconds
- `VirtualizedReader` passes new props to `SelectionToolbar`
- Added `getAllParagraphsBetween` to `selectors.ts` with sibling-walk fast path and TreeWalker fallback
- `createSelectorFromRange` now inserts explicit full-span `ParagraphAnchor` entries for all middle paragraphs
- `getHighlightForParagraph` in `HighlightRenderer.tsx`: added `isMiddle` fallback returning `{startOffset: 0, endOffset: 999999}` for paragraphs between start and end IDs
- Verified `handleHighlightClick` in `VirtualizedReader` already returns first DOM mark (start paragraph) — popover anchoring correct without changes
- TypeScript compiles without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Paragraph count validation and multi-paragraph selector creation** - `fdc04a2` (feat)
2. **Task 2: Update highlight rendering for multi-paragraph spans** - `377d77d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/annotations/useTextSelection.ts` - Added MAX_HIGHLIGHT_PARAGRAPHS, countParagraphsInRange, exceedsLimit state
- `src/lib/annotations/selectors.ts` - Added getAllParagraphsBetween, middle paragraph ParagraphAnchors in createSelectorFromRange
- `src/components/annotations/HighlightRenderer.tsx` - Added isMiddle fallback in getHighlightForParagraph
- `src/components/annotations/SelectionToolbar.tsx` - exceedsLimit warning toast with auto-dismiss
- `src/components/transcripts/VirtualizedReader.tsx` - Thread exceedsLimit/clearExceedsLimit to SelectionToolbar

## Decisions Made

- `endOffset: 999999` is safe for full-paragraph highlights because `splitIntoSegments` clamps via `Math.min(highlight.endOffset, text.length)` — avoids adding `paragraphTextLength` parameter
- Dual-strategy `getAllParagraphsBetween`: sibling walk handles direct parent/children, TreeWalker fallback handles virtualized DOM nesting
- Warning toast positioned `fixed top-4 left-1/2 -translate-x-1/2` (centered, not floating-UI anchored) since there is no selection rect when the limit is exceeded
- Middle paragraph fallback supports legacy annotations (pre-plan-05) that lack explicit middle anchors in their selector

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED

- `src/components/annotations/useTextSelection.ts` - FOUND
- `src/lib/annotations/selectors.ts` - FOUND
- `src/components/annotations/HighlightRenderer.tsx` - FOUND
- `src/components/annotations/SelectionToolbar.tsx` - FOUND
- `src/components/transcripts/VirtualizedReader.tsx` - FOUND
- Commit fdc04a2 - FOUND
- Commit 377d77d - FOUND
- TypeScript: no errors

---
*Phase: 07-polish-fixes*
*Completed: 2026-02-25*
