---
phase: 07-polish-fixes
plan: 04b
subsystem: ui
tags: [dark-mode, tailwind, css-variables, annotations, modules]

# Dependency graph
requires:
  - phase: 07-polish-fixes
    plan: 03
    provides: CSS variables --highlight-opacity and --untagged-highlight in globals.css
  - phase: 04-annotation-engine
    provides: AnnotationSidebar, SelectionToolbar, HighlightPopover, HighlightRenderer components
  - phase: 02-module-system
    provides: ModuleCard, ModuleForm, ModuleSelector, DeleteModuleDialog, InlineModuleCreator
provides:
  - Dark mode support for AnnotationSidebar (toggle button, sidebar panel, annotation list)
  - Dark mode support for SelectionToolbar (toolbar background, limit warning toast)
  - HighlightRenderer using CSS variables for theme-aware opacity and untagged color
affects:
  - All transcript reader pages (annotation rendering adapts to dark mode)
  - Module management pages (already had zinc dark variants)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS variable fallback pattern: var(--custom-var, fallback-value) for inline styles
    - Tailwind dark: variants with custom hex palette (#1a1a2e, #2d2d4a, #9090b0, etc.)
    - rgba() with CSS variable opacity: rgba(r, g, b, var(--highlight-opacity, 0.35))

key-files:
  created: []
  modified:
    - src/components/annotations/AnnotationSidebar.tsx
    - src/components/annotations/SelectionToolbar.tsx
    - src/components/annotations/HighlightRenderer.tsx

key-decisions:
  - "CSS variable fallback pattern used in HighlightRenderer inline styles: var(--untagged-highlight, #e5e7eb) and var(--highlight-opacity, 0.35) — no JS theme detection needed, adapts automatically via CSS"
  - "Module components (ModuleCard, ModuleForm, ModuleSelector, DeleteModuleDialog, InlineModuleCreator, new/page.tsx, [id]/edit/page.tsx) already had zinc dark variants from prior implementation — no changes needed"
  - "HighlightPopover already had dark:bg-zinc-900 and zinc dark variants from prior implementation — no changes needed"

patterns-established:
  - "CSS variables in rgba() inline styles: rgba(r, g, b, var(--highlight-opacity, 0.35)) for theme-aware highlight opacity"
  - "var() with fallback in inline style: backgroundColor: 'var(--untagged-highlight, #e5e7eb)' for safe CSS variable usage"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 7 Plan 04b: Module and Annotation Dark Mode Summary

**Dark mode variants for annotation sidebar and selection toolbar; HighlightRenderer updated to use CSS variables for theme-aware highlight opacity and untagged highlight color**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T09:18:00Z
- **Completed:** 2026-02-25T09:20:51Z
- **Tasks:** 2
- **Files modified:** 3 (0 created, 3 updated)

## Accomplishments

- AnnotationSidebar: dark mode for toggle button, sidebar panel, header, annotation list items, module badges, text snippets
- SelectionToolbar: dark mode for floating toolbar and limit warning toast (amber-themed buttons unchanged)
- HighlightRenderer: CSS variable integration for theme-aware rendering without JS — `var(--untagged-highlight)` and `var(--highlight-opacity)` in inline styles

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dark mode to module and annotation components** - `f4c02e5` (feat, prior run: AnnotationSidebar)
   - SelectionToolbar dark mode was included in `a9ea1fc` along with Task 2
2. **Task 2: Update HighlightRenderer to use CSS variables** - `a9ea1fc` (feat)

## Files Created/Modified

- `src/components/annotations/AnnotationSidebar.tsx` - Toggle button and sidebar panel: bg-white/dark:#1a1a2e, border-gray-200/dark:#2d2d4a, text colors, hover states, annotation list items
- `src/components/annotations/SelectionToolbar.tsx` - Toolbar and limit toast: dark bg and border variants added
- `src/components/annotations/HighlightRenderer.tsx` - getHighlightStyle: untagged uses var(--untagged-highlight, #e5e7eb), tagged uses var(--highlight-opacity, 0.35) in rgba()

## Decisions Made

- CSS variable fallback pattern in inline styles: `backgroundColor: 'var(--untagged-highlight, #e5e7eb)'` — safe usage with fallback values for browsers/contexts without CSS variable support
- rgba() with CSS variable: `rgba(${r}, ${g}, ${b}, var(--highlight-opacity, 0.35))` — opacity adapts to dark mode (0.35 light, 0.5 dark) via the CSS variable defined in globals.css by Plan 07-03
- Module components all had zinc dark variants from their original Phase 2 implementation — no changes were needed. The plan's custom palette (#1a1a2e etc.) is used for the annotation components which were originally written without dark mode.

## Deviations from Plan

### Pre-completed Items

**1. [Context] Module components already had dark variants**
- **Found during:** Task 1 inspection
- **Issue:** ModuleCard, ModuleForm, ModuleSelector, DeleteModuleDialog, InlineModuleCreator, and both module page files already had complete zinc dark mode variants from Phase 2 implementation
- **Action:** No changes made — plan's instruction to "add dark: variants" was satisfied by existing code
- **Files modified:** None (correctly)

**2. [Context] HighlightPopover already had dark variants**
- **Found during:** Task 1 inspection
- **Issue:** HighlightPopover had `dark:bg-zinc-900`, `dark:border-zinc-700`, `dark:text-zinc-*` variants from Phase 4 implementation
- **Action:** No changes made — already dark mode compatible

**3. [Context] Prior partial execution**
- **Found during:** Git log inspection
- **Issue:** A prior partial execution of this plan had already committed AnnotationSidebar dark mode (`f4c02e5`) and SelectionToolbar dark mode was included in an earlier commit
- **Action:** Verified work was complete, proceeded to Task 2 only

## Issues Encountered

None beyond the prior partial execution state, which was handled by verification.

## User Setup Required

None.

## Next Phase Readiness

- All module and annotation components support dark mode
- Highlight rendering uses CSS variables — no JS theme detection required
- CSS variables --highlight-opacity and --untagged-highlight from globals.css (Plan 07-03) are now fully utilized
- TypeScript compiles without errors

---
*Phase: 07-polish-fixes*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/components/annotations/AnnotationSidebar.tsx
- FOUND: src/components/annotations/SelectionToolbar.tsx
- FOUND: src/components/annotations/HighlightRenderer.tsx
- FOUND: .planning/phases/07-polish-fixes/07-04b-SUMMARY.md
- FOUND commit f4c02e5 (AnnotationSidebar dark mode)
- FOUND commit a9ea1fc (HighlightRenderer CSS variables + SelectionToolbar)
