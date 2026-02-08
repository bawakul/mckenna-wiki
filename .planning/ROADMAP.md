# Roadmap: McKenna Lecture Analysis Tool

## Overview

This roadmap delivers a personal web app for qualitative analysis of Terence McKenna's lectures. The journey starts with building the corpus foundation (scraping and storing 90 transcripts from organism.earth), then creates the core workflow (reading transcripts, creating modules, highlighting and tagging passages), and culminates with analysis views that reveal thematic patterns across the corpus.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Corpus Foundation** - Scrape and store 90 transcripts with full metadata
- [ ] **Phase 1.1: Corpus Data Fixes** - Fix missing dates and topic tags (INSERTED)
- [x] **Phase 2: Module System** - Create and manage thematic module taxonomy
- [ ] **Phase 3: Reading Interface** - Clean transcript reading with navigation and search
- [ ] **Phase 4: Annotation Engine** - Highlight passages and tag with modules
- [ ] **Phase 5: Analysis Views** - Module tracing across corpus
- [ ] **Phase 6: Export & Polish** - Export tagged passages and refinements

## Phase Details

### Phase 1: Corpus Foundation
**Goal**: 90 McKenna transcripts stored in database with searchable text and stable anchoring
**Depends on**: Nothing (first phase)
**Requirements**: CORP-01, CORP-02, CORP-03, CORP-04, CORP-05
**Success Criteria** (what must be TRUE):
  1. All 90 transcripts from organism.earth are stored in Supabase with full metadata (title, date, location, speakers, duration, word count, topic tags, referenced authors)
  2. Transcripts are structured as paragraphs with timestamps and speaker identification preserved
  3. Full-text search across entire corpus returns relevant passages in under 200ms
  4. Content hashes stored per transcript enable change detection on future re-scrapes
  5. Corpus data lives in separate repository and can be imported by app
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md -- Project setup and organism.earth HTML structure exploration
- [x] 01-02-PLAN.md -- Scraper pipeline (types, parser, orchestrator) with test scrape
- [x] 01-03-PLAN.md -- Supabase schema with full-text search and seed script
- [x] 01-04-PLAN.md -- Full scrape, corpus repo, database import, and verification

### Phase 1.1: Corpus Data Fixes (INSERTED)
**Goal**: Fix missing dates and topic tags in scraped corpus data
**Depends on**: Phase 1 (fixes issues discovered during Phase 3 UAT)
**Requirements**: CORP-01 (full metadata)
**Success Criteria** (what must be TRUE):
  1. Dates are extracted from organism.earth pages and stored in database
  2. Topic tags are extracted from organism.earth pages and stored in database
  3. Transcript list sorts chronologically by actual dates
  4. Topic tag filters appear on transcript list page
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 1.1 to break down)

**Details:**
Issues discovered during Phase 3 UAT:
- parser.ts line 108: `const date: string | null = null` — date extraction not implemented
- parser.ts line 111: `const topicTags: string[] = []` — tag extraction not implemented
- Need to investigate organism.earth HTML structure for date/tag locations
- Re-scrape and re-seed database after fixes

### Phase 2: Module System
**Goal**: Working module taxonomy for tagging passages
**Depends on**: Phase 1 (needs database schema in place)
**Requirements**: MODL-01, MODL-02, MODL-03
**Success Criteria** (what must be TRUE):
  1. User can create new modules with name, notes, and color
  2. User can edit or delete existing modules
  3. User creates the 8 seed modules manually through the UI (not DB seed)
  4. User can quickly select modules via floating selector during reading
**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md -- Database schema, Supabase server client, Module types
- [x] 02-02-PLAN.md -- Module CRUD Server Actions with validation
- [x] 02-03-PLAN.md -- Modules list/create/edit pages with delete confirmation
- [x] 02-04-PLAN.md -- Floating module selector component for reading interface

### Phase 3: Reading Interface
**Goal**: Clean, performant reading experience for transcripts up to 87K words
**Depends on**: Phase 1 (needs corpus in database)
**Requirements**: READ-01, READ-02, READ-03, READ-04
**Success Criteria** (what must be TRUE):
  1. Transcript displays in clean reading view with paragraph structure, timestamps, and speaker labels visible
  2. User can browse transcript list and filter/sort by date, title, and topic tags
  3. Longest transcript (87K words) scrolls smoothly at 30+ fps via virtualization
  4. User can search within current transcript to find specific text
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md -- Transcript list page with search and tag filtering
- [ ] 03-02-PLAN.md -- Basic transcript reading view with paragraph rendering
- [ ] 03-03-PLAN.md -- Virtualization with TanStack Virtual for large transcripts
- [ ] 03-04-PLAN.md -- In-transcript search and reading position memory

### Phase 4: Annotation Engine
**Goal**: Robust highlighting and module tagging that survives transcript changes
**Depends on**: Phase 2 (needs modules), Phase 3 (needs reading interface)
**Requirements**: ANNO-01, ANNO-02, ANNO-03, ANNO-04, ANNO-05
**Success Criteria** (what must be TRUE):
  1. User can select and highlight passages in transcript text
  2. Highlights exist independently and persist without module tags (module tag is optional, can be added later)
  3. User can assign at most one module per highlight
  4. Highlights remain anchored correctly when transcript text changes (via hybrid selectors: paragraph ID + text quote + character offset)
  5. Annotation list sidebar shows all highlights in current transcript with ability to jump to passage
**Plans**: TBD

Plans:
- [ ] 04-01: TBD during planning

### Phase 5: Analysis Views
**Goal**: Cross-corpus pattern discovery through module tracing
**Depends on**: Phase 4 (needs annotations)
**Requirements**: ANLY-01
**Success Criteria** (what must be TRUE):
  1. Module tracing view displays all passages tagged with a specific module across all lectures
  2. Passages in trace view are sorted chronologically by lecture date
  3. Trace queries return results in under 200ms even with 1000+ annotations across corpus
**Plans**: TBD

Plans:
- [ ] 05-01: TBD during planning

### Phase 6: Export & Polish
**Goal**: Export capabilities and refinements for production use
**Depends on**: Phase 5 (core workflow complete)
**Requirements**: EXPO-01
**Success Criteria** (what must be TRUE):
  1. User can export all tagged passages as markdown, organized by module
  2. User can export tagged passages as CSV with columns for module, passage text, lecture title, date, timestamp
**Plans**: TBD

Plans:
- [ ] 06-01: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Corpus Foundation | 4/4 | ✓ Complete | 2026-02-06 |
| 2. Module System | 4/4 | ✓ Complete | 2026-02-06 |
| 3. Reading Interface | 0/4 | Not started | - |
| 4. Annotation Engine | 0/TBD | Not started | - |
| 5. Analysis Views | 0/TBD | Not started | - |
| 6. Export & Polish | 0/TBD | Not started | - |
