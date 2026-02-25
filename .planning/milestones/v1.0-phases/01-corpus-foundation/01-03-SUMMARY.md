---
phase: 01-corpus-foundation
plan: 03
subsystem: database
tags: [supabase, postgres, full-text-search, tsvector, gin-index, migrations, seed-script]

# Dependency graph
requires:
  - phase: 01-01
    provides: Transcript structure from HTML analysis (105 McKenna lectures, paragraph format)
provides:
  - Database schema with transcripts and transcript_paragraphs tables
  - Generated tsvector columns with GIN indexes for full-text search
  - search_paragraphs() and search_transcripts() RPC functions
  - Seed script for importing JSON corpus files into Supabase
  - Hash-based change detection for re-imports
affects: [01-04-scraper-and-corpus-generation, 02-reading-interface, 03-search-infrastructure]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Generated tsvector columns for automatic full-text search index updates
    - Weighted search vectors (A=title, B=description, C=tags/authors)
    - Hash-based change detection for idempotent imports
    - Batched inserts (50 per batch) for large datasets

key-files:
  created:
    - supabase/migrations/001_create_corpus_tables.sql
    - supabase/migrations/002_create_search_function.sql
    - scripts/seed/import-corpus.ts
  modified:
    - package.json

key-decisions:
  - "Use generated tsvector columns (STORED) instead of manual index maintenance"
  - "Separate migration files for schema vs functions for cleaner organization"
  - "Service role key for seed script (admin-level access for batch operations)"
  - "Batch paragraph inserts (50 per batch) to avoid payload size limits"
  - "Independent JSON interface in seed script (no dependency on scraper types)"

patterns-established:
  - "Database migrations in supabase/migrations/ with sequential numbering (001_, 002_)"
  - "Seed scripts in scripts/seed/ directory"
  - "CLI args with env var fallbacks for configuration"
  - "Clear error messages for missing credentials with source documentation"

# Metrics
duration: 1min
completed: 2026-02-05
---

# Phase 01 Plan 03: Database Schema and Seed Script Summary

**Postgres schema with full-text search (GIN indexes, weighted tsvector) and hash-based corpus import seed script**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-05T17:13:24Z
- **Completed:** 2026-02-05T17:15:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Database schema with transcripts and paragraphs tables supporting 105 McKenna transcripts
- Full-text search infrastructure with generated tsvector columns and GIN indexes for sub-200ms performance
- Two RPC functions: search_paragraphs() and search_transcripts() with relevance ranking
- Seed script with hash-based change detection for idempotent re-imports
- CLI interface with --corpus-path and --dry-run options

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase database schema with full-text search** - `df857ef` (feat)
2. **Task 2: Build seed script for corpus import** - `a347251` (feat)

## Files Created/Modified
- `supabase/migrations/001_create_corpus_tables.sql` - Tables with generated tsvector columns, GIN indexes, updated_at trigger
- `supabase/migrations/002_create_search_function.sql` - search_paragraphs() and search_transcripts() RPC functions
- `scripts/seed/import-corpus.ts` - Import JSON corpus files with hash-based change detection and batch inserts
- `package.json` - Added seed and seed:dry-run scripts

## Decisions Made

**1. Generated tsvector columns (STORED) for automatic index updates**
- Rationale: Eliminates manual trigger maintenance, ensures search index stays in sync with content
- Tradeoff: Slight storage overhead vs significantly simpler maintenance

**2. Weighted search vectors (A=title, B=description, C=tags/authors)**
- Rationale: Title matches should rank higher than tag matches in search results
- Implementation: setweight() in generated column definition

**3. Service role key for seed script (not anon key)**
- Rationale: Batch operations need admin-level access, bypassing RLS policies
- Security: Service key stored in .env.local (gitignored), not exposed to client

**4. Batch paragraph inserts (50 per batch)**
- Rationale: Prevents payload size limit errors when importing 87K word transcripts (thousands of paragraphs)
- Performance: Minimal impact - 50 is conservative, could go higher if needed

**5. Independent JSON interface in seed script**
- Rationale: Avoids circular dependency between seed script and scraper
- Maintainability: Seed script defines minimal interface, doesn't need scraper internals

## Deviations from Plan

**Post-execution fixes (2026-02-06):**
1. SQL migration updated from `GENERATED ALWAYS AS` columns to trigger-based tsvector updates. Supabase's hosted Postgres requires immutable expressions for generated columns, and `to_tsvector('english', ...)` doesn't qualify. The trigger approach is functionally equivalent but compatible with Supabase.
2. Added `dotenv` package and updated seed script to auto-load `.env.local` (Next.js convention) since Node/tsx doesn't load it automatically.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- Environment variables to add (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)
- Dashboard configuration steps (create Supabase project)
- Verification commands

## Next Phase Readiness

**Ready for 01-04 (Scraper and Corpus Generation):**
- Database schema complete and ready to receive data
- Seed script tested and gives clear error messages
- Migrations ready to apply once Supabase project is created

**Blockers:**
- User must create Supabase project and configure environment variables (01-USER-SETUP.md)
- SQL migrations must be applied manually in Supabase SQL editor or via CLI

**Next steps:**
1. User completes setup in 01-USER-SETUP.md
2. User applies SQL migrations to Supabase
3. Plan 01-04 runs scraper to generate corpus JSON files
4. Plan 01-04 runs seed script to import corpus into database

**Technical validation needed in 01-04:**
- Test seed script with real corpus JSON files
- Verify hash-based change detection works correctly
- Test full-text search performance with longest transcript (87K words)

---
*Phase: 01-corpus-foundation*
*Completed: 2026-02-05*
