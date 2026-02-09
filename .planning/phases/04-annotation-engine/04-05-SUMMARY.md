---
phase: 04-annotation-engine
plan: 05
subsystem: ui
tags: [react, floating-ui, annotations, sidebar, popover]

# Dependency graph
requires:
  - phase: 04-02
    provides: annotation CRUD Server Actions
  - phase: 04-04
    provides: highlight rendering with data-annotation-id attributes
provides:
  - HighlightPopover for viewing/editing highlights
  - AnnotationSidebar for listing and navigating annotations
  - scrollToAnnotation utility for jump-to navigation
  - useVisibleAnnotations hook for tracking visible marks
affects: [04-06, 04-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Virtual reference pattern for anchoring popover to highlight mark"
    - "IntersectionObserver for tracking visible annotations"
    - "Fixed sidebar with toggle button pattern"

key-files:
  created:
    - src/components/annotations/HighlightPopover.tsx
    - src/components/annotations/AnnotationSidebar.tsx
  modified: []

key-decisions:
  - "Popover anchors to clicked mark element via refs.setReference"
  - "Delete confirmation inline in popover (not separate dialog)"
  - "Sidebar uses amber accent to highlight visible annotations"
  - "Toggle button positioned fixed right-4 top-24 with count badge"

patterns-established:
  - "scrollToAnnotation utility uses data-annotation-id selector"
  - "useVisibleAnnotations uses IntersectionObserver with 100ms delay for DOM readiness"

# Metrics
duration: 2min
completed: 2026-02-09
---

# Phase 04 Plan 05: Annotation Popover and Sidebar Summary

**HighlightPopover for editing highlights with ModuleSelector integration, and AnnotationSidebar with jump-to navigation and visibility tracking**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T20:55:25Z
- **Completed:** 2026-02-09T20:57:12Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- HighlightPopover with text preview, module tagging, and delete with confirmation
- AnnotationSidebar with sorted annotation list and scroll-to navigation
- useVisibleAnnotations hook for tracking which highlights are in viewport
- scrollToAnnotation utility for programmatic scrolling to highlights

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HighlightPopover component** - `a3047cc` (feat)
2. **Task 2: Create AnnotationSidebar component** - `57e8da8` (feat)

## Files Created

- `src/components/annotations/HighlightPopover.tsx` - Popover for viewing/editing highlight details, module tagging, deletion
- `src/components/annotations/AnnotationSidebar.tsx` - Sidebar listing all annotations with navigation and visibility tracking

## Decisions Made

- **Popover anchors to mark element:** Uses refs.setReference(anchorElement) from Floating UI to position relative to clicked highlight
- **Delete confirmation inline:** Confirmation appears inline in popover rather than separate dialog, keeping interaction contained
- **Sidebar visibility tracking:** Uses IntersectionObserver with 0.1 threshold to detect which annotations are in viewport
- **Amber accent for visible:** Visible annotations highlighted with amber-400 left border and amber-50 background
- **Toggle button with badge:** Fixed position button shows annotation count badge when sidebar is closed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Popover and sidebar components ready for integration
- Next: 04-06 (Full Integration) will wire these components into VirtualizedReader
- Need to add state management for active annotation and sidebar visibility

---
*Phase: 04-annotation-engine*
*Completed: 2026-02-09*
