---
phase: 07-polish-fixes
plan: 04a
type: execute
wave: 2
depends_on: ["07-03"]
files_modified:
  - src/app/transcripts/page.tsx
  - src/app/transcripts/loading.tsx
  - src/app/transcripts/[id]/loading.tsx
  - src/components/transcripts/TranscriptReader.tsx
  - src/components/transcripts/TranscriptHeader.tsx
  - src/components/transcripts/TranscriptListItem.tsx
  - src/components/transcripts/TranscriptFilters.tsx
  - src/components/transcripts/ParagraphView.tsx
  - src/components/transcripts/SearchSidebar.tsx
  - src/components/transcripts/ResumePrompt.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Transcript list page renders correctly in dark mode"
    - "Transcript reader renders correctly in dark mode with soft dark palette"
    - "Text is readable against dark backgrounds in all transcript components"
    - "No hardcoded light-only colors remain in transcript components"
    - "Search sidebar, filters, and resume prompt all support dark mode"
  artifacts:
    - path: "src/components/transcripts/TranscriptReader.tsx"
      provides: "Reader with dark mode support"
      contains: "dark:"
    - path: "src/components/transcripts/ParagraphView.tsx"
      provides: "Paragraph text with dark mode support"
      contains: "dark:"
    - path: "src/components/transcripts/SearchSidebar.tsx"
      provides: "Search sidebar with dark mode support"
      contains: "dark:"
  key_links:
    - from: "src/app/globals.css"
      to: "all transcript components"
      via: "@custom-variant dark rule from Plan 07-03"
      pattern: "dark:"
---

<objective>
Add dark mode variants to transcript pages and reader components (10 files). Uses the dark mode infrastructure from Plan 07-03 to add dark: Tailwind variants to all transcript-related UI.

Purpose: Dark mode support for the transcript browsing and reading experience
Output: All transcript components updated with dark: Tailwind variants
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
  <name>Task 1: Add dark mode to transcript list pages and loading states</name>
  <files>
    src/app/transcripts/page.tsx
    src/app/transcripts/loading.tsx
    src/app/transcripts/[id]/loading.tsx
    src/components/transcripts/TranscriptListItem.tsx
    src/components/transcripts/TranscriptFilters.tsx
  </files>
  <action>
Add `dark:` variants to all hardcoded light-mode color classes in transcript list components. Use the following mapping consistently (matching the CSS variables in globals.css):

**Color mapping:**
- `bg-white` -> `bg-white dark:bg-[#1a1a2e]`
- `bg-gray-50` -> `bg-gray-50 dark:bg-[#16213e]`
- `text-gray-900` -> `text-gray-900 dark:text-[#e8e8f0]`
- `text-gray-700` -> `text-gray-700 dark:text-[#c0c0d0]`
- `text-gray-600` -> `text-gray-600 dark:text-[#9090b0]`
- `text-gray-500` -> `text-gray-500 dark:text-[#9090b0]`
- `text-gray-400` -> `text-gray-400 dark:text-[#6a6a8a]`
- `border-gray-100` -> `border-gray-100 dark:border-[#2d2d4a]`
- `border-gray-200` -> `border-gray-200 dark:border-[#2d2d4a]`
- `border-gray-300` -> `border-gray-300 dark:border-[#3d3d5a]`
- `hover:bg-gray-50` -> `hover:bg-gray-50 dark:hover:bg-[#16213e]`
- `hover:bg-gray-100` -> `hover:bg-gray-100 dark:hover:bg-[#2d2d4a]`
- `placeholder-gray-*` -> add dark variants
- `ring-*` colors -> add appropriate dark variants

**Specific files:**
1. **transcripts/page.tsx** (~2): page background, heading colors
2. **TranscriptListItem.tsx** (~2): `bg-white`, `text-gray-*`
3. **TranscriptFilters.tsx** (~1): `bg-white`, inputs
4. **Loading pages** (~5 combined): skeleton/loading state colors — update `bg-gray-*` shimmer colors to use darker values in dark mode

Do NOT modify existing `dark:` classes that already exist.
  </action>
  <verify>
    <automated>cd "/Users/bharadwajkulkarni/Documents /Bawa's Lab/mckenna-wiki" && npx tsc --noEmit 2>&1 | head -20</automated>
    <manual>Toggle dark mode, visit /transcripts — verify list items, filters, loading skeletons all render in dark theme</manual>
  </verify>
  <done>Transcript list page, list items, filters, and loading states all have dark: variants</done>
</task>

<task type="auto">
  <name>Task 2: Add dark mode to transcript reader components</name>
  <files>
    src/components/transcripts/TranscriptReader.tsx
    src/components/transcripts/TranscriptHeader.tsx
    src/components/transcripts/ParagraphView.tsx
    src/components/transcripts/SearchSidebar.tsx
    src/components/transcripts/ResumePrompt.tsx
  </files>
  <action>
Add `dark:` variants to all reader components using the same color mapping from Task 1.

**Specific files and key changes:**

1. **TranscriptReader.tsx** (~6 occurrences): `bg-white`, `min-h-screen bg-white`, borders, scrollbar areas
2. **ParagraphView.tsx** (~1): `text-gray-900` on the `<p>` tag, `text-gray-400` on timestamp, `text-gray-700` on speaker label, `bg-yellow-50` on current match -> `bg-yellow-50 dark:bg-yellow-900/30`, `bg-yellow-200` -> `bg-yellow-200 dark:bg-yellow-700/50`
3. **SearchSidebar.tsx** (~5): `bg-white`, `border-gray-200`, `text-gray-*` throughout
4. **TranscriptHeader.tsx** (~2): `text-gray-*` colors
5. **ResumePrompt.tsx** (~2): `bg-white`, `text-gray-*`

Do NOT modify existing `dark:` classes that already exist.
  </action>
  <verify>
    <automated>cd "/Users/bharadwajkulkarni/Documents /Bawa's Lab/mckenna-wiki" && npx tsc --noEmit 2>&1 | head -20</automated>
    <manual>Toggle dark mode, open a transcript — verify reader background, text, timestamps, speaker labels, search sidebar, resume prompt all render in dark theme</manual>
  </verify>
  <done>All reader components (TranscriptReader, ParagraphView, SearchSidebar, TranscriptHeader, ResumePrompt) have dark mode support</done>
</task>

</tasks>

<verification>
- [ ] No hardcoded `bg-white` or `text-gray-900` without corresponding `dark:` variants in transcript components
- [ ] Loading states use dark-appropriate skeleton colors
- [ ] Search highlights (yellow) have dark mode alternatives
- [ ] TypeScript compiles without errors
</verification>

<success_criteria>
- All transcript pages and reader components render correctly in dark mode
- Text is readable, backgrounds are consistent with soft dark palette
- No bright/white elements leak through in dark mode
</success_criteria>

<output>
After completion, create `.planning/phases/07-polish-fixes/07-04a-SUMMARY.md`
</output>
</content>
</invoke>