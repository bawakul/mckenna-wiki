# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** Phase 1 - Corpus Foundation

## Current Position

Phase: 1 of 6 (Corpus Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-04 — Roadmap created with 6 phases covering 19 v1 requirements

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: N/A
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: N/A
- Trend: N/A

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- One module per passage — Keeps data model and UI simple; multi-tagging adds complexity without clear v1 value
- Simple module model (name + description) — Let patterns emerge from use before imposing structure
- Personal tool, public insights — Avoids redistribution issues with transcripts; tool serves the analyst, publications serve the audience
- Organism.earth only for v1 — 90 transcripts / 1.3M words is sufficient corpus; other sources add complexity without proportional value
- LLM as convenience, not discovery — User is the domain expert; LLM accelerates obvious tagging, doesn't replace judgment (deferred to v2)
- Next.js + Supabase — User's preferred stack; good fit for text-heavy app with structured data

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 (Corpus Foundation):**
- Organism.earth scraping terms need verification before building scraper
- Test scraping with 5-10 transcripts before scaling to all 90 (research recommendation)
- Longest transcript is 87K words — performance testing needed early

**Phase 3 (Reading Interface):**
- Virtualization CRITICAL for 87K word transcript performance (research flag)
- Must test with longest transcript + 100 mock annotations in Phase 3

**Phase 4 (Annotation Engine):**
- Custom Selection API vs @recogito/react-text-annotator library decision needed during planning
- Hybrid selector implementation (paragraph ID + text quote + offset) to prevent orphaned annotations (27% orphan rate in research)

**Phase 5 (Analysis Views):**
- Materialized views needed for <200ms query performance at 1000+ annotations (research recommendation)

## Session Continuity

Last session: 2026-02-04 (roadmap creation)
Stopped at: ROADMAP.md and STATE.md created, ready for Phase 1 planning
Resume file: None
