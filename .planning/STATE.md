# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** Phase 5 - Analysis Views (in progress)

## Current Position

Phase: 5 of 6 (Analysis Views)
Plan: 3 of 4 in phase 5
Status: In progress
Last activity: 2026-02-14 — Completed 05-03-PLAN.md

Progress: [████████████████████████████████] Phase 1: 100% | Phase 1.1: 100% | Phase 2: 100% | Phase 3: 100% | Phase 4: 100% | Phase 5: 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 22
- Average duration: 3.6 min
- Total execution time: 1.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-corpus-foundation | 4 | 25 min | 6.25 min |
| 01.1-corpus-data-fixes | 2 | 19 min | 9.5 min |
| 02-module-system | 4 | 10 min | 2.5 min |
| 03-reading-interface | 2 | 3 min | 1.5 min |
| 04-annotation-engine | 7 | 29 min | 4.1 min |
| 05-analysis-views | 3 | 6 min | 2.0 min |

**Recent Trend:**
- Last plan: 05-03 (2 min) — navigation entry points
- Previous: 05-02 (2 min), 05-01 (2 min), 04-07 (15 min)

*Updated after each plan completion*

## Accumulated Context

### Roadmap Evolution

- Phase 1.1 inserted after Phase 1: Corpus Data Fixes (INSERTED) — dates and tags not extracted by scraper, discovered during Phase 3 UAT

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

**From Phase 3 Plan 2 (Transcript Reader):**
- Padding instead of margin for paragraph spacing (virtualization-ready)
- Fixed-width timestamp gutter (w-16) for consistent alignment
- Client component for reader enables future search/virtualization
- shouldShowSpeaker helper for conditional speaker label rendering
- Data attributes (data-paragraph-id, data-paragraph-position) for future interaction

**From Phase 1.1 Plan 1 (Parser Update):**
- Store dates as-is without normalization (March 25, 1994, June 1989, etc.)
- 4 transcripts legitimately lack topic tags in source (accepted as valid data)
- Date extracted from h3 tag: $('h3').first()
- Topic tags extracted from section#topics: $('section#topics a.metadata-label-link')

**From Phase 1.1 Plan 2 (Database Re-seed):**
- --force-metadata flag added to import-corpus.ts for metadata-only updates
- 4 transcripts without dates accepted as source limitation (not extraction failure)
- 37 unique topic tags catalogued with frequency counts

**From Phase 4 Plan 1 (Annotation Foundation):**
- JSONB for selector column - allows evolving selector strategy without migrations
- ON DELETE SET NULL for module_id - highlights persist without module tag
- ON DELETE CASCADE for paragraph FKs - annotations removed if paragraph deleted
- 32-char prefix/suffix for TextQuoteSelector (SELECTOR_CONTEXT_LENGTH constant)
- W3C RangeSelector with refinedBy array for fallback anchoring strategies

**From Phase 4 Plan 2 (Annotation CRUD Operations):**
- Inline annotation count query in modules/actions.ts to avoid circular imports
- getAnnotationsForParagraphs uses OR filter for viewport queries
- Module joins in annotation queries use modules(id, name, color) subset

**From Phase 4 Plan 3 (Selection UI):**
- containerRef pattern to scope selection detection to transcript reader
- Automatic word boundary snapping via snapToWordBoundaries (no user config)
- Virtual reference element pattern for Floating UI positioning over selections
- Amber/yellow theme for highlight button to match highlighting concept

