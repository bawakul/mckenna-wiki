# Phase 4: Annotation Engine - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Highlight passages in transcript text and tag them with modules. Highlights exist independently and persist without module tags (module assignment is optional). Each highlight can have at most one module. Hybrid selectors (paragraph ID + text quote + character offset) keep annotations anchored when transcript text changes. Annotation sidebar shows all highlights in current transcript with jump-to-passage navigation.

</domain>

<decisions>
## Implementation Decisions

### Selection Behavior
- Selection snaps to word boundaries (no partial words)
- Cross-paragraph selections allowed (single highlight can span multiple paragraphs)
- Browser default selection highlight during drag (standard blue)
- Floating "Highlight" button appears near selection to confirm

### Highlight Appearance
- Untagged highlights: neutral gray/light background (clearly marked but not colorful)
- Tagged highlights: module's assigned color as background tint
- Overlapping highlights allowed, but only show one color (most recent or first created)
- Clicking a highlight shows popover with details (module name, edit/delete options)

### Annotation Sidebar
- Right side, toggleable (can show/hide for more reading space)
- Each entry shows: text snippet (truncated) + colored module badge if tagged
- Entries ordered by document position (top to bottom in transcript)
- Clicking sidebar entry scrolls transcript to that highlight

### Module Tagging Flow
- After creating highlight, module selector opens automatically (prompt to tag)
- Module picker appears inside the highlight popover (not floating separately)
- Can change/remove module tag from both highlight popover AND sidebar entry
- Inline module creation allowed (type new name, create on the spot)

### Claude's Discretion
- Exact popover design and positioning
- Sidebar width and responsive behavior
- How "most recent" overlap display is determined
- Text snippet truncation length in sidebar
- Toggle button placement and icon

</decisions>

<specifics>
## Specific Ideas

- Reuse the floating module selector component from Phase 2 inside the popover (inline creation already built)
- Popover should feel lightweight — quick to dismiss, not modal-blocking

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-annotation-engine*
*Context gathered: 2026-02-09*
