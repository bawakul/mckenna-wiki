# McKenna Lecture Analysis Tool

## What This Is

A personal web app for qualitative analysis of Terence McKenna's lectures. Scrape transcripts from organism.earth, read through them in a clean interface with virtualized scrolling, highlight passages, tag them with recurring thematic "modules" (core ideas McKenna remixes across lectures), trace module patterns across the corpus chronologically, and export tagged passages as markdown or CSV. The tool is personal; the insights and analysis are published publicly.

## Core Value

**The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus.** The read-tag-pattern loop is the atomic unit of value — everything else supports it.

## Requirements

### Validated

- ✓ Scrape and store ~90 transcripts from organism.earth with full metadata — v1.0 (92 transcripts, 1.36M words)
- ✓ Read transcripts in a clean web interface with paragraph-level navigation — v1.0
- ✓ Create and manage a module taxonomy (name + description + color) — v1.0
- ✓ Highlight/select passages and assign a single module tag per passage — v1.0
- ✓ Store annotations linked to specific text ranges within transcripts (W3C selectors) — v1.0
- ✓ Module tracing view — browse all passages tagged with a module across all lectures, sorted chronologically — v1.0
- ✓ Export tagged passages as markdown or CSV, organized by module — v1.0
- ✓ Smooth scrolling on transcripts up to 87K words via TanStack Virtual — v1.0
- ✓ In-transcript search with reading position memory — v1.0
- ✓ Dark mode with system/manual toggle — v1.0
- ✓ Multi-paragraph highlight support — v1.0

### Active

- [ ] LLM-assisted pre-tagging: suggest module tags for passages that the user accepts/rejects/refines
- [ ] Module frequency dashboard showing which modules appear most across the corpus
- [ ] Timeline view showing module presence by lecture date
- [ ] Passage context display — surrounding paragraphs when viewing tagged passage in trace view
- [ ] Module co-occurrence analytics — which modules appear together frequently
- [ ] Full-text corpus search exposed in UI (DB function exists, not surfaced)
- [ ] Lecture favorites/bookmarks for quick access
- [ ] Guided lecture exploration — curated branching reading paths for newcomers

### Out of Scope

- Multi-module tagging per passage — keep it one module per passage for clarity
- Sub-module hierarchy or structured module relationships — start simple, add structure when patterns demand it
- Public-facing tool (anyone browsing the annotated corpus) — personal tool, public insights
- Audio playback integration — text-only analysis
- Ingestion from sources beyond organism.earth — 90 transcripts is sufficient to start
- Real-time collaboration or multi-user — single-user tool
- Mobile-optimized interface — desktop-first research tool
- Evolution tracking (how a module's expression changes over time) — after enough data is tagged

## Context

**Shipped v1.0** on 2026-02-25 with 7,214 LOC TypeScript.
**Tech stack:** Next.js 15, React 19, Supabase, TanStack Virtual, Floating UI, Tailwind CSS.
**Corpus:** 92 transcripts, 10,734 paragraphs, 1,357,234 words from organism.earth.
**Features:** Transcript list with search/filter, virtualized reader, text selection and highlighting, module tagging with floating selector, annotation sidebar, module tracing across corpus, markdown/CSV export, dark mode, multi-paragraph highlights.

**Known debt:**
- RLS migration SQL ready but requires manual application via Supabase dashboard
- Database re-seeding needed for audience transcript parser fix (77/92 transcripts affected, annotations exported as backup)
- Some parser edge cases: concatenated speaker labels, missing timestamps, abnormally long paragraphs

## Constraints

- **Tech stack**: Next.js + React frontend, Supabase backend — user preference
- **Single user**: No auth system, personal tool
- **Data source**: Organism.earth only — verify scraping terms before expanding
- **Desktop-first**: Annotation workflow optimized for mouse/keyboard

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One module per passage | Keeps data model and UI simple; multi-tagging adds complexity without clear v1 value | ✓ Good — clean UX, no confusion |
| Simple module model (name + description) | Let patterns emerge from use before imposing structure | ✓ Good — color added organically |
| Personal tool, public insights | Avoids redistribution issues with transcripts | ✓ Good — no auth complexity |
| Organism.earth only for v1 | 90 transcripts / 1.3M words is sufficient corpus | ✓ Good — 92 transcripts delivered |
| LLM as convenience, not discovery | User is the domain expert | — Deferred to v2 |
| Next.js + Supabase | User's preferred stack; good fit for text-heavy app | ✓ Good — fast development |
| W3C selectors for annotations | Robust anchoring via paragraph ID + text quote + offset | ✓ Good — survives text changes |
| TanStack Virtual for long transcripts | 87K word transcripts need virtualization | ✓ Good — smooth scrolling |
| Floating UI for module selector | Positioned near selection, keyboard-navigable | ✓ Good — fast tagging flow |
| CSS variables for dark mode | Theme-aware without JS re-renders | ✓ Good — clean implementation |
| Module pre-seeding deferred | Organic creation during reading preferred | ✓ Good — emerged naturally |
| Permissive RLS (anon policies) | Personal tool doesn't need auth complexity | ✓ Good — security without overhead |

---
*Last updated: 2026-02-25 after v1.0 milestone*