**From Phase 4 Plan 4 (Highlight Rendering):**
- Three-way text rendering conditional: search > annotation highlights > plain text
- data-annotation-id attribute on mark elements for click delegation
- Module colors use 35% opacity for text readability
- Untagged highlights use gray-200 (#e5e7eb) background

**From Phase 4 Plan 5 (Annotation Popover and Sidebar):**
- Popover anchors to clicked mark element via refs.setReference
- Delete confirmation inline in popover (not separate dialog)
- Sidebar uses amber accent to highlight visible annotations
- Toggle button positioned fixed right-4 top-24 with count badge
- scrollToAnnotation utility uses data-annotation-id selector
- useVisibleAnnotations uses IntersectionObserver with 100ms delay for DOM readiness

**From Phase 4 Plan 6 (Full Integration):**
- Callback ref pattern shares container element between virtualizer and selection detection
- SSR annotation fetch in page component eliminates flash of empty state
- refreshAnnotations callback pattern for coordinating mutations across components
- Sidebar width transition via CSS transition-all duration-200

**From Phase 5 Plan 1 (Module Traces Foundation):**
- INNER JOIN with transcripts filters orphaned annotations (deleted transcripts)
- LEFT JOIN with modules supports untagged highlights (module_id can be null)
- ORDER BY in view (t.date ASC NULLS LAST) for chronological sorting with consistent null handling
- Regular view (not materialized) sufficient for 1000-row scale with existing indexes
- View-based query abstraction pattern for complex joins
- Server-side only query functions in lib/queries/ for data fetching

**From Phase 5 Plan 2 (Module Trace Page UI):**
- Server Component + Client Component composition for data fetching and interactivity
- useTransition for non-blocking list filtering (better than debouncing)
- Module color applied as 35% opacity background for text readability
- Expandable context deferred to future enhancement (v1 shows highlighted text only)
- Dynamic routes with Promise<params> for Next.js 15 async params pattern

**From Phase 5 Plan 3 (Navigation Entry Points):**
- Simple dropdown implementation without Floating UI dependency for module switcher
- Client-side count aggregation for passage counts (efficient for expected data scale)
- Non-link ModuleCard with action links (Edit + View traces) instead of single clickable card
- Backdrop pattern for dropdowns: fixed inset-0 z-10 layer with click-to-close
- Parallel data fetching in modules page: modules + annotations together

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

1. **Guided lecture exploration - choose your own adventure** (planning) — Branching, curated reading experience where newcomers start with entry-point lectures and "double-click" into deeper topics across the corpus

### Known Issues (Non-blocking)

**Corpus/Scraper Issues (fix in future re-scrape):**
- [ ] "Man and Woman at the End of History" paragraph 134 is abnormally long (paragraph breaks not detected)
- [ ] Speaker labels concatenated ("Terence McKennaRalph Abraham") in some multi-speaker transcripts
- [ ] Some transcripts missing timestamps even when source has them

**UI Polish (defer to later):**
- [ ] Reading area padding may need adjustment (currently px-8 py-8)
- [ ] Timestamp gutter shows when no timestamps exist (unnecessary left padding)
- [ ] Annotation sidebar toggle button placement not ideal

**Security (address in Phase 5):**
- [ ] RLS disabled on all tables (transcripts, transcript_paragraphs, modules, annotations)
- [ ] Need to enable RLS and add permissive policies for personal tool access

*These issues are logged but not blocking Phase 3 completion or Phase 4 start.*

### Blockers/Concerns

**Phase 3 (Reading Interface):**
- ✅ Virtualization implemented with TanStack Virtual
- Performance testing with longest transcript still needed

**Phase 4 (Annotation Engine):** ✓ COMPLETE
- ✅ Custom Selection API with tight virtualization integration
- ✅ Hybrid selector implementation (paragraph ID + text quote + offset)
- ✅ Annotation CRUD Server Actions
- ✅ Selection UI (useTextSelection hook, SelectionToolbar)
- ✅ Highlight rendering (HighlightRenderer, ParagraphView)
- ✅ Popover and sidebar (HighlightPopover, AnnotationSidebar)
- ✅ Full integration (VirtualizedReader, TranscriptReader, page)
- ✅ Human verification passed (bugs fixed during verification)

**Phase 5 (Analysis Views):** IN PROGRESS
- ✅ 05-01: module_traces view and TypeScript foundation created
- ✅ 05-02: module trace page UI with useTransition filtering
- ✅ 05-03: navigation entry points (ModuleSwitcher, passage counts on cards)
- ⚠️ Manual migration required: 006_create_module_traces_view.sql must be applied via Supabase dashboard
- Query performance profiling deferred until trace pages query with real data
- Expandable context deferred (v1 shows highlighted text only)

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed 05-03-PLAN.md (Navigation Entry Points)

**Current state:**
- Phase 5 plans 1-3 complete (3/4 plans complete)
- Module trace page at /analysis/modules/[id] with ModuleSwitcher dropdown
- Module cards show passage counts and "View traces" links
- Complete navigation flow: Modules → Trace → Different Trace
- TypeScript compilation verified

**Next steps:**
1. Apply migration 006_create_module_traces_view.sql via Supabase dashboard (REQUIRED for trace pages to work)
2. Continue Phase 5: Plan 05-04 (if exists) or move to Phase 6
