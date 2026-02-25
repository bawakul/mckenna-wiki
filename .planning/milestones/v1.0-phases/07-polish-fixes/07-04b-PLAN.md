---
phase: 07-polish-fixes
plan: 04b
type: execute
wave: 2
depends_on: ["07-03"]
files_modified:
  - src/app/modules/new/page.tsx
  - src/app/modules/[id]/edit/page.tsx
  - src/components/modules/ModuleCard.tsx
  - src/components/modules/ModuleForm.tsx
  - src/components/modules/ModuleSelector.tsx
  - src/components/modules/DeleteModuleDialog.tsx
  - src/components/modules/InlineModuleCreator.tsx
  - src/components/annotations/AnnotationSidebar.tsx
  - src/components/annotations/SelectionToolbar.tsx
  - src/components/annotations/HighlightPopover.tsx
  - src/components/annotations/HighlightRenderer.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Module forms and cards render correctly in dark mode"
    - "Annotation sidebar, popover, and toolbar render correctly in dark mode"
    - "Annotation highlights adjust opacity for dark backgrounds (0.5 vs 0.35)"
    - "Untagged highlights use CSS variable for dark mode color"
    - "Modules page (already has dark: variants) still works correctly"
  artifacts:
    - path: "src/components/annotations/HighlightRenderer.tsx"
      provides: "Highlight rendering with dark-adjusted opacity via CSS variable"
      contains: "highlight-opacity"
    - path: "src/components/annotations/AnnotationSidebar.tsx"
      provides: "Sidebar with dark mode support"
      contains: "dark:"
    - path: "src/components/modules/ModuleForm.tsx"
      provides: "Module form with dark mode support"
      contains: "dark:"
  key_links:
    - from: "src/components/annotations/HighlightRenderer.tsx"
      to: "src/app/globals.css"
      via: "--highlight-opacity and --untagged-highlight CSS variables"
      pattern: "highlight-opacity|untagged-highlight"
---

<objective>
Add dark mode variants to module and annotation components (11 files). Includes the critical HighlightRenderer update to use CSS variables for highlight opacity and untagged highlight color in dark mode.

Purpose: Dark mode support for module management and annotation interaction
Output: All module and annotation components updated with dark: Tailwind variants, highlight rendering uses CSS variables
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
  <name>Task 1: Add dark mode to module and annotation components</name>
  <files>
    src/app/modules/new/page.tsx
    src/app/modules/[id]/edit/page.tsx
    src/components/modules/ModuleCard.tsx
    src/components/modules/ModuleForm.tsx
    src/components/modules/ModuleSelector.tsx
    src/components/modules/DeleteModuleDialog.tsx
    src/components/modules/InlineModuleCreator.tsx
    src/components/annotations/AnnotationSidebar.tsx
    src/components/annotations/SelectionToolbar.tsx
    src/components/annotations/HighlightPopover.tsx
  </files>
  <action>
Add `dark:` variants to all hardcoded light-mode color classes. Use the same color mapping as Plan 07-04a:

- `bg-white` -> `bg-white dark:bg-[#1a1a2e]`
- `bg-gray-50` -> `bg-gray-50 dark:bg-[#16213e]`
- `text-gray-900` -> `text-gray-900 dark:text-[#e8e8f0]`
- `text-gray-700` -> `text-gray-700 dark:text-[#c0c0d0]`
- `text-gray-600` -> `text-gray-600 dark:text-[#9090b0]`
- `text-gray-500` -> `text-gray-500 dark:text-[#9090b0]`
- `border-gray-100` -> `border-gray-100 dark:border-[#2d2d4a]`
- `border-gray-200` -> `border-gray-200 dark:border-[#2d2d4a]`
- `border-gray-300` -> `border-gray-300 dark:border-[#3d3d5a]`
- `hover:bg-gray-50` -> `hover:bg-gray-50 dark:hover:bg-[#16213e]`
- `hover:bg-gray-100` -> `hover:bg-gray-100 dark:hover:bg-[#2d2d4a]`

**Specific focus areas:**

