# Phase 1: Corpus Foundation - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Scrape 90 McKenna transcripts from organism.earth, structure them as paragraphs with metadata, store as JSON in a separate private corpus repo, and provide a seed script to import into Supabase with full-text search. This phase is pure data acquisition and storage — no UI, no user-facing features.

</domain>

<decisions>
## Implementation Decisions

### Transcript structure
- Preserve source paragraph breaks from organism.earth as-is — no re-segmentation
- Store timestamps where the source provides them, leave null otherwise — don't fabricate
- Speaker identification: use actual names when the source identifies them (e.g., Rupert Sheldrake, Ralph Abraham), fall back to generic labels ("Audience", "Questioner") when not identified
- Paragraph IDs: store both sequential position index (for display order) and content hash (for change detection and annotation anchoring in Phase 4)

### Metadata extraction
- Only capture metadata that organism.earth provides on the page — no inference, no LLM extraction, no text mining
- Missing metadata fields left as null — no guessing, no flagging for review
- Referenced authors field: only store if organism.earth lists them on the page (consistent with source-only approach)
- Dates stored as-is from source — if only year is provided, store year only; don't normalize to YYYY-MM-DD with fabricated month/day

### Corpus as separate repo
- Private GitHub repo — avoids redistribution concerns with organism.earth content
- Data format: one JSON file per transcript containing metadata + paragraphs
- Scraper code lives in the main app repo, not the corpus repo (corpus repo = data only)
- Import method: seed script in app repo reads JSON files from corpus repo and upserts into Supabase
- Content hashes used by seed script to skip unchanged transcripts on re-import

### Scraping approach
- Batch scrape: scrape all 90 transcripts every run — corpus is small enough that incremental detection isn't worth the complexity
- Smart import: seed script uses content hashes to only upsert changed transcripts into Supabase
- Error handling: skip failed transcripts and log which ones failed, continue with rest — re-run to retry
- Output: scraper outputs final structured JSON directly — no intermediate raw HTML stage

### Claude's Discretion
- Rate limiting / politeness delays for organism.earth scraping
- JSON schema design for transcript files
- Full-text search implementation in Supabase (tsvector, pg_trgm, etc.)
- Seed script error handling and reporting
- Content hash algorithm choice

</decisions>

<specifics>
## Specific Ideas

- Paragraph anchoring inspired by e-book reader patterns (EPUB CFI, Kindle locations, Hypothesis web annotations): structural position for navigation + content fingerprint for verification
- Research recommendation from project state: test scraping with 5-10 transcripts before scaling to all 90

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-corpus-foundation*
*Context gathered: 2026-02-05*
