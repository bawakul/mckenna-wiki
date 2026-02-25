# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** v1.0 shipped — planning next milestone

## Current Position

Phase: v1.0 complete (8 phases, 35 plans)
Status: Milestone shipped
Last activity: 2026-02-25 — v1.0 MVP milestone completed and archived

Progress: [████████████████████████████████] All phases complete

## Performance Metrics

**Velocity:**
- Total plans completed: 35
- Total execution time: ~1.5 hours
- Timeline: 21 days (2026-02-04 → 2026-02-25)

**Codebase:**
- 7,214 LOC TypeScript
- 183 files
- 161 commits

## Accumulated Context

### Pending Todos

1. **[HIGH] Full-text corpus search** — Search actual transcript content (not just metadata). DB function `search_corpus` exists but not exposed in UI.
2. **[HIGH] Lecture favorites** — Bookmark/favorite lectures for quick access.
3. **[HIGH] Password gate** — Simple auth to protect write operations. Single password env var, cookie session, Next.js middleware. Reads stay public.
4. **[HIGH] Fix mobile responsive layout** — Transcript reader, nav bar, annotation UI need work at mobile screen sizes.
5. **Guided lecture exploration - choose your own adventure** (planning) — Branching, curated reading experience where newcomers start with entry-point lectures.
5. ~~**Re-seed database with updated corpus parser**~~ — Done 2026-02-25. 80/92 transcripts updated.

### Known Issues (Non-blocking)

- RLS migration SQL ready but requires manual application via Supabase dashboard
- Some parser edge cases: concatenated speaker labels, missing timestamps, abnormally long paragraphs
- UI polish: reading area padding, timestamp gutter visibility, sidebar toggle placement

## Session Continuity

Last session: 2026-02-25
Stopped at: v1.0 milestone archived

**Next step:** `/gsd:new-milestone` to plan v1.1
