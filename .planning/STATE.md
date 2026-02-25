# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus
**Current focus:** Phase 7 - Polish & Fixes (in progress)

## Current Position

Phase: 7 of 7 (Polish & Fixes)
Plan: 3 of 8 in phase 7 (completed)
Status: In progress
Last activity: 2026-02-25 — Completed 07-03-PLAN.md

Progress: [████████████████████████████████] Phase 1: 100% | Phase 1.1: 100% | Phase 2: 100% | Phase 3: 100% | Phase 4: 100% | Phase 5: 100% | Phase 6: 100% | Phase 7: 13%

## Performance Metrics

**Velocity:**
- Total plans completed: 26
- Average duration: 3.4 min
- Total execution time: ~1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-corpus-foundation | 4 | 25 min | 6.25 min |
| 01.1-corpus-data-fixes | 2 | 19 min | 9.5 min |
| 02-module-system | 4 | 10 min | 2.5 min |
| 03-reading-interface | 2 | 3 min | 1.5 min |
| 04-annotation-engine | 7 | 29 min | 4.1 min |
| 05-analysis-views | 4 | 8 min | 2.0 min |
| 06-export | 2 | 7 min | 3.5 min |
| 07-polish-fixes | 1 | 1 min | 1.0 min |

**Recent Trend:**
- Last plan: 07-01 (1 min) — RLS migration + highlight offset fix
- Previous: 06-02 (2 min), 06-01 (5 min), 05-04 (2 min)

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

**From Phase 5 Plan 4 (Human Verification):**
- Human verification confirms core analysis value proposition delivered
- Module tracing performance acceptable for current data scale
- Migration 006_create_module_traces_view.sql applied via Supabase dashboard
- All verification checks passed: entry, content, search, navigation, performance

**From Phase 6 Plan 1 (Export Infrastructure):**
- N/A placeholder for timestamps in exports (not stored in selector or module_traces view)
- Blockquote passages in markdown for visual distinction from regular text
- RFC 4180 CSV escaping with field quoting for commas/quotes/newlines
- Timestamp in filename (YYYY-MM-DD) for version tracking of repeated exports
- Content-Disposition with both filename and filename* for UTF-8 safety
- Route Handler pattern: parallel fetch with Promise.all, generate content, return Response with download headers
- client-zip (2.5.0) and sanitize-filename (1.6.3) for export functionality
- [Phase 07-polish-fixes]: Permissive anon policies sufficient for personal tool RLS — USING(true)/WITH CHECK(true) covers all anon client access
- [Phase 07-polish-fixes]: getOffsetInParagraph scoped to <p> element via querySelector('p') to exclude timestamp/speaker text from highlight offset calculation
- [Phase 07-polish-fixes]: Fixed positioning (top-4 right-4 z-50) for DarkModeToggle — app has no shared NavBar, adding one would be structural refactor beyond plan scope
- [Phase 07-polish-fixes]: useState(false) with useEffect sync for dark mode toggle — avoids Next.js hydration mismatch; brief wrong-icon flash acceptable
- [Phase 07-polish-fixes]: CSS variables --highlight-opacity (0.35 light / 0.5 dark) and --untagged-highlight added as infrastructure for Plan 04 HighlightRenderer dark mode update

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

1. **[HIGH] Full-text corpus search** — Search actual transcript content (not just metadata). DB function `search_corpus` exists but not exposed in UI. Returns paragraph-level results with transcript context. Could add as dedicated search page or enhance transcripts list.
2. **[HIGH] Lecture favorites** — Bookmark/favorite lectures for quick access. Needs: favorites table, toggle UI on transcript cards and reader, filtered view for favorites only.
3. **Guided lecture exploration - choose your own adventure** (planning) — Branching, curated reading experience where newcomers start with entry-point lectures and "double-click" into deeper topics across the corpus

### Known Issues (Non-blocking)

**Annotation Bugs:**
- [ ] **[HIGH] Highlight offset bug** — Selected text shifts a few characters forward when highlight is created. Likely issue in offset calculation or word boundary snapping (useTextSelection hook or selector creation).

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

**Phase 5 (Analysis Views):** ✓ COMPLETE
- ✅ 05-01: module_traces view and TypeScript foundation created
- ✅ 05-02: module trace page UI with useTransition filtering
- ✅ 05-03: navigation entry points (ModuleSwitcher, passage counts on cards)
- ✅ 05-04: human verification passed (all checks successful)
- ✅ Migration 006_create_module_traces_view.sql applied via Supabase dashboard
- Core analysis value proposition delivered: view thematic patterns across corpus
- Expandable context deferred (v1 shows highlighted text only)

**Phase 6 (Export):** ✓ COMPLETE
- ✅ 06-01: Export infrastructure (markdown/CSV API endpoints)
- ✅ 06-02: Export UI (single and bulk export buttons)
- Export utility functions: markdown (YAML + blockquotes), CSV (RFC 4180), filename sanitization
- Route Handlers: GET /api/export/markdown/[moduleId] and GET /api/export/csv/[moduleId]
- ExportButtons component on module trace pages (MD/CSV single export)
- BulkExportButton component on modules page (ZIP/CSV bulk export)
- Client-side download via URL.createObjectURL pattern
- Phase complete - all export features delivered

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 06-02-PLAN.md — Export UI

**Current state:**
- Phase 6 complete (2/2 plans)
- All 6 phases complete
- Export feature fully functional (API + UI)
- Single module exports from trace pages
- Bulk exports from modules list page
- Project v1 feature-complete

**Project Status: COMPLETE**
All planned phases delivered. Ready for production use.
