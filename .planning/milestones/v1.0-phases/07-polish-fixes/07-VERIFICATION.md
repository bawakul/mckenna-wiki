---
phase: 07-polish-fixes
verified: 2026-02-25T14:30:00Z
status: human_needed
score: 4/5 must-haves verified automatically
re_verification: false
human_verification:
  - test: "Apply supabase/migrations/007_enable_rls.sql via Supabase dashboard SQL editor"
    expected: "All four tables (transcripts, transcript_paragraphs, modules, annotations) show RLS enabled in Auth > Policies. App continues to function — browse transcripts, open reader, view modules all work normally."
    why_human: "RLS is a database-side operation that requires manual application via the Supabase dashboard. The migration SQL file exists and is correct, but cannot be verified programmatically from this codebase. It has NOT been applied yet per the 07-06-SUMMARY.md."
---

# Phase 7: Polish & Fixes Verification Report

**Phase Goal:** Bug fixes, missing data, and enhancements for production readiness
**Verified:** 2026-02-25T14:30:00Z
**Status:** human_needed (4/5 truths automated-verified; 1 requires human database action)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RLS enabled with permissive policies on all tables | ? HUMAN NEEDED | `supabase/migrations/007_enable_rls.sql` exists with all 4 ALTER TABLE + 4 CREATE POLICY statements. Per 07-06-SUMMARY.md: "RLS still requires one manual step" — not applied to DB yet. |
| 2 | Highlight offset bug fixed — selected text matches stored highlight | VERIFIED | `getOffsetInParagraph` in `src/lib/annotations/selectors.ts` (line 214) uses `paragraph.querySelector('p') ?? paragraph` to scope to the `<p>` element. Handles multi-paragraph start/end cases separately (lines 224-233). Commit `de79e20` + bug fix `d5f10d6`. |
| 3 | Missing audience transcripts captured (Global Perspectives and Psychedelic Poetics) | VERIFIED | `corpus/transcripts/global-perspectives-and-psychedelic-poetics.json` has 62 paragraphs (up from 57), with 36 non-McKenna paragraphs from speakers {"McKenna", "Audience", "Terence McKenna"}. Parser updated in `scripts/scrape/parser.ts` to process `section.talk, section.talk-secondary`. Note: database re-seeding is deferred — corpus JSON is correct, DB not yet updated. |
| 4 | Highlights can span multiple paragraphs | VERIFIED | `useTextSelection.ts` exports `MAX_HIGHLIGHT_PARAGRAPHS = 15` with `countParagraphsInRange`. `selectors.ts` has `getAllParagraphsBetween` that queries `[data-virtualized-container]` for DOM-order paragraph traversal. `HighlightRenderer.tsx` has `isMiddle` fallback (line 152) returning `{startOffset: 0, endOffset: 999999}`. Full pipeline wired through `VirtualizedReader.tsx`. Commits `fdc04a2`, `377d77d`, `d5f10d6`. |
| 5 | Transcript reader supports dark mode (toggle or system preference) | VERIFIED | `src/app/globals.css` has `@custom-variant dark`, `:root` and `.dark` CSS variable palettes, 200ms transition. `DarkModeToggle.tsx` is a complete client component with sun/moon icons, `localStorage` persistence, and `classList.toggle`. Layout.tsx has IIFE script in `<head>` for system preference detection before paint. All transcript/annotation/analysis components have `dark:` Tailwind variants (zinc palette). User-verified in 07-04c human checkpoint. Commits `d3fc297`, `01adad6`, `8f91e9a`. |

