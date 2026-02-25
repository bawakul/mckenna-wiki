---
phase: 03-reading-interface
plan: 04
subsystem: ui
tags: [nextjs, typescript, react, search, localStorage]

# Dependency graph
requires:
  - phase: 03-reading-interface
    plan: 03
    provides: Virtualized paragraph rendering with TanStack Virtual
provides:
  - In-transcript search with left sidebar results and text highlighting
  - Reading position memory with localStorage persistence
  - Resume prompt for returning readers
  - Left sidebar layout with metadata and search in one panel
affects: [04-annotation-engine]

# Tech tracking
tech-stack:
  added:
    - react-highlight-words (search term highlighting)
  patterns:
    - Left sidebar layout for metadata + search
    - Debounced localStorage saves for position memory
    - Imperative scroll-to-index via callback ref

key-files:
  created:
    - src/components/transcripts/TranscriptSearch.tsx
    - src/components/transcripts/ResumePrompt.tsx
    - src/hooks/useReadingPosition.ts
  modified:
    - src/components/transcripts/TranscriptReader.tsx (left sidebar layout, search integration)
    - src/components/transcripts/VirtualizedReader.tsx (scroll-to-index callback, padding)
    - src/components/transcripts/ParagraphView.tsx (search highlighting, current match)

key-decisions:
  - "Left sidebar layout - metadata and search combined in sticky sidebar"
  - "Search in left sidebar (not floating right) - keeps search results near metadata context"
  - "react-highlight-words for search highlighting - simple, lightweight library"
  - "Debounced position save (1s) to avoid excessive localStorage writes"
  - "7-day expiration for position memory - reasonable for reading continuity"
  - "Cmd/Ctrl+F hijacks browser search to use in-transcript search"

patterns-established:
  - "useTranscriptSearch hook for search state and result computation"
  - "useReadingPosition hook for localStorage position persistence"
  - "scrollToIndexRef callback pattern for parent-controlled virtualized scrolling"
  - "SearchResult type for structured search results with snippets"

# Metrics
duration: ~10min (across sessions)
completed: 2026-02-08
---

# Phase 3 Plan 4: Search and Position Memory Summary

**In-transcript search with left sidebar results, text highlighting, and reading position memory with resume prompt**

## Performance

- **Duration:** ~10 min (across multiple sessions with layout refactor)
- **Completed:** 2026-02-08
- **Tasks:** 6
- **Files created:** 3
- **Files modified:** 3

## Accomplishments

- Left sidebar layout combining metadata, topic tags, and search
- In-transcript search with:
  - Search input in left sidebar
  - Results list with context snippets and match counts
  - Yellow highlighting of matches in transcript text
  - Current match with additional background highlight
  - Click-to-jump navigation
- Reading position memory:
  - Debounced saves to localStorage (1s delay)
  - 7-day expiration for stale positions
  - Resume prompt with progress percentage
  - Continue/dismiss actions
- Keyboard shortcut (Cmd/Ctrl+F) for search focus
- Improved reading area padding (px-8 py-8, max-w-2xl centered)

## Files Created/Modified

**Created:**
- `src/components/transcripts/TranscriptSearch.tsx` - Search hook and result types
- `src/components/transcripts/ResumePrompt.tsx` - Position resume prompt component
- `src/hooks/useReadingPosition.ts` - localStorage position persistence hook

**Modified:**
- `src/components/transcripts/TranscriptReader.tsx` - Left sidebar layout with integrated search
- `src/components/transcripts/VirtualizedReader.tsx` - Scroll-to-index callback, padding
- `src/components/transcripts/ParagraphView.tsx` - Highlighter integration, current match styling

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       min-h-screen flex                       │
├──────────────────────┬────────────────────────────────────────┤
│   Left Sidebar       │           Main Reading Area            │
│   (w-80, sticky)     │        (flex-1, virtualized)           │
│                      │                                        │
│   ← Back link        │      ┌─────────────────────┐          │
│   Title              │      │  Paragraph          │          │
│   Metadata           │      │  (max-w-2xl)        │          │
│   Description        │      │                     │          │
│   Topic tags         │      │  ...virtualized...  │          │
│   ──────────         │      │                     │          │
│   Search input       │      └─────────────────────┘          │
│   Results list       │                                        │
│                      │                                        │
└──────────────────────┴────────────────────────────────────────┘
```

## Decisions Made

**1. Left sidebar layout**
- Rationale: Combines metadata context with search; frees main area for reading

**2. Search in sidebar (not floating panel)**
- Rationale: Results stay visible while reading; no overlay obscuring content

**3. Cmd/Ctrl+F hijacks browser search**
- Rationale: Natural keyboard shortcut; in-transcript search more useful than browser find

**4. 1-second debounce for position saves**
- Rationale: Balances responsiveness with localStorage write efficiency

**5. 7-day position expiration**
- Rationale: Long enough for typical reading continuity; cleans up stale data

**6. max-w-2xl centered reading area**
- Rationale: Comfortable reading width; prevents lines from being too long

## Deviations from Plan

1. **Layout refactor** - Original plan had right-side floating sidebar; changed to left sidebar layout for better UX
2. **SearchSidebar.tsx not created** - Search integrated directly into TranscriptReader's left sidebar instead of separate component

## Issues Encountered

1. **Type issue with debounce** - Fixed by properly typing the debounce function with generics
2. **Layout polish** - Required additional padding adjustments in VirtualizedReader

## User Setup Required

None - no external service configuration required.

## Verification Checklist

- [x] react-highlight-words in package.json
- [x] Cmd/Ctrl+F focuses search input
- [x] Search results show in sidebar with context snippets
- [x] Search matches highlighted in transcript text (yellow)
- [x] Clicking search result scrolls to paragraph
- [x] Reading position saved to localStorage (debounced)
- [x] Resume prompt shows when returning to transcript
- [x] "Continue" button jumps to saved position
- [x] "Start over" button dismisses prompt
- [x] npm run build succeeds without errors

## Next Phase Readiness

Ready for Phase 4 (Annotation Engine):
- Data attributes present on paragraphs (data-paragraph-id, data-paragraph-position)
- Virtualized rendering in place for large transcripts
- Search highlighting pattern established for annotation highlighting
- Left sidebar layout can accommodate annotation panel

---
*Phase: 03-reading-interface*
*Completed: 2026-02-08*
