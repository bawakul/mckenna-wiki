# Phase 2: Module System - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Create and manage thematic modules for tagging McKenna passages. Modules are more than simple tags — they're containers for evolving research notes and insights about recurring themes. This phase builds the module CRUD and selection UI; actual tagging of passages is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Module Data Model
- Name: descriptive phrase (soft limit ~40 chars, warn if exceeded)
- Notes: extended markdown field for essays, insights, evolving understanding
- Color: selected from preset muted/pastel palette
- No icons — colors only
- Names must be unique (prevent duplicates)
- Colors can be shared across modules

### Seed Modules
- 8 seed modules will be created manually by user through the UI (not DB seed)
- Seeds are fully editable and deletable like any other module
- User will provide the specific 8 themes before Phase 4

### Module Creation Flow
- Dedicated "Modules" page for full management (create, edit, delete, write notes)
- Inline creation during reading: name required, color auto-assigned, notes optional
- Can edit modules later to add notes and change color

### Module Deletion
- Warn with count of affected highlights before delete
- User confirms deletion
- Highlights remain (become untagged), only module reference cleared

### Quick-Selection Interface
- Mouse/click-first interaction (not keyboard shortcuts)
- Floating selector appears near the text selection
- Vertical list with color indicators on left
- Sorted by recently used (most recent at top)
- "Create new module" option at bottom for inline creation

### Claude's Discretion
- Exact dimensions and positioning of floating selector
- Specific muted/pastel color palette (10-15 colors)
- Soft character limit enforcement UX
- Markdown editor choice for notes field
- Modules page layout and organization

</decisions>

<specifics>
## Specific Ideas

- Modules are research containers, not just tags — "I can write whole essays about each of the modules"
- This is first a research tool — modules capture evolving understanding of McKenna's themes
- Future potential: modules become the place to write about insights (noted for v2 scope)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-module-system*
*Context gathered: 2026-02-06*
