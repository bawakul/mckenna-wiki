---
phase: 07-polish-fixes
plan: 04c
type: execute
wave: 2
depends_on: ["07-03"]
files_modified:
  - src/components/analysis/TraceCard.tsx
  - src/components/analysis/TraceList.tsx
  - src/components/analysis/ModuleSwitcher.tsx
  - src/app/analysis/modules/[id]/page.tsx
  - src/components/export/BulkExportButton.tsx
  - src/components/export/ExportButtons.tsx
autonomous: false
requirements: []

must_haves:
  truths:
    - "Analysis page and trace cards render correctly in dark mode"
    - "Export buttons render correctly in dark mode"
    - "All pages verified by human across light and dark themes"
  artifacts:
    - path: "src/components/analysis/TraceCard.tsx"
      provides: "Trace card with dark mode support"
      contains: "dark:"
    - path: "src/app/analysis/modules/[id]/page.tsx"
      provides: "Analysis page with dark mode support"
      contains: "dark:"
  key_links:
    - from: "src/app/globals.css"
      to: "all analysis/export components"
      via: "@custom-variant dark rule from Plan 07-03"
      pattern: "dark:"
---

<objective>
Add dark mode variants to analysis and export components (6 files), then perform human verification of dark mode across the entire app. This is the final dark mode plan — after this, all pages support dark mode.

Purpose: Complete dark mode support for remaining pages and verify the whole app
Output: Analysis and export components updated, human-verified dark mode across all pages
</objective>

<execution_context>
@/Users/bharadwajkulkarni/.claude/get-shit-done/workflows/execute-plan.md
@/Users/bharadwajkulkarni/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/07-polish-fixes/07-RESEARCH.md
@.planning/phases/07-polish-fixes/07-03-SUMMARY.md
@src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dark mode to analysis and export components</name>
  <files>
    src/components/analysis/TraceCard.tsx
    src/components/analysis/TraceList.tsx
    src/components/analysis/ModuleSwitcher.tsx
    src/app/analysis/modules/[id]/page.tsx
    src/components/export/BulkExportButton.tsx
    src/components/export/ExportButtons.tsx
  </files>
  <action>
Add `dark:` variants to all hardcoded light-mode color classes. Use the same color mapping as Plans 07-04a/07-04b:

- `bg-white` -> `bg-white dark:bg-[#1a1a2e]`
- `bg-gray-50` -> `bg-gray-50 dark:bg-[#16213e]`
- `text-gray-900` -> `text-gray-900 dark:text-[#e8e8f0]`
- `text-gray-700` -> `text-gray-700 dark:text-[#c0c0d0]`
- `text-gray-600` -> `text-gray-600 dark:text-[#9090b0]`
- `text-gray-500` -> `text-gray-500 dark:text-[#9090b0]`
- `border-gray-100` -> `border-gray-100 dark:border-[#2d2d4a]`
- `border-gray-200` -> `border-gray-200 dark:border-[#2d2d4a]`
- `hover:bg-gray-50` -> `hover:bg-gray-50 dark:hover:bg-[#16213e]`
- `hover:bg-gray-100` -> `hover:bg-gray-100 dark:hover:bg-[#2d2d4a]`

**Specific focus areas:**

1. **TraceCard.tsx** (~2): card background, text colors, border
2. **TraceList.tsx** (~1): list container background
3. **ModuleSwitcher.tsx** (~1): dropdown/selector background, borders
4. **analysis/modules/[id]/page.tsx** (~2): page background, heading colors
5. **BulkExportButton.tsx** (~1): button colors/borders
6. **ExportButtons.tsx** (~1): button colors/borders

Do NOT modify existing `dark:` classes that already exist.
  </action>
  <verify>
    <automated>cd "/Users/bharadwajkulkarni/Documents /Bawa's Lab/mckenna-wiki" && npx tsc --noEmit 2>&1 | head -20</automated>
    <manual>Toggle dark mode, visit /analysis/modules/[id] — verify trace cards, module switcher, and export buttons render in dark theme</manual>
  </verify>
  <done>All analysis and export components have dark mode support with consistent palette</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Verify dark mode across all pages</name>
  <files></files>
  <action>Human verification checkpoint — test dark mode across all app pages and verify visual consistency.</action>
  <verify>
    1. Visit http://localhost:3000 — toggle dark mode via sun/moon button in top-right
    2. Navigate to /transcripts — verify list items, filters, search all render in dark theme
    3. Open a transcript — verify reader background, text, timestamps, speaker labels, sidebar all dark
    4. If you have highlights: verify annotation colors are visible and readable against dark background
    5. Visit /modules — verify module cards, create/edit forms render in dark theme
    6. Visit /analysis/modules/[id] — verify trace cards render in dark theme
    7. Toggle back to light mode — verify everything returns to normal
    8. Refresh page — verify theme preference persists from localStorage
    9. Check system preference: change OS to dark mode (no localStorage set) — verify app follows
  </verify>
  <done>User confirms dark mode renders correctly across all pages with no bright/white leaks</done>
</task>

</tasks>

<verification>
- [ ] No hardcoded `bg-white` or `text-gray-900` without `dark:` in analysis/export components
- [ ] All pages tested: transcripts list, transcript reader, modules, module form, analysis trace, export
- [ ] TypeScript compiles without errors
- [ ] Human verification confirms acceptable dark mode appearance
</verification>

<success_criteria>
- Complete dark mode support across entire app (all pages covered by 07-04a + 07-04b + 07-04c)
- All text readable, all backgrounds consistent with soft dark palette
- Human verification confirms acceptable dark mode appearance
</success_criteria>

<output>
After completion, create `.planning/phases/07-polish-fixes/07-04c-SUMMARY.md`
</output>
</content>
</invoke>