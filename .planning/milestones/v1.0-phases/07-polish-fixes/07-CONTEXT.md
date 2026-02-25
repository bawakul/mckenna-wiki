# Phase 7: Polish & Fixes - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Bug fixes, missing corpus data, and enhancements for production readiness. Five items: RLS security, highlight offset bug, audience transcript recovery, multi-paragraph highlights, and dark mode. No new features — this is about making what exists work correctly and look right.

</domain>

<decisions>
## Implementation Decisions

### Dark Mode
- Applies to the **whole app** (all pages, not just reader)
- Activation: follows system preference by default, with manual override toggle
- Toggle location: sun/moon icon in header/navbar
- Preference persists in localStorage across sessions
- Palette: soft dark (#1a1a2e) — dark blue-gray tones (Linear/Notion style), not true black
- Highlight colors: adjusted opacity/brightness for dark backgrounds to maintain readability
- Transition: smooth ~200ms CSS fade between themes
- FOUC: not a concern — brief flash acceptable for personal tool

### Multi-Paragraph Highlights
- Display: connected block — continuous highlight color across all paragraphs, looks like one selection
- Boundaries: partial first/last paragraphs allowed — exact selection preserved, not snapped to full paragraphs
- Popover: anchors to start (first paragraph) of the highlight when clicked
- Limit: reasonable cap (~10-20 paragraphs) to prevent accidental huge selections
- Audience paragraphs are fully taggable (same as any other text)

### Audience Transcript Recovery
- Known affected: "Global Perspectives and Psychedelic Poetics" — confirmed missing audience text
- Scope: fix known transcript + spot-check a sample of others to assess broader impact
- Speaker labels: show "Audience" label before audience paragraphs (consistent with existing speaker label rendering)
- Existing annotations: preserve if possible — re-anchor to updated paragraph positions rather than invalidating
- Audience text is fully taggable with modules (not read-only context)

### Highlight Offset Bug
- Bug: visual highlight renders shifted forward (right) from actual selection
- Stored text is correct — the rendering/re-anchoring is the issue, not selection/storage
- Shift amount is roughly consistent across paragraphs
- Affects paragraphs both with and without timestamps
- Fix should address the rendering path where stored selectors are re-anchored to DOM positions

### RLS Security
- Enable Row Level Security with permissive policies on all tables
- Personal tool — simple "allow all" policies sufficient

### Claude's Discretion
- RLS policy specifics (permissive read/write for all authenticated or anon)
- Multi-paragraph data model changes (how span across paragraphs is stored)
- Scraper changes needed for audience text extraction
- Exact dark mode CSS variable structure
- Paragraph cap number for multi-paragraph highlights

</decisions>

<specifics>
## Specific Ideas

- Dark palette reference: Linear/Notion dark mode feel — soft, not harsh
- Highlight offset: the visual render is wrong but saved text is right — points to re-anchoring logic in HighlightRenderer or ParagraphView

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-polish-fixes*
*Context gathered: 2026-02-24*
