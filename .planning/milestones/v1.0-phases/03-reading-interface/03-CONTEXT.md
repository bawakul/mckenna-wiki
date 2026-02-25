# Phase 3: Reading Interface - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean, performant reading experience for transcripts up to 87K words. Users can browse the transcript list, read individual transcripts with visible paragraph structure/timestamps/speakers, search within transcripts, and handle large documents smoothly via virtualization. Creating annotations and module tagging are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Transcript list & navigation
- Default sort: chronological (oldest first) — follow McKenna's intellectual evolution
- List display: minimal (title + date only)
- Filtering: topic tags only (no date range, duration, or location filters)
- Search: combined title + full-text corpus search from the list page

### Reading layout & typography
- Paragraph spacing: compact — more content visible, less scrolling
- Timestamps: left margin gutter — keeps text clean
- Speaker labels: show on change only — avoids clutter in monologue sections
- Theme: light only — no dark mode

### In-transcript search
- UI: sidebar panel that can stay open
- Results display: both sidebar list with context snippets AND highlights in text
- Navigation: click items in sidebar list to jump (no prev/next buttons)
- Search type: plain text only (no regex)

### Large transcript handling
- Progress indicator: none needed — standard scrollbar sufficient
- Position memory: offer to resume ("Continue where you left off?" prompt)
- Loading state: spinner + transcript title
- Jump navigation: none — search is enough

### Claude's Discretion
- Typography choices (font family, line height, max-width)
- Exact virtualization implementation approach
- Search highlight colors and styling
- Sidebar panel width and collapse behavior
- Empty state designs (no search results, no transcripts match filter)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-reading-interface*
*Context gathered: 2026-02-06*
