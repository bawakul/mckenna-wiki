# Phase 7: Polish & Fixes - Research

**Researched:** 2026-02-25
**Domain:** Bug fixes, dark mode theming, corpus data repair, annotation model extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dark Mode**
- Applies to the whole app (all pages, not just reader)
- Activation: follows system preference by default, with manual override toggle
- Toggle location: sun/moon icon in header/navbar
- Preference persists in localStorage across sessions
- Palette: soft dark (#1a1a2e) — dark blue-gray tones (Linear/Notion style), not true black
- Highlight colors: adjusted opacity/brightness for dark backgrounds to maintain readability
- Transition: smooth ~200ms CSS fade between themes
- FOUC: not a concern — brief flash acceptable for personal tool

**Multi-Paragraph Highlights**
- Display: connected block — continuous highlight color across all paragraphs, looks like one selection
- Boundaries: partial first/last paragraphs allowed — exact selection preserved, not snapped to full paragraphs
- Popover: anchors to start (first paragraph) of the highlight when clicked
- Limit: reasonable cap (~10-20 paragraphs) to prevent accidental huge selections
- Audience paragraphs are fully taggable (same as any other text)

**Audience Transcript Recovery**
- Known affected: "Global Perspectives and Psychedelic Poetics" — confirmed missing audience text
- Scope: fix known transcript + spot-check a sample of others to assess broader impact
- Speaker labels: show "Audience" label before audience paragraphs (consistent with existing speaker label rendering)
- Existing annotations: preserve if possible — re-anchor to updated paragraph positions rather than invalidating
- Audience text is fully taggable with modules (not read-only context)

**Highlight Offset Bug**
- Bug: visual highlight renders shifted forward (right) from actual selection
- Stored text is correct — the rendering/re-anchoring is the issue, not selection/storage
- Shift amount is roughly consistent across paragraphs
- Affects paragraphs both with and without timestamps
- Fix should address the rendering path where stored selectors are re-anchored to DOM positions

**RLS Security**
- Enable Row Level Security with permissive policies on all tables
- Personal tool — simple "allow all" policies sufficient

### Claude's Discretion

- RLS policy specifics (permissive read/write for all authenticated or anon)
- Multi-paragraph data model changes (how span across paragraphs is stored)
- Scraper changes needed for audience text extraction
- Exact dark mode CSS variable structure
- Paragraph cap number for multi-paragraph highlights

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 7 is five discrete fixes with no shared dependencies — each can be planned and implemented independently. The most architecturally significant items are dark mode (app-wide theming infrastructure) and multi-paragraph highlights (changes to selection, selector creation, and rendering logic). The other three items are surgical: RLS is pure SQL, the highlight offset bug is a one-function fix in `selectors.ts`, and audience transcript recovery is a scraper parser extension plus a targeted re-seed.

The codebase is in excellent shape. Tailwind v4's `@custom-variant` pattern handles dark mode cleanly without additional libraries. The annotation data model already supports `start_paragraph_id != end_paragraph_id` — the infrastructure is partially there but the selection capture and rendering don't yet use it correctly for cross-paragraph spans. The corpus scraper parser currently only processes `section.talk` elements, missing `section.talk-secondary` which contains audience Q&A.

**Primary recommendation:** Plan dark mode first (touches layout.tsx + globals.css, sets CSS variables that other fixes can reference for dark-adjusted highlight colors). Then multi-paragraph highlights (extends existing highlight rendering). Then the three targeted fixes in any order.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| `tailwindcss` | ^4 | Dark mode via `@custom-variant` | Already configured |
| `@tanstack/react-virtual` | ^3 | Virtualized transcript reader | Unaffected by these changes |
| `cheerio` | ^1.2.0 | HTML parsing for scraper | Needs multi-section traversal |
| `@supabase/supabase-js` | ^2 | Database client | RLS applied via Supabase dashboard SQL editor |

### No New Dependencies Required

All five items in this phase are implementable with the existing stack. No npm installs needed.

---

## Architecture Patterns

### Recommended File Structure

The phase touches these locations:

```
src/
├── app/
│   ├── layout.tsx                  # Add theme script + DarkModeToggle
│   └── globals.css                 # Add dark mode CSS variables + @custom-variant
├── components/
│   ├── DarkModeToggle.tsx          # NEW: sun/moon toggle button (client component)
│   └── annotations/
│       └── HighlightRenderer.tsx   # Update getHighlightForParagraph for multi-para
├── hooks/
│   └── useDarkMode.ts              # NEW: localStorage + matchMedia hook
└── lib/
    └── annotations/
        └── selectors.ts            # Fix getOffsetInParagraph (offset bug)

scripts/
└── scrape/
    └── parser.ts                   # Add section.talk-secondary parsing

supabase/
└── migrations/
    └── 007_enable_rls.sql          # NEW: RLS enable + permissive policies
```

---

## Fix 1: RLS Security

### Pattern

**Confidence: HIGH** — Standard Supabase SQL, verified against docs.

Enable RLS and create permissive `for all` policies on all four tables. Since this is a personal tool with no auth, use `true` as the condition for both `using` and `with check`. Target `anon` role (unauthenticated Supabase access).

```sql
-- 007_enable_rls.sql
-- Enable RLS on all tables
alter table transcripts enable row level security;
alter table transcript_paragraphs enable row level security;
alter table modules enable row level security;
alter table annotations enable row level security;

-- Permissive policies: allow all operations for all users
create policy "Allow all access"
  on transcripts for all to anon using (true) with check (true);

create policy "Allow all access"
  on transcript_paragraphs for all to anon using (true) with check (true);

create policy "Allow all access"
  on modules for all to anon using (true) with check (true);

create policy "Allow all access"
  on annotations for all to anon using (true) with check (true);
```

Applied via Supabase dashboard SQL editor (consistent with how migrations 001–006 have been applied).

**Note on module_traces view:** Views inherit RLS from underlying tables. Once RLS is enabled on `annotations` and `transcripts`, the `module_traces` view is automatically protected. No separate policy needed for the view.

---

## Fix 2: Highlight Offset Bug

### Root Cause Analysis

**Confidence: HIGH** — Verified by reading `selectors.ts` code directly.

The bug is in `getOffsetInParagraph()` in `/src/lib/annotations/selectors.ts` (line 169–220). The function is called with the paragraph's DOM element (found via `findParagraphElement` which walks up to the `data-paragraph-id` div).

**The bug:** `ParagraphView` renders the paragraph like this:
```tsx
<div data-paragraph-id={paragraph.id} ...>  {/* ← findParagraphElement returns THIS */}
  <span className="absolute left-0 top-2 ... select-none">
    {formattedTimestamp}                       {/* ← timestamp TEXT is in the DOM */}
  </span>
  <div className="mb-1 ...">speaker label</div>  {/* ← also in textContent */}
  <p className="text-base ...">
    {paragraph.text}                           {/* ← actual text user selects */}
  </p>
</div>
```

When `getOffsetInParagraph` calls `paragraph.textContent`, it gets the timestamp + speaker label + paragraph text concatenated. `paragraphText.indexOf(rangeText)` then finds a match at the wrong position — shifted forward by the length of the timestamp and/or speaker label strings.

Even paragraphs without timestamps may have a speaker label prepended, explaining why the bug "affects paragraphs both with and without timestamps."

### Fix

Scope `getOffsetInParagraph` to the `<p>` element (the actual text paragraph), not the wrapper div. The wrapper div is needed to identify WHICH paragraph, but the offset calculation must be relative to the `<p>` element's text content only.

```typescript
// BEFORE: paragraph is the div[data-paragraph-id]
function getOffsetInParagraph(range: Range, paragraph: Element): { start: number; end: number }

// AFTER: narrow to the <p> element inside the paragraph div
function getOffsetInParagraph(range: Range, paragraphDiv: Element): { start: number; end: number } {
  // Find the actual <p> text element inside the wrapper div
  const textElement = paragraphDiv.querySelector('p') ?? paragraphDiv
  const paragraphText = textElement.textContent || ''
  // ... rest of calculation uses textElement instead of paragraphDiv
}
```

The TreeWalker fallback in the same function also needs to be scoped to `textElement` instead of `paragraph`.

**Stored selectors already have correct text** (the `highlighted_text` and `TextQuoteSelector.exact` are captured from `range.toString()` which is accurate). Only the `ParagraphAnchor.startOffset` / `endOffset` values are wrong, so fixing the storage function fixes the rendering immediately on new annotations. Existing stored annotations with wrong offsets will remain wrong — acceptable for a personal tool.

---

## Fix 3: Audience Transcript Recovery

### Root Cause Analysis

**Confidence: HIGH** — Verified by fetching the live organism.earth page for "Global Perspectives and Psychedelic Poetics."

The organism.earth HTML structure for Q&A transcripts uses two section types:
- `section.talk` — McKenna's content (what the parser currently processes)
- `section.talk-secondary` — Audience questions / other speakers

Current `parseTranscriptPage` only processes `talkSection.children('p')` where `talkSection = $('section.talk')`. All `section.talk-secondary` elements are silently skipped.

**Live HTML evidence:**
```html
</section>                              ← closes section.talk

<section class="talk-secondary">       ← MISSED by current parser
  <div class="talk-meta">
    <p class="talk-name">Audience</p>
    <img class="talk-avatar" src="img/anonymous-headshot.webp">
  </div>
  <p class="no-indent">
    I had an experience—about three years ago...
  </p>
</section>

<section class="talk">                  ← McKenna's response (captured)
  ...
</section>
```

**Confirmed structure:** The `talk-name` element (`.talk-meta p.talk-name`) contains the speaker label ("Audience", "McKenna", etc.). This is within the `talk-meta` div, not a standalone `<p>` in the section.

**Scale:** "Global Perspectives and Psychedelic Poetics" currently has 57 paragraphs (all McKenna). Live page shows `talk-name` appears ~10 times, so ~10+ audience paragraphs are missing. Other Q&A transcripts in the 92-transcript corpus likely have the same issue — spot-checking during implementation is needed.

### Fix Strategy

**Parser change:** Process both `section.talk` and `section.talk-secondary` in document order.

```typescript
// In parseTranscriptPage():

// Process ALL talk sections (both 'talk' and 'talk-secondary')
const talkSections = $('section.talk, section.talk-secondary')

talkSections.each((_, sectionEl) => {
  const $section = $(sectionEl)

  // Extract speaker from talk-name if present (for talk-secondary sections)
  let sectionSpeaker: string | null = null
  const talkName = $section.find('.talk-meta .talk-name').text().trim()
  if (talkName) {
    sectionSpeaker = talkName
  }

  $section.children('p').each((_, pEl) => {
    const $p = $(pEl)
    if ($p.hasClass('talk-timestamp') || $p.hasClass('talk-name')) return

    const text = $p.text().trim()
    if (!text) return

    // Find preceding timestamp (same logic as before)
    let timestamp: string | null = null
    const $prev = $p.prev()
    if ($prev.is('div.talk-meta')) {
      const timestampText = $prev.find('p.talk-timestamp').text().trim()
      timestamp = timestampText || null
    }

    // Use section speaker or default to authorName
    const speaker = sectionSpeaker || authorName

    paragraphs.push({ position: paragraphs.length, speaker, timestamp, text, contentHash: hashParagraph(text) })
  })
})
```

**Re-seed strategy:** After updating the parser, scrape only the affected transcript(s) by URL, then re-import with the existing import script. The import script already handles `ON DELETE CASCADE` for paragraphs, so replacing paragraphs is safe. Existing annotations on this transcript would have their paragraph FKs cascade-deleted — acceptable since the stored `highlighted_text` is still correct and the transcript had no audience content before.

**Spot-check approach:** After parsing the known affected transcript, run parser on a sample of 5-10 Q&A-style transcripts to quantify broader impact before deciding whether to re-scrape everything.

---

## Fix 4: Multi-Paragraph Highlights

### Current State

**Confidence: HIGH** — Verified by reading data model and selector/renderer code.

The data model **already supports** multi-paragraph spans:
- `annotations.start_paragraph_id` and `annotations.end_paragraph_id` are separate fields
- `AnnotationSelector.refinedBy` already stores multiple `ParagraphAnchor` entries for multi-paragraph cases
- `createSelectorFromRange` (selectors.ts line 316–323) already handles `endPara !== startPara`

**What's missing:**
1. **Selection validation:** `useTextSelection` doesn't count paragraph boundaries or enforce a cap
2. **Offset calculation:** `getOffsetInParagraph` for the middle paragraphs (positions 1..N-2) — currently only start and end paragraphs get anchors; middle paragraphs need full-span anchors (0 → text.length)
3. **Rendering:** `getHighlightForParagraph` in HighlightRenderer handles `start_paragraph_id` through `end_paragraph_id` but only looks for a matching `ParagraphAnchor`. For middle paragraphs (not start, not end), there is no ParagraphAnchor in the selector, so they render nothing.

### Multi-Paragraph Selection Counting

Detect how many paragraphs a range spans by counting `data-paragraph-id` elements between start and end:

```typescript
function countParagraphsInRange(range: Range): number {
  const container = range.commonAncestorContainer
  const walker = document.createTreeWalker(
    container.nodeType === Node.ELEMENT_NODE ? container as Element : container.parentElement!,
    NodeFilter.SHOW_ELEMENT,
    { acceptNode: (node) => (node as Element).hasAttribute('data-paragraph-id')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP }
  )
  let count = 0
  let node = walker.nextNode()
  while (node) { count++; node = walker.nextNode() }
  return Math.max(1, count)
}
```

Cap enforcement: if `countParagraphsInRange > MAX_HIGHLIGHT_PARAGRAPHS` (recommend 15), show a user-visible warning (inline near SelectionToolbar) and refuse to create the annotation.

### Selector Extension for Middle Paragraphs

`createSelectorFromRange` needs to add ParagraphAnchor entries for ALL paragraphs between start and end, not just start and end:

```typescript
// For each paragraph element between startPara and endPara (exclusive):
const allParaElements = getAllParagraphsBetween(startPara, endPara)
for (const para of allParaElements) {
  const id = parseInt(para.getAttribute('data-paragraph-id') || '0', 10)
  paragraphAnchors.push({
    type: 'ParagraphAnchor',
    paragraphId: id,
    startOffset: 0,                    // full paragraph
    endOffset: para.querySelector('p')?.textContent?.length ?? 0,
  })
}
```

### Rendering Fix for Middle Paragraphs

`getHighlightForParagraph` currently requires a matching `ParagraphAnchor`. For middle paragraphs (where `paragraphId > start_paragraph_id` AND `< end_paragraph_id`), fall back to full-paragraph highlight:

```typescript
export function getHighlightForParagraph(
  annotation: AnnotationWithModule,
  paragraphId: number,
  paragraphTextLength: number  // NEW: needed for middle paragraph full-span
): ParagraphHighlight | null {
  const isMiddle = paragraphId > annotation.start_paragraph_id &&
                   paragraphId < annotation.end_paragraph_id

  if (isMiddle) {
    // Highlight entire paragraph
    return { id: annotation.id, startOffset: 0, endOffset: paragraphTextLength,
             color: annotation.module?.color ?? null, moduleId: annotation.module_id }
  }

  // existing ParagraphAnchor lookup for start/end paragraphs...
}
```

### Visual Continuity

The "connected block" appearance across paragraphs is achieved naturally by applying the same `getHighlightStyle` to each segment across consecutive paragraphs. No special CSS needed — consecutive highlighted `<mark>` elements at end/start of paragraphs naturally look joined in the prose layout.

For the popover: it already anchors to the clicked `mark` element. When clicking a middle paragraph's mark, the popover will anchor there. User decision says "anchor to start (first paragraph)" — this means on click, find the first mark element for that annotation and anchor there:

```typescript
// In handleHighlightClick:
const firstMark = document.querySelector(`mark[data-annotation-id="${annotationId}"]`) as HTMLElement
// querySelector returns the first DOM match — which is the start paragraph's mark ✓
```

This already works: `querySelector` returns the first match in DOM order, which is the start paragraph's mark.

---

## Fix 5: Dark Mode

### Tailwind v4 Pattern

**Confidence: HIGH** — Verified against Tailwind v4 official docs.

Tailwind v4 uses `@custom-variant` to configure dark mode with class toggling:

```css
/* globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
  --border: #e5e7eb;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --card: #ffffff;
  color-scheme: light;
}

.dark {
  --background: #1a1a2e;
  --foreground: #e8e8f0;
  --border: #2d2d4a;
  --muted: #16213e;
  --muted-foreground: #9090b0;
  --card: #16213e;
  color-scheme: dark;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  transition: background-color 200ms ease, color 200ms ease;
  font-family: Arial, Helvetica, sans-serif;
}
```

### Theme Script in layout.tsx

Add an inline script to `<head>` to apply the dark class before paint. FOUC is acceptable per user decision, but placing it in `<head>` (not `<body>`) is still cleaner:

```tsx
// layout.tsx <head>
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
`}} />
```

### DarkModeToggle Component

New client component — `src/components/DarkModeToggle.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Sync with current state on mount
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    if (next) {
      localStorage.setItem('theme', 'dark')
    } else {
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button onClick={toggle} aria-label="Toggle dark mode">
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
```

### Navbar/Header

The app currently has **no shared navbar component**. Each page has its own header inline:
- `TranscriptReader.tsx` — left sidebar with back link + metadata
- `transcripts/page.tsx` — standalone header div
- `modules/page.tsx` — standalone header div
- `analysis/modules/[id]/page.tsx` — standalone header

**Approach:** Create a shared `NavBar` component that wraps the top of each page and includes the dark mode toggle. Add it to `layout.tsx` or inject it into each page. Given the current structure where `TranscriptReader` manages its own layout (`min-h-screen bg-white flex`), the cleanest approach is to add the toggle to each page's existing header/nav area rather than injecting a global navbar that conflicts with the reader's full-screen layout. The toggle button can float at a fixed position (`fixed top-4 right-4 z-50`) to avoid layout conflicts.

### Updating Existing Components

The existing components use hardcoded Tailwind color classes (`bg-white`, `text-gray-900`, etc.). These need dark variants added. The modules page already uses `dark:` variants (e.g., `dark:bg-zinc-900`, `dark:text-zinc-50`). This confirms the `dark:` Tailwind class approach is intended by the project.

**Strategy for TranscriptReader and other components:** Replace the most impactful hardcoded colors with dark variants. Key changes:
- `bg-white` → `bg-white dark:bg-[#1a1a2e]`
- `text-gray-900` → `text-gray-900 dark:text-[#e8e8f0]`
- `border-gray-100` → `border-gray-100 dark:border-[#2d2d4a]`
- `bg-gray-50` → `bg-gray-50 dark:bg-[#16213e]`

### Highlight Colors in Dark Mode

Current highlight colors use `rgba(r, g, b, 0.35)` for module colors and `#e5e7eb` for untagged. In dark mode these need adjustment for readability. Rather than changing the opacity calculation, add a CSS variable for highlight opacity that changes in dark mode:

```typescript
// In getHighlightStyle — use 0.5 opacity in dark mode
// Detection: check document.documentElement.classList.contains('dark')
// But this is a pure function — better to pass isDark as a parameter or use CSS
```

Simpler approach: use CSS `mix-blend-mode` or increase opacity. The cleanest path is to bump the opacity from 0.35 to 0.55 in dark mode by adding a data attribute or CSS class to mark elements: `dark:opacity-[0.55]` on the `<mark>` element + inline style for the base.

Actually simplest: the `getHighlightStyle` function is called during render. Use `window.matchMedia('(prefers-color-scheme: dark)')` is not needed since we're class-based — check `document.documentElement.classList.contains('dark')`. But this introduces a side effect in a pure render function. Better: store the opacity as a CSS variable:

```css
:root { --highlight-opacity: 0.35; }
.dark { --highlight-opacity: 0.5; }
```

Then in `getHighlightStyle`:
```typescript
return { backgroundColor: `rgba(${r}, ${g}, ${b}, var(--highlight-opacity, 0.35))` }
```

This is the cleanest approach — pure CSS, no JS logic in the render function.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Dark mode system + manual toggle | Custom event system, React context for theme | `@custom-variant dark` + class on `<html>` + localStorage |
| Paragraph boundary counting in Range | Complex DOM traversal | TreeWalker with `NodeFilter.SHOW_ELEMENT` scoped to the container |
| RLS permissive policies | Custom API middleware | Standard Supabase SQL in migration file |

---

## Common Pitfalls

### Pitfall 1: Dark Mode Toggle Hydration Mismatch
**What goes wrong:** `DarkModeToggle` reads `localStorage` on mount, but SSR renders in light mode. After hydration, the icon switches, causing a flash or React hydration error.
**Why it happens:** `localStorage` is not available during SSR. `useState(false)` is the safe SSR default but diverges from client reality.
**How to avoid:** Initialize with `useState(false)` and use `useEffect` to sync on mount (shown in the component above). This is the standard Next.js pattern — the toggle may briefly show the wrong icon but it's a client component so hydration is fast.

### Pitfall 2: `@custom-variant` Scope — existing `dark:` classes stop working
**What goes wrong:** After adding `@custom-variant dark (&:where(.dark, .dark *))`, the system `prefers-color-scheme` no longer triggers dark mode. Some pages (like the initial page.tsx and modules page) already use `dark:` classes assuming system preference.
**Why it happens:** `@custom-variant` replaces the default dark mode variant with the class-based one. System preference is no longer automatic.
**How to avoid:** The inline `<script>` in layout.tsx handles this — it adds `.dark` to `<html>` when system preference is dark AND no localStorage override exists. This re-implements the `prefers-color-scheme` behavior via JS class toggling.

### Pitfall 3: Timestamp in `data-paragraph-id` div's textContent
**What goes wrong:** After fixing `getOffsetInParagraph` to use the `<p>` element, speaker labels may still be included if the speaker label `<div>` is inside the `<p>`.
**Why it happens:** `ParagraphView` renders the speaker label as a `<div className="mb-1">` BEFORE the `<p>` — it's a sibling, not inside `<p>`. So `querySelector('p')` correctly excludes it.
**How to avoid:** Verify the fix with a paragraph that has both a timestamp AND a speaker label — confirm offsets are relative to the `<p>` text only.

### Pitfall 4: Annotation cascade on transcript re-seed
**What goes wrong:** Re-seeding the global-perspectives transcript deletes all paragraphs (CASCADE), which also deletes all annotations on that transcript.
**Why it happens:** `import-corpus.ts` deletes existing paragraphs before re-inserting. Annotations have `ON DELETE CASCADE` on their paragraph FK.
**How to avoid:** User decision says "preserve if possible." Mitigation: export annotations for the affected transcript before re-seeding, then re-import after. OR: change the import script to preserve paragraphs that haven't changed (via content_hash comparison) and only insert NEW paragraphs. The latter is safer for a corpus with annotations.

### Pitfall 5: Multi-paragraph selection breaks virtualization
**What goes wrong:** TanStack Virtual only renders items within the viewport (+ overscan of 5). If a user selects text from paragraph 10 to paragraph 20, but some of those paragraphs are outside the viewport, `range.commonAncestorContainer` may span non-rendered DOM elements.
**Why it happens:** Virtual items outside the viewport have their DOM removed. A selection that visually appears to cross paragraph boundaries may have a collapsed range under the hood if paragraphs were removed during scroll.
**How to avoid:** The `overscan: 5` setting in VirtualizedReader provides a buffer. Cap multi-paragraph selections at a reasonable number (15) which is well within what's rendered. Add a validation in `createSelectorFromRange`: if `startPara` or `endPara` is null, reject the selection with a clear error.

### Pitfall 6: `section.talk-secondary` timestamp context
**What goes wrong:** When parsing `section.talk-secondary`, the preceding sibling check for timestamps (`$p.prev().is('div.talk-meta')`) may not work if the talk-meta div is INSIDE the section (not a sibling of `<p>`).
**Why it happens:** Looking at live HTML: `<section class="talk-secondary"><div class="talk-meta"><p class="talk-name">Audience</p>...</div><p class="no-indent">text</p></section>`. The talk-meta div is a sibling of `<p>`, so the existing sibling check works. BUT the `talk-meta` div here contains `talk-name`, not `talk-timestamp` — audience paragraphs typically don't have timestamps. The existing timestamp extraction logic (`$prev.find('p.talk-timestamp')`) will correctly return null/empty for audience paragraphs.

---

## Code Examples

### RLS Migration (verified pattern)
```sql
-- Source: Supabase official docs
alter table transcripts enable row level security;
create policy "Allow all access"
  on transcripts for all to anon using (true) with check (true);
```

### Tailwind v4 dark mode setup (verified pattern)
```css
/* Source: https://tailwindcss.com/docs/dark-mode */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root { --background: #ffffff; }
.dark { --background: #1a1a2e; }
```

### Theme initialization script (verified pattern)
```html
<!-- Source: https://tailwindcss.com/docs/dark-mode -->
<script>
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

### Offset bug fix (verified by code analysis)
```typescript
// Source: analysis of src/lib/annotations/selectors.ts + src/components/transcripts/ParagraphView.tsx
function getOffsetInParagraph(range: Range, paragraphDiv: Element): { start: number; end: number } {
  // Scope to <p> element to exclude timestamp + speaker label text
  const textElement = paragraphDiv.querySelector('p') ?? paragraphDiv
  const paragraphText = textElement.textContent || ''
  const rangeText = range.toString()

  const startOffset = paragraphText.indexOf(rangeText)
  if (startOffset >= 0) {
    return { start: startOffset, end: startOffset + rangeText.length }
  }

  // TreeWalker fallback — also scoped to textElement
  const treeWalker = document.createTreeWalker(textElement, NodeFilter.SHOW_TEXT, null)
  // ... rest unchanged
}
```

### Highlight opacity in dark mode (CSS variable approach)
```css
:root { --highlight-opacity: 0.35; }
.dark { --highlight-opacity: 0.5; }
```

```typescript
// In getHighlightStyle:
return { backgroundColor: `rgba(${r}, ${g}, ${b}, var(--highlight-opacity, 0.35))` }
```

### Parser extension for audience content (verified from live HTML)
```typescript
// Source: live HTML analysis of organism.earth/library/document/global-perspectives-and-psychedelic-poetics
const allTalkSections = $('section.talk, section.talk-secondary')
allTalkSections.each((_, sectionEl) => {
  const $section = $(sectionEl)
  const sectionSpeaker = $section.find('.talk-meta .talk-name').text().trim() || null
  $section.children('p').each((_, pEl) => {
    const $p = $(pEl)
    if ($p.hasClass('talk-timestamp') || $p.hasClass('talk-name')) return
    const text = $p.text().trim()
    if (!text) return
    let timestamp: string | null = null
    const $prev = $p.prev()
    if ($prev.is('div.talk-meta')) {
      timestamp = $prev.find('p.talk-timestamp').text().trim() || null
    }
    const speaker = sectionSpeaker || authorName
    paragraphs.push({ position: paragraphs.length, speaker, timestamp, text, contentHash: hashParagraph(text) })
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Tailwind v3: `darkMode: 'class'` in tailwind.config.js | Tailwind v4: `@custom-variant dark` in CSS | Config is in CSS, not JS |
| Separate migration files for each concern | Same: SQL editor in Supabase dashboard | No change needed |

**Deprecated/outdated:**
- `tailwind.config.js darkMode: 'class'` — Does not exist in Tailwind v4. Use `@custom-variant` in CSS.

---

## Open Questions

1. **How many transcripts beyond "Global Perspectives" have missing audience content?**
   - What we know: organism.earth uses `section.talk-secondary` for Q&A; the parser misses all of them
   - What's unclear: how many of the 92 transcripts are Q&A format vs pure monologue
   - Recommendation: Run the updated parser against all 92 transcript URLs during spot-check to count affected transcripts; decide whether to re-scrape all or just affected ones

2. **Annotation preservation during transcript re-seed**
   - What we know: re-seeding deletes paragraphs via CASCADE, deleting annotations
   - What's unclear: how many annotations already exist on affected transcripts
   - Recommendation: Before re-seeding any transcript, check `SELECT count(*) FROM annotations WHERE transcript_id = '...'` in Supabase dashboard. If > 0, implement paragraph-aware import before re-seeding.

3. **Middle-paragraph ParagraphAnchor storage for existing multi-paragraph selections**
   - What we know: the current `createSelectorFromRange` stores only start and end ParagraphAnchors, not middle ones
   - What's unclear: whether the new rendering approach (full-span middle paragraph fallback) needs ParagraphAnchors for middle paragraphs or can infer from `start_paragraph_id < id < end_paragraph_id`
   - Recommendation: The inference approach (no ParagraphAnchor needed for middle paragraphs) is simpler and avoids storing redundant data. Use this approach.

---

## Sources

### Primary (HIGH confidence)
- Live code analysis: `/src/lib/annotations/selectors.ts` — offset bug root cause identified
- Live code analysis: `/src/components/transcripts/ParagraphView.tsx` — DOM structure confirming timestamp in wrapper div
- Live HTML fetch: `organism.earth/library/document/global-perspectives-and-psychedelic-poetics` — `section.talk-secondary` structure confirmed, `talk-name` elements found
- Official docs: https://tailwindcss.com/docs/dark-mode — `@custom-variant` pattern, localStorage+matchMedia hybrid approach
- Official docs: https://supabase.com/docs/guides/database/postgres/row-level-security — `for all to anon using (true)` pattern

### Secondary (MEDIUM confidence)
- Code analysis: `supabase/migrations/005_create_annotations_table.sql` — confirms `ON DELETE CASCADE` for annotations on paragraph deletion
- Code analysis: existing `dark:` classes in `modules/page.tsx` — confirms project already uses Tailwind dark mode convention

### Tertiary (LOW confidence)
- Assumption: the `mix-blend-mode` behavior of highlight marks in dark mode — not tested, opted for CSS variable opacity approach instead

---

## Metadata

**Confidence breakdown:**
- RLS: HIGH — pure SQL, verified against Supabase docs
- Highlight offset bug: HIGH — root cause identified by code trace, fix is obvious
- Audience transcripts: HIGH — live HTML confirmed `section.talk-secondary` structure
- Multi-paragraph highlights: HIGH — data model already supports it, gaps are clear
- Dark mode: HIGH — Tailwind v4 docs verified, existing project patterns confirm approach

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable stack, no fast-moving dependencies)