**Score:** 4/5 truths automated-verified (1 human needed for DB action)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/007_enable_rls.sql` | RLS enable statements + permissive policies for 4 tables | VERIFIED | 4 ALTER TABLE ENABLE ROW LEVEL SECURITY + 4 CREATE POLICY "Allow all access" FOR ALL TO anon. Applied to DB: PENDING (human action required). |
| `src/lib/annotations/selectors.ts` | Fixed `getOffsetInParagraph` scoped to `<p>`, `getAllParagraphsBetween` for multi-paragraph | VERIFIED | `querySelector('p') ?? paragraph` at line 214; multi-paragraph start/end case handling; `getAllParagraphsBetween` at line 156 using `[data-virtualized-container]` query. |
| `src/app/globals.css` | `@custom-variant dark`, `:root` + `.dark` variable palettes, highlight opacity/untagged vars | VERIFIED | All present. Dark palette uses zinc values (`#18181b`, `#f4f4f5`, etc.). `--highlight-opacity: 0.5` and `--untagged-highlight: #3f3f46` in `.dark`. |
| `src/components/DarkModeToggle.tsx` | `'use client'` component, sun/moon toggle, localStorage + classList | VERIFIED | Complete implementation. `useState(false)` + `useEffect` sync pattern. `classList.toggle('dark', next)` + `localStorage.setItem('theme', ...)`. |
| `src/app/layout.tsx` | Theme IIFE script in `<head>`, `DarkModeToggle` imported and rendered | VERIFIED | Script reads `localStorage.getItem('theme')`, falls back to `window.matchMedia`. `DarkModeToggle` imported from `@/components/DarkModeToggle` and rendered after `{children}`. |
| `src/components/annotations/HighlightRenderer.tsx` | CSS variables for highlight opacity + untagged color; `isMiddle` middle-paragraph fallback | VERIFIED | `var(--untagged-highlight, #e5e7eb)` at line 70; `var(--highlight-opacity, 0.35)` in rgba() at line 78; `isMiddle` fallback at lines 152-167. |
| `src/components/annotations/useTextSelection.ts` | `MAX_HIGHLIGHT_PARAGRAPHS = 15`, `countParagraphsInRange`, `exceedsLimit` state | VERIFIED | All present. TreeWalker + compareBoundaryPoints intersection logic. `clearExceedsLimit` callback exported. |
| `scripts/scrape/parser.ts` | `$('section.talk, section.talk-secondary')` combined selector, speaker extraction | VERIFIED | Line 133: `$('section.talk, section.talk-secondary')`. Per-section speaker extracted from `.talk-meta .talk-name`. `<p class="talk-name">` skipped. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase/migrations/007_enable_rls.sql` | Supabase database | Manual SQL application | PENDING | File is correct; must be applied by user via dashboard SQL editor. Not yet applied. |
| `src/lib/annotations/selectors.ts` | `src/components/transcripts/ParagraphView.tsx` | `getOffsetInParagraph` scoped to `<p>` | WIRED | `querySelector('p')` at line 214; ParagraphView renders `<p>` with paragraph text; data-paragraph-id on wrapper div. |
| `src/components/DarkModeToggle.tsx` | `document.documentElement.classList` | `classList.toggle('dark', next)` | WIRED | Confirmed in DarkModeToggle.tsx line 15. |
| `src/app/layout.tsx` | `document.documentElement` | Inline IIFE script adds `.dark` before paint | WIRED | `classList.add('dark')` in inline script, line 34 of layout.tsx. |
| `src/app/globals.css` | All components using `dark:` prefix | `@custom-variant dark (&:where(.dark, .dark *))` | WIRED | Line 3 of globals.css. Confirmed `dark:` variants present in TranscriptReader (18 occurrences), ParagraphView (5), AnnotationSidebar (17). |
| `src/components/annotations/useTextSelection.ts` | `src/components/annotations/SelectionToolbar.tsx` | `exceedsLimit`/`onClearExceedsLimit` props | WIRED | VirtualizedReader lines 46, 169-170 thread these props. SelectionToolbar renders warning toast when `exceedsLimit=true`. |
| `src/lib/annotations/selectors.ts` `getAllParagraphsBetween` | `src/components/annotations/HighlightRenderer.tsx` `isMiddle` | `ParagraphAnchor` data for middle paragraphs | WIRED | `createSelectorFromRange` stores explicit middle anchors (lines 412-424); renderer has `isMiddle` fallback for anchors without explicit data. |
| `src/components/annotations/HighlightRenderer.tsx` | `src/app/globals.css` | `--highlight-opacity` and `--untagged-highlight` CSS variables | WIRED | Lines 70 and 78 of HighlightRenderer reference these variables; both defined in globals.css under `:root` and `.dark`. |
| `scripts/scrape/parser.ts` | `corpus/transcripts/global-perspectives-and-psychedelic-poetics.json` | Scraper produces JSON with audience paragraphs | WIRED | Corpus file verified: 62 paragraphs, speakers include "Audience". Parser committed with combined selector. |
| `getAllParagraphsBetween` | `[data-virtualized-container]` DOM element | `startPara.closest('[data-virtualized-container]')` query | WIRED | VirtualizedReader.tsx line 158: `data-virtualized-container` attribute on scroll div. `getAllParagraphsBetween` in selectors.ts line 158 queries this attribute. |

---

## Requirements Coverage

No explicit requirement IDs assigned to Phase 7 (quality/polish phase). The five success criteria from the phase context document are verified above as observable truths.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/annotations/selectors.ts` | 198 | `return null` | Info | Correct: `findParagraphElement` returns null when no paragraph ancestor found — legitimate guard. |
| `src/components/annotations/HighlightRenderer.tsx` | 127, 132, 169 | `return null` | Info | Correct: guard returns for paragraphs outside annotation range, missing selector, or non-middle non-anchor paragraphs — all legitimate. |

