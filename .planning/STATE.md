# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** Phase 1 - Corpus Foundation

## Current Position

Phase: 1 of 6 (Corpus Foundation)
Plan: 1 of TBD in current phase
Status: In progress
Last activity: 2026-02-05 — Completed 01-01-PLAN.md (project initialization & HTML exploration)

Progress: [█░░░░░░░░░] ~5% (estimated - plan count TBD)

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 9 min
- Total execution time: 0.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-corpus-foundation | 1 | 9 min | 9 min |

**Recent Trend:**
- Last plan: 01-01 (9 min)
- Trend: First plan baseline

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

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 (Corpus Foundation):**
- ~~Organism.earth scraping terms need verification before building scraper~~ ✅ Resolved: Polite scraping works without blocks (3s delays, descriptive User-Agent)
- Test scraping with 5-10 transcripts before scaling to all 90 (research recommendation) — Still applicable
- Longest transcript is 87K words — performance testing needed early
- NEW: Date extraction will require parsing from title/URL (not in structured metadata)
- NEW: No speaker markup in HTML (confirmed monologue format - all content is McKenna)

**Phase 3 (Reading Interface):**
- Virtualization CRITICAL for 87K word transcript performance (research flag)
- Must test with longest transcript + 100 mock annotations in Phase 3

**Phase 4 (Annotation Engine):**
- Custom Selection API vs @recogito/react-text-annotator library decision needed during planning
- Hybrid selector implementation (paragraph ID + text quote + offset) to prevent orphaned annotations (27% orphan rate in research)

**Phase 5 (Analysis Views):**
- Materialized views needed for <200ms query performance at 1000+ annotations (research recommendation)

## Session Continuity

Last session: 2026-02-05 (plan 01-01 execution)
Stopped at: Completed 01-01-PLAN.md - project initialized, HTML structure documented
Resume file: None
Next: Plan 01-02 (database schema design) or continue with scraper implementation
