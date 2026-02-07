# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** Phase 2 - Module System (complete)

## Current Position

Phase: 3 of 6 (Reading Interface)
Plan: 1 of 4 in phase 3
Status: In progress
Last activity: 2026-02-07 — Completed 03-01-PLAN.md (Transcript List Page)

Progress: [████████████████████░░░░] Phase 1: 100% | Phase 2: 100% | Phase 3: 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 3.9 min
- Total execution time: 0.61 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-corpus-foundation | 4 | 25 min | 6.25 min |
| 02-module-system | 4 | 10 min | 2.5 min |
| 03-reading-interface | 1 | 2 min | 2.0 min |

**Recent Trend:**
- Last plan: 03-01 (2 min) — transcript list with search and filtering
- Previous: 02-03 (4 min), 02-04 (3 min), 02-02 (1 min)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From PROJECT.md (requirements phase):**
- One module per passage — Keeps data model and UI simple; multi-tagging adds complexity without clear v1 value
- Simple module model (name + description) — Let patterns emerge from use before imposing structure
- Personal tool, public insights — Avoids redistribution issues with transcripts; tool serves the analyst, publications serve the audience
- Organism.earth only for v1 — 90 transcripts / 1.3M words is sufficient corpus; other sources add complexity without proportional value
- LLM as convenience, not discovery — User is the domain expert; LLM accelerates obvious tagging, doesn't replace judgment (deferred to v2)
- Next.js + Supabase — User's preferred stack; good fit for text-heavy app with structured data

**From Phase 1 (Corpus Foundation):**
- Use tsx for running TypeScript scripts directly (no build step needed for scraping)
- Zod for runtime validation of scraped data
- SHA-256 hashing for content deduplication (16 chars for paragraphs, 64 for transcripts)
- Default speaker to 'Terence McKenna' for all paragraphs (monologue format)
- Generated tsvector columns with triggers for automatic full-text search index updates
- Weighted search vectors (A=title, B=description, C=tags/authors) for relevance ranking
- Service role key for seed script (admin-level access for batch operations)
- Batch paragraph inserts (50 per batch) to avoid payload size limits

**From Phase 2 Plan 1 (Module Foundation):**
- Support both NEXT_PUBLIC_ and non-prefixed env vars in server client for backward compatibility
- Zod moved to dependencies for runtime validation in Server Actions/API routes
- Server Supabase client pattern: async createClient() with cookie-based auth
- Zod schemas named *InputSchema for form/API input validation

**From Phase 2 Plan 2 (Module CRUD Operations):**
- ActionResult<T> discriminated union for type-safe Server Action error handling
- PostgreSQL 23505 error code for duplicate name detection
- touchModuleLastUsed skips revalidation (background operation)
- highlight_count placeholder returns 0 until Phase 4 highlights table exists

**From Phase 2 Plan 3 (Module Management UI):**
- Seed modules deferred - created organically during reading sessions instead of upfront
- Delete dialog fetches usage count on open (lazy loading)
- Color picker uses button grid with hidden input for form submission

**From Phase 2 Plan 4 (Module Selector UI):**
- Floating UI setup: useFloating + offset(8) + flip + shift(padding: 8) + autoUpdate
- Controlled/uncontrolled component pattern for programmatic triggering
- First preset color auto-assigned for inline creation to keep flow fast

**From Phase 3 Plan 1 (Transcript List Page):**
- URL-based filter state management enables shareable filtered views
- Post-query tag filtering for combined search + tag (Supabase limitation workaround)
- TranscriptListItem type for minimal list data fetching
- Chronological sort (oldest first) follows McKenna's intellectual evolution

### Phase 1 Results

**Corpus Statistics:**
- 92 transcripts (exceeds 90 requirement)
- 10,734 paragraphs
- 1,357,234 words (~1.36M)

**Performance:**
- Full-text search: 90-131ms (well under 200ms requirement)
- Hash-based change detection: Verified working

**Infrastructure:**
- Private corpus repo: `mckenna-corpus` on GitHub
- Database: Supabase with full-text search indexes
- Verification script: `npm run verify:corpus`

### Pending Todos

None.

### Blockers/Concerns

**Phase 3 (Reading Interface):**
- Virtualization CRITICAL for 87K word transcript performance (research flag)
- Must test with longest transcript + 100 mock annotations in Phase 3

**Phase 4 (Annotation Engine):**
- Custom Selection API vs @recogito/react-text-annotator library decision needed during planning
- Hybrid selector implementation (paragraph ID + text quote + offset) to prevent orphaned annotations (27% orphan rate in research)

**Phase 5 (Analysis Views):**
- Materialized views needed for <200ms query performance at 1000+ annotations (research recommendation)

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 03-01-PLAN.md (Transcript List Page)
Resume file: None
Next: 03-02-PLAN.md (Transcript Reader with virtualization)