No blockers or warnings found. All `return null` instances are correct guard clauses, not stub implementations.

---

## Notable Observations

### Corpus Data vs. Database State

The scraper parser fix (`scripts/scrape/parser.ts`) is complete and correct. The corpus JSON file for "Global Perspectives and Psychedelic Poetics" has been re-scraped (62 paragraphs, including audience paragraphs). However, **database re-seeding is explicitly deferred** — the database still has 57 paragraphs for this transcript, and 77 of 92 transcripts still lack secondary speaker content. This is an acknowledged trade-off (annotations exported, CASCADE risk present). Not a blocking issue for Phase 7 verification; the fix is in code and corpus.

### RLS Migration Status

`supabase/migrations/007_enable_rls.sql` is substantive and correct (4 tables, permissive anon policies). It has NOT been applied to the Supabase database — this is explicitly documented as a one-step manual action in 07-06-SUMMARY.md. The code artifact is complete; the database-side effect needs one human action.

### Dark Mode Palette Alignment

Plans 07-03 through 07-04b used a custom bluish hex palette (`#1a1a2e`, etc.). During 07-04c human verification, the user identified visual inconsistency with the existing zinc-palette components. Commit `8f91e9a` replaced all custom hex with zinc Tailwind utilities across 13 files and updated `globals.css` CSS variables. The final state is a consistent zinc palette throughout the app.

### Multi-Paragraph Highlight Bug Fixes

Two bugs were found and fixed during 07-06 end-to-end verification (commit `d5f10d6`):
1. `getAllParagraphsBetween` failed with virtualized DOM because paragraphs are wrapped in absolutely-positioned divs (not direct siblings). Fixed by querying `[data-virtualized-container]` and filtering by paragraph ID range.
2. `getOffsetInParagraph` returned `endOffset=0` for start paragraphs in multi-paragraph selections. Fixed by detecting when `endContainer` is outside the current paragraph and returning `paragraphText.length` as the end offset.

Both bugs were user-confirmed as working after the fix.

---

## Human Verification Required

### 1. Apply RLS Migration to Supabase Database

**Test:** Open Supabase dashboard SQL editor. Paste and run the contents of `supabase/migrations/007_enable_rls.sql`.

**Expected:**
- Query executes without errors
- Supabase Auth > Policies shows 4 tables (transcripts, transcript_paragraphs, modules, annotations) with "Allow all access" policies enabled
- App continues to function: browse /transcripts, open a transcript, view /modules, check /analysis — all data loads normally

**Why human:** RLS is applied at the Postgres database level via the Supabase dashboard. Cannot be verified from the codebase alone. This is a one-time manual action to activate the security configuration.

---

## Gaps Summary

No code-level gaps found. All five phase success criteria are implemented in the codebase. The single pending item is a manual database action (RLS activation) — the SQL is correct and ready to apply.

---

_Verified: 2026-02-25T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