1. **AnnotationSidebar.tsx** (~8 occurrences): This has the most hardcoded colors. Update all `bg-white`, `border-gray-*`, `text-gray-*` classes. The sidebar toggle button (fixed right-4 top-24) needs dark variants too.
2. **HighlightPopover.tsx** (~1): `bg-white` background, border colors, text colors
3. **SelectionToolbar.tsx** (~1): button colors (already amber-themed, just needs dark border/shadow)
4. **ModuleCard.tsx** (~1): `bg-white` -> add dark variant
5. **ModuleForm.tsx** (~2): input fields, labels
6. **ModuleSelector.tsx** (~1): dropdown background, borders
7. **DeleteModuleDialog.tsx** (~1): dialog background, text
8. **InlineModuleCreator.tsx** (~1): input, button colors
9. **modules/new/page.tsx** and **modules/[id]/edit/page.tsx**: page backgrounds, heading colors

**Modules page (`src/app/modules/page.tsx`)** already has `dark:` variants with zinc palette — do NOT modify it. Use the custom palette (#1a1a2e etc.) for all other module components — the existing zinc variants on the main modules page will be close enough and won't conflict.
  </action>
  <verify>
    <automated>cd "/Users/bharadwajkulkarni/Documents /Bawa's Lab/mckenna-wiki" && npx tsc --noEmit 2>&1 | head -20</automated>
    <manual>Toggle dark mode and visit: /modules/new, open annotation sidebar in a transcript, click a highlight to see popover — verify no bright/white elements</manual>
  </verify>
  <done>All module pages, module components, annotation sidebar, popover, and toolbar have dark mode support</done>
</task>

<task type="auto">
  <name>Task 2: Update HighlightRenderer to use CSS variables for dark mode</name>
  <files>src/components/annotations/HighlightRenderer.tsx</files>
  <action>
Update `getHighlightStyle` in HighlightRenderer.tsx to use CSS variables for dark-mode-aware rendering:

1. **Tagged highlight opacity** — change from hardcoded 0.35 to CSS variable:
   ```typescript
   // BEFORE:
   return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.35)` }

   // AFTER:
   return { backgroundColor: `rgba(${r}, ${g}, ${b}, var(--highlight-opacity, 0.35))` }
   ```
   This uses `--highlight-opacity` from globals.css (0.35 in light, 0.5 in dark — defined by Plan 07-03).

2. **Untagged highlight color** — change from hardcoded `#e5e7eb` to CSS variable:
   ```typescript
   // BEFORE:
   if (!color) {
     return { backgroundColor: '#e5e7eb' }
   }

   // AFTER:
   if (!color) {
     return { backgroundColor: 'var(--untagged-highlight, #e5e7eb)' }
   }
   ```
   This uses `--untagged-highlight` from globals.css (#e5e7eb in light, #4a4a6a in dark — defined by Plan 07-03).

Both CSS variables are already defined in globals.css by Plan 07-03. No conditional logic needed in the render function.
  </action>
  <verify>
    <automated>cd "/Users/bharadwajkulkarni/Documents /Bawa's Lab/mckenna-wiki" && grep -c "highlight-opacity" src/components/annotations/HighlightRenderer.tsx && grep -c "untagged-highlight" src/components/annotations/HighlightRenderer.tsx</automated>
    <manual>Toggle dark mode in a transcript with highlights — verify tagged highlights are slightly more opaque and untagged highlights use a muted dark color instead of light gray</manual>
  </verify>
  <done>HighlightRenderer uses CSS variables for opacity and untagged color, automatically adapting to dark mode</done>
</task>

</tasks>

<verification>
- [ ] No hardcoded `bg-white` or `text-gray-900` without `dark:` variants in module/annotation components
- [ ] Highlight opacity uses `var(--highlight-opacity)` CSS variable
- [ ] Untagged highlight uses `var(--untagged-highlight)` CSS variable
- [ ] TypeScript compiles without errors
</verification>

<success_criteria>
- All module and annotation components render correctly in dark mode
- Highlight rendering adapts to dark mode via CSS variables (no JS theme detection)
- Annotation sidebar, popover, and toolbar are all dark-mode compatible
</success_criteria>

<output>
After completion, create `.planning/phases/07-polish-fixes/07-04b-SUMMARY.md`
</output>
</content>
</invoke>