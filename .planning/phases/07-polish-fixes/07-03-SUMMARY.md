---
phase: 07-polish-fixes
plan: 03
subsystem: ui
tags: [dark-mode, tailwind, css-variables, next-js, react]

# Dependency graph
requires:
  - phase: 03-reading-interface
    provides: Reader pages and layout that now receive DarkModeToggle
  - phase: 04-annotation-engine
    provides: HighlightRenderer that will use --highlight-opacity and --untagged-highlight variables in Plan 04
provides:
  - Dark mode CSS variable infrastructure (globals.css)
  - Tailwind v4 @custom-variant dark rule
  - DarkModeToggle client component (sun/moon icons, fixed positioning)
  - Theme initialization inline script in layout <head>
  - localStorage-based theme persistence
  - System prefers-color-scheme detection
affects:
  - 07-04a-PLAN
  - 07-04b-PLAN
  - 07-04c-PLAN

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tailwind v4 @custom-variant for class-based dark mode (.dark class on documentElement)
    - CSS variable palettes in :root and .dark for theme switching
    - Inline script in layout <head> to prevent FOUC (flash of unstyled content)
    - useState(false) + useEffect sync pattern for Next.js dark mode toggle (avoids hydration mismatch)
    - Fixed positioning (top-4 right-4 z-50) for floating toggle above all page content

key-files:
  created:
    - src/components/DarkModeToggle.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx

key-decisions:
  - "Fixed positioning (top-4 right-4 z-50) for DarkModeToggle instead of navbar — app has no shared NavBar component, adding one would be a structural refactor beyond this plan's scope"
  - "useState(false) with useEffect sync for dark mode toggle — avoids hydration mismatch; brief wrong-icon flash acceptable"
  - "CSS variable --highlight-opacity (0.35 light / 0.5 dark) and --untagged-highlight (#e5e7eb / #4a4a6a) added as infrastructure for Plan 04 HighlightRenderer update"

patterns-established:
  - "Dark mode pattern: .dark class on <html> element toggled by JS, CSS variables switch palettes"
  - "Theme init: inline IIFE script in layout <head> reads localStorage then checks matchMedia — runs before React hydration"

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-02-25
---

# Phase 7 Plan 03: Dark Mode Infrastructure Summary

**Class-based dark mode with Tailwind v4 @custom-variant, soft Linear/Notion palette (#1a1a2e), sun/moon toggle fixed to viewport, and localStorage persistence with system preference detection**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T07:14:17Z
- **Completed:** 2026-02-25T07:15:30Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 updated)

## Accomplishments
- Dark mode CSS variable infrastructure with complete light/dark palettes in globals.css
- Tailwind v4 @custom-variant dark rule enabling dark: utility prefix throughout app
- --highlight-opacity and --untagged-highlight variables ready for Plan 04 HighlightRenderer update
- DarkModeToggle client component with sun/moon SVG icons (fixed top-right positioning)
- Theme initialization script in layout head preventing FOUC
- localStorage persistence and system prefers-color-scheme detection

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure dark mode CSS variables and Tailwind custom variant** - `d3fc297` (feat)
2. **Task 2: Add theme script and DarkModeToggle to layout** - `01adad6` (feat)

## Files Created/Modified
- `src/app/globals.css` - Added @custom-variant dark, :root light palette, .dark dark palette, --highlight-opacity, --untagged-highlight, and 200ms body transition
- `src/components/DarkModeToggle.tsx` - New client component with sun/moon toggle, localStorage persistence, classList.toggle
- `src/app/layout.tsx` - Added theme init IIFE in head, imported and rendered DarkModeToggle, updated metadata title to "McKenna Wiki"

## Decisions Made
- Fixed positioning (top-4 right-4 z-50) for DarkModeToggle instead of a shared NavBar — each page has its own inline header, creating a NavBar would be a structural refactor beyond this plan's scope. The fixed float achieves same UX: always-visible toggle above all content including sidebars (z-10/z-20).
- useState(false) with useEffect sync — standard Next.js pattern to avoid SSR hydration mismatch. Brief wrong-icon flash on initial load is acceptable per plan spec.
- --highlight-opacity and --untagged-highlight CSS variables added proactively as infrastructure for Plan 04's HighlightRenderer update (0.35 opacity light, 0.5 dark; #e5e7eb untagged light, #4a4a6a dark).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dark mode CSS infrastructure complete and ready for Plan 04 to add dark: utility variants to all components
- @custom-variant dark enables `dark:text-*`, `dark:bg-*`, `dark:border-*` etc. throughout the app
- --highlight-opacity and --untagged-highlight variables are defined and ready for HighlightRenderer integration
- TypeScript compiles without errors (verified via `npx tsc --noEmit`)

---
*Phase: 07-polish-fixes*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/app/globals.css
- FOUND: src/app/layout.tsx
- FOUND: src/components/DarkModeToggle.tsx
- FOUND: .planning/phases/07-polish-fixes/07-03-SUMMARY.md
- FOUND commit d3fc297 (Task 1: CSS variables)
- FOUND commit 01adad6 (Task 2: DarkModeToggle + layout)
