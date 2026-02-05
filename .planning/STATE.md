# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** Phase 1 - Corpus Foundation

## Current Position

Phase: 1 of 6 (Corpus Foundation)
Plan: 3 of TBD in current phase
Status: In progress
Last activity: 2026-02-05 — Completed 01-03-PLAN.md (database schema & seed script)

Progress: [██░░░░░░░░] ~10% (estimated - plan count TBD)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 3.7 min
- Total execution time: 0.18 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-corpus-foundation | 3 | 11 min | 3.7 min |

**Recent Trend:**
- Last plan: 01-03 (1 min)
- Previous: 01-02 (1 min), 01-01 (9 min)
- Trend: Accelerating (plans 02-03 were fast implementation tasks)

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

**From 01-01 (project initialization):**
- Use tsx for running TypeScript scripts directly (no build step needed for scraping)
- Save HTML samples to gitignored directory for offline scraper development
- Document selectors comprehensively in SELECTORS.md before building production scraper
- 3-second delay between requests for polite scraping (no blocks observed)
- 105 McKenna transcripts discovered (exceeds 90 required for v1)

**From 01-03 (database schema):**
- Use generated tsvector columns (STORED) for automatic full-text search index updates
- Weighted search vectors (A=title, B=description, C=tags/authors) for relevance ranking
- Service role key for seed script (admin-level access for batch operations)
- Batch paragraph inserts (50 per batch) to avoid payload size limits on large transcripts
- Independent JSON interface in seed script (no dependency on scraper types)

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 (Corpus Foundation):**
- ~~Organism.earth scraping terms need verification before building scraper~~ ✅ Resolved: Polite scraping works without blocks (3s delays, descriptive User-Agent)
- Test scraping with 5-10 transcripts before scaling to all 90 (research recommendation) — Still applicable
- Longest transcript is 87K words — performance testing needed early
- Date extraction will require parsing from title/URL (not in structured metadata)
- No speaker markup in HTML (confirmed monologue format - all content is McKenna)
- **NEW: User must complete Supabase setup (01-USER-SETUP.md) before plan 01-04**
- **NEW: SQL migrations must be applied manually before seed script can run**

**Phase 3 (Reading Interface):**
- Virtualization CRITICAL for 87K word transcript performance (research flag)
- Must test with longest transcript + 100 mock annotations in Phase 3

**Phase 4 (Annotation Engine):**
- Custom Selection API vs @recogito/react-text-annotator library decision needed during planning
- Hybrid selector implementation (paragraph ID + text quote + offset) to prevent orphaned annotations (27% orphan rate in research)

**Phase 5 (Analysis Views):**
- Materialized views needed for <200ms query performance at 1000+ annotations (research recommendation)

## Session Continuity

Last session: 2026-02-05 (plan 01-03 execution)
Stopped at: Completed 01-03-PLAN.md - database schema and seed script ready
Resume file: None
Next: User setup required (01-USER-SETUP.md), then plan 01-04 (scraper and corpus generation)
