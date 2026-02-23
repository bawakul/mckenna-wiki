# Phase 6: Export - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Export tagged passages in markdown and CSV formats. Users can export from module trace views (single module) or bulk export all modules from the modules list page. This phase focuses solely on export functionality — polish and bug fixes are deferred to Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Export Location & Triggers
- Primary export: Button on module trace page (exports that module's passages)
- Bulk export: "Export All" button on /modules page for full corpus export
- Direct download behavior (no preview modal)
- Bulk download produces zip file with separate files per module

### Markdown Format
- Passages grouped by lecture under section headers
- Section headers include lecture title + date (e.g., "## Lecture Title (March 1994)")
- Each passage shows highlighted text + timestamp (if available)
- YAML front matter with module name, color, export date, passage count
- Lectures ordered chronologically within module

### CSV Format
- Column order: module, passage, lecture_title, date, timestamp
- Header row included (standard CSV convention)
- Missing timestamps show "N/A" placeholder
- Bulk CSV: Single combined file (module column distinguishes entries)
- Bulk markdown: Zip of separate files (one per module)

### Claude's Discretion
- Filename conventions for exports
- Text escaping in CSV
- Exact YAML front matter fields
- Button placement and styling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for export functionality.

</specifics>

<deferred>
## Deferred Ideas (Phase 7: Polish)

- **RLS Security** — Enable Row Level Security with permissive policies
- **Highlight offset bug** — Selected text shifts forward when highlight created
- **Missing audience transcripts** — Re-scrape to capture audience Q&A (e.g., Global Perspectives and Psychedelic Poetics)
- **Multi-paragraph highlights** — Allow highlights to span paragraph boundaries
- **Dark mode** — Theme toggle or system preference for transcript reader

</deferred>

---

*Phase: 06-export*
*Context gathered: 2026-02-23*
