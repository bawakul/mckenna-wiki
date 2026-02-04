# Project Research Summary

**Project:** McKenna Wiki - Transcript Annotation & Qualitative Analysis Tool
**Domain:** Qualitative text analysis and personal research tools
**Researched:** 2026-02-04
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project is a specialized qualitative text analysis tool for annotating Terence McKenna's corpus (~90 lectures, 1.3M words) with a pre-defined taxonomy of thematic "modules." Unlike traditional QDA tools designed for emergent coding in academic research, this tool optimizes for *applying* a known taxonomy at reading speed, then tracing patterns across the corpus.

The recommended approach is **Next.js 15 + Supabase + custom annotation UI** (not a full library), prioritizing corpus-wide analysis views over single-document depth. The critical architectural decision is using **hybrid text anchoring** (paragraph IDs + text quotes + character offsets) to prevent annotation orphaning when transcripts change. Performance at scale requires **virtualization** for long documents and **materialized views** for cross-transcript queries.

The highest risk is **The Tool vs. Analysis Trap**: spending months perfecting features while never actually analyzing McKenna's work. Mitigation requires time-boxing tool development (2-week MVP deadline), starting with external tools before building anything, and measuring analysis output (annotations created, themes identified) rather than technical features shipped.

## Key Findings

### Recommended Stack

The modern standard for text annotation tools centers on **Next.js 15 App Router + Supabase + TypeScript**, with a critical decision point at annotation libraries. Research shows `@recogito/react-text-annotator` has stabilized (v3.0.5+) but has limited production usage, making **custom implementation** using browser Selection API the safer choice for this single-user, domain-specific tool.

**Core technologies:**
- **Next.js 15 + React 18 + TypeScript 5**: App Router with Server Components, Server Actions eliminate API route boilerplate, industry standard for web apps in 2025
- **Supabase (PostgreSQL 15+)**: Managed Postgres with JSONB for flexible annotation storage, full-text search via tsvector/GIN indexes, cookie-based auth, Row Level Security
- **Tailwind CSS v4 + shadcn/ui**: Zero-config styling, copy-paste components (full code ownership), Radix UI primitives for accessibility
- **Zustand + TanStack Query**: Client state (UI) + server state (Supabase) — minimal boilerplate, 2025 best practice for state management
- **Recharts**: Declarative React charts for module frequency timelines, simple API, sufficient for 90-lecture corpus
- **@anthropic-ai/sdk**: Claude API for LLM pre-tagging (server-side only), official TypeScript SDK with streaming support

**Critical decision: Custom annotation implementation recommended over libraries**
- Browser Selection API is stable and well-documented
- Full control over UX (highlight colors, keyboard shortcuts, module tagging flow)
- Simpler data model (no W3C overhead) for single-user tool
- Easier to integrate with McKenna-specific "module" taxonomy workflow
- `@recogito/react-text-annotator` available as fallback if custom becomes too complex

**Database approach:**
- PostgreSQL full-text search (tsvector with GIN indexes) is MORE than sufficient for 1.3M words — no need for Elasticsearch
- JSONB columns for flexible annotation metadata
- pg_trgm extension for fuzzy/similarity search
- Generated tsvector columns with `fastupdate=off` for 50x speedup on static corpus

### Expected Features

Research across QDA tools (NVivo, Atlas.ti, QualCoder, Taguette, Dovetail) reveals clear patterns: traditional tools optimize for *discovering* themes through emergent coding, while this tool needs to optimize for *applying* a known taxonomy at speed.

**Must have (table stakes):**
- Text highlighting/selection with tag application
- Tag definitions (codebook reference)
- Document import (start with txt/md format)
- View tagged passages (filter by tag)
- Basic search within documents
- Export tagged passages (markdown/CSV)
- Visual tag distinction (color-coding)
- Document navigation across corpus
- Tag CRUD interface

**Should have (differentiators for McKenna analysis):**
- **Pre-defined module taxonomy** — speeds tagging vs emergent coding
- **One module per passage (v1)** — simplifies decisions, avoids analysis paralysis
- **Module frequency dashboard** — see which themes appear most
- **Module tracing mode** — "show all passages for this module across all lectures" (corpus-wide view)
- **Linear reading mode** — read one lecture, tag as you go (flow state optimization)
- **Temporal pattern view** — module usage evolution across lectures by date
- **Metadata-rich navigation** — filter/sort by date, location, topic tags
- **Passage context view** — surrounding text in module trace view

**Defer (v2+):**
- Hierarchical code trees (modules are flat)
- Multiple codes per passage (v1 enforces one module)
- Team collaboration features (single-user MVP)
- Video/audio coding (text-only transcripts)
- Advanced querying (Boolean, proximity operators)
- Inter-rater reliability features
- Rich text formatting
- LLM pre-tagging (validate core workflow first)
- Module co-occurrence analytics (post-MVP)

**MVP validation criteria:**
- Can user read lecture and tag passages at flow-state speed?
- Can user trace module across corpus and see all passages?
- Can user see which modules are most prevalent?

### Architecture Approach

The recommended architecture follows **layered separation** (Next.js routes → components → business logic → infrastructure) with **hybrid text anchoring** and **denormalized read paths** for performance.

**Major components:**

1. **Corpus Management Layer** — One-time scraping of organism.earth (90 lectures) into Supabase, storing both `transcripts.full_text` (for search/LLM) and normalized `paragraphs` table (for stable annotation anchoring with timestamps/speaker attribution)

2. **Annotation Engine** — Custom Selection API implementation with hybrid selectors: paragraph_id (stable anchor) + text_quote with prefix/suffix (W3C TextQuoteSelector for resilience) + character offsets (fast lookup). Handles re-anchoring when transcripts change.

3. **Module System** — Flat taxonomy (name + description + color), user-expandable during analysis, one module per passage constraint for v1, stored relationally for query performance

4. **Analysis Views** — Module tracer (inverse navigation: module → passages), frequency dashboard (counts/charts), temporal patterns (evolution over lectures), all backed by materialized views for <200ms queries at 10K+ annotations

5. **Reader UI** — Linear reading mode optimized for flow, virtualization with react-window for 87K word transcripts (longest in corpus), paragraph-level rendering with timestamp/speaker display

6. **LLM Integration (Phase 4+)** — Server-side API routes calling Claude for pre-tagging suggestions, human-in-the-loop validation workflow, batch processing with quality metrics tracking

**Data flow pattern:**
- **Reads:** Component → React Query hook → Supabase client (browser, RLS-protected) → PostgreSQL with indexes
- **Writes:** Component → mutation → API route → Supabase server (service role, bypasses RLS) → PostgreSQL → cache invalidation

**Key architectural patterns:**
- **Hybrid selector strategy** for annotation robustness (survives text edits)
- **Paragraph-level storage** for stable anchors and metadata
- **Materialized views** for cross-transcript queries (module tracing)
- **Virtualization** for long document rendering performance
- **Server-side mutations** with RLS only for reads

### Critical Pitfalls

Research across annotation tools, PostgreSQL performance studies, and web scraping best practices identifies five critical risks:

1. **The Tool vs. Analysis Trap** — Spending months building features while never analyzing transcripts. McKenna tool becomes the project instead of means to project. **Prevention:** Time-box MVP to 2 weeks, start with external tools (Hypothesis, Google Docs) for first 10 transcripts before building anything, measure analysis output (annotations created) not technical features, weekly retrospective "Did I spend more time coding or analyzing?"

2. **Orphaned Annotations (Text Range Drift)** — Hypothesis research shows ~27% of annotations become orphaned when source text changes. **Prevention:** W3C Web Annotation Data Model with redundant selectors (quote + position), version-aware schema with content hashes, robust re-anchoring algorithm (exact match → fuzzy match → mark orphaned), immutable transcript storage with edit history

3. **Long Document Rendering Performance Collapse** — Browser freezes on 87K word transcripts with hundreds of annotations (50,000+ DOM nodes). **Prevention:** Implement react-window virtualization (CRITICAL — must test with longest transcript + 100 dummy annotations in Phase 2), lazy load annotations for visible sections, optimize annotation rendering (flat `<mark>` structure not nested spans), pagination or section-based viewing

4. **LLM Hallucination in Pre-Tagging** — LLMs confidently assign plausible but factually wrong module tags. 38% of hallucinations are factual incorrectness. **Prevention:** Human-in-the-loop validation (review 20% sample, calculate error rate), use LLM for suggestion not decision (accept/reject UI), prompt engineering with specific module list (not open-ended), cross-validation across models, ground truth calibration set (50 manually coded passages), quality metrics tracking

5. **Web Scraping Fragility & Data Drift** — organism.earth changes HTML structure or fixes typos, breaking annotation anchors. **Prevention:** Scrape defensively with rate limiting (3s delays, User-Agent with contact email, respect robots.txt), store immutable versions with SHA256 checksums, detect changes before updating (HTTP HEAD requests with ETag comparison), version-aware annotation schema, local archive of all versions

**Phase-specific warnings:**
- Phase 1: Test scraping with 5-10 transcripts before scaling to 90
- Phase 2: Load longest transcript (87K words) immediately, measure render time
- Phase 2: Implement `transcript_versions` table from start, not retrofit
- Phase 3: Manual annotation only (establish ground truth before LLM)
- Phase 3: Virtualization required before real usage begins
- Phase 5: Set milestone "10 transcripts fully analyzed" before adding features

## Implications for Roadmap

Based on research, suggested phase structure prioritizes **validating analysis workflow** over technical features, with mandatory performance testing at each stage.

### Phase 0: Analysis Before Tools (PRE-BUILD VALIDATION)
**Rationale:** Highest risk is building tool instead of analyzing. Start with existing tools to validate workflow and identify real needs.
**Delivers:** 5-10 transcripts annotated using Hypothesis or Google Docs comments, documented pain points and feature needs, validated module taxonomy
**Duration:** 1-2 weeks MAX
**Success criteria:** Clear list of blockers preventing flow-state annotation with external tools
**Avoids:** Tool vs. Analysis Trap (Pitfall #1)

### Phase 1: Corpus Foundation
**Rationale:** Can't build annotation features without corpus in database. Architecture research shows paragraph-level storage is essential for stable anchoring.
**Delivers:** Database schema (transcripts, paragraphs, modules, annotations with hybrid selectors), corpus scraper for organism.earth (rate-limited, version-aware), 90 lectures in Supabase with full-text search indexed
**Addresses:** Web scraping fragility (Pitfall #5) via version tracking and checksums
**Uses:** Supabase with PostgreSQL, tsvector with GIN indexes for full-text search
**Implements:** Corpus management layer with immutable version storage
**Testing requirement:** Scrape 5-10 lectures first, validate HTML parsing reliability before scaling to 90

### Phase 2: Core Reading & Annotation (MVP)
**Rationale:** Core workflow (linear reading + tagging) must work before analysis features. Feature research shows table stakes = text selection + tag application + viewing.
**Delivers:** Reader UI with paragraph display (timestamps/speaker), custom text selection using Selection API, module CRUD (name/description/color), one module per passage tagging, basic annotation list view
**Addresses:**
- Orphaned annotations (Pitfall #2) via hybrid selector implementation
- Performance collapse (Pitfall #3) via virtualization testing
**Uses:** Custom Selection API implementation (not library), react-window for virtualization, shadcn/ui components
**Implements:** Annotation engine, reader UI, module system
**Testing requirements:**
- CRITICAL: Load longest transcript (87K words) with 100 mock annotations, measure scroll fps
- If <30fps, implement virtualization before continuing
- Test cross-paragraph text selections
- Validate annotation anchoring survives minor text edits

### Phase 3: Core Analysis Views
**Rationale:** Can't analyze patterns without viewing annotations across corpus. Architecture research shows materialized views needed for <200ms query performance.
**Delivers:** Module tracing mode (view all passages for module across lectures), module frequency dashboard (counts + simple charts with Recharts), timeline view (sorted by lecture date), passage context display (N sentences before/after)
**Addresses:** Query performance at scale via materialized views and proper indexing
**Uses:** Recharts for visualization, materialized views for denormalized reads, TanStack Query for caching
**Implements:** Analysis views layer
**Testing requirement:** Create 1000 mock annotations across 20 transcripts, measure module tracing query time (target: <200ms)

### Phase 4: LLM Pre-Tagging (OPTIONAL)
**Rationale:** Only after core workflow validated and ground truth established. Feature research shows this is differentiator but not table stakes.
**Delivers:** Server-side API route for Claude integration, suggestion UI (accept/reject/modify workflow), batch processing for multiple transcripts, quality metrics tracking (acceptance rate, human corrections)
**Addresses:** LLM hallucination (Pitfall #4) via human-in-the-loop validation and quality tracking
**Uses:** @anthropic-ai/sdk, Server Actions for API calls (never client-side), batch API for cost savings
**Implements:** LLM integration component
**Prerequisites:** At least 50 manually annotated passages as calibration set
**Testing requirement:** Run 10% of corpus through LLM, manually validate, measure hallucination rate (must be <5% before scaling)

### Phase 5: Refinements
**Rationale:** Everything else is enhancement, not blocker for core use case
**Delivers:** Advanced metadata filtering, export to CSV/JSON/Markdown, full-text search across corpus, module co-occurrence analytics, temporal pattern visualizations
**Deferred from MVP:** These were identified as "defer to v2+" in feature research

### Phase Ordering Rationale

- **Phase 0 before 1:** Prevent tool building becoming procrastination (research gap, but highest risk)
- **Phase 1 before 2:** Need corpus to annotate (clear dependency from architecture)
- **Phase 2 before 3:** Need annotations to analyze (feature research shows this is critical path)
- **Phase 3 before 4:** Need ground truth before trusting LLM (pitfall research shows validation is essential)
- **Performance testing gates progress:** Long document rendering (Phase 2), query performance (Phase 3), LLM quality (Phase 4)
- **Analysis workflow validated early:** Phases 0-2 establish that tool supports flow-state annotation, not just feature completeness

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Corpus scraping — well-documented patterns, multiple sources confirm approach
- **Phase 2:** Basic annotation UI — browser Selection API is stable, extensive documentation
- **Phase 3:** Database queries and charts — standard PostgreSQL + Recharts patterns

**Phases likely needing deeper research during planning:**
- **Phase 2 (if using library):** If custom Selection API proves too complex, research `@recogito/react-text-annotator` integration patterns — current gap is limited production usage examples
- **Phase 4 (LLM integration):** Prompt engineering for consistent module tagging across 1.3M words — gap is McKenna-specific taxonomy application, not general LLM integration
- **Phase 5 (if multi-user):** Collaboration features would need research on Supabase realtime subscriptions and conflict resolution — deferred for MVP

**Performance validation checkpoints (not research, but testing):**
- Phase 2: Longest transcript rendering with mock annotations
- Phase 3: Module tracing query with 1000+ annotations
- Phase 4: LLM hallucination rate on calibration set

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js + Supabase is 2025 standard, verified with official docs and multiple production examples. Annotation library choice (custom vs. Recogito) needs Phase 2 validation but both paths are viable. |
| Features | MEDIUM | Table stakes features verified across multiple QDA tools. McKenna-specific differentiators (module tracing, one-per-passage) are inferred from domain analysis rather than observed in production tools. |
| Architecture | MEDIUM | Layered architecture and hybrid text anchoring verified with W3C spec and production annotation tools (Hypothesis). Specific implementation (paragraph IDs + dual selectors) is recommendation based on patterns, not battle-tested in this exact configuration. |
| Pitfalls | MEDIUM-HIGH | Orphaned annotation rates (27%) from peer-reviewed Hypothesis research (HIGH). Performance patterns verified with React docs and PostgreSQL benchmarks (HIGH). Tool vs. Analysis Trap is inference from general productivity research (MEDIUM). LLM hallucination rates from recent research (MEDIUM). Web scraping best practices from multiple 2026 sources (MEDIUM). |

**Overall confidence:** MEDIUM-HIGH

Research is sufficient to begin implementation with clear direction. The stack and architecture patterns are well-established. Feature differentiation is sound but untested in production. Pitfall prevention strategies are evidence-based with some inference. No critical unknowns that would block MVP development.

### Gaps to Address

**During Phase 0 (pre-build validation):**
- **Real workflow testing:** Does one-module-per-passage constraint actually work, or is multi-tagging needed? Use external tools to discover.
- **Module taxonomy completeness:** Is pre-defined list sufficient or does emergent coding matter? Annotate 10 transcripts to validate.

**During Phase 2 (annotation UI implementation):**
- **Annotation library decision:** Custom Selection API vs. @recogito/react-text-annotator — build simple prototype of each, measure development time vs. control/flexibility tradeoff
- **Cross-paragraph selections:** Research doesn't confirm if this is required pattern for McKenna transcripts — discover during Phase 0 external tool testing
- **Overlapping highlights:** Feature research shows this is common UX challenge but not clear if McKenna analysis needs overlapping modules — validate in Phase 0

**During Phase 3 (analysis views):**
- **Module co-occurrence value:** Is discovering "which modules appear together" actually useful for McKenna analysis? Defer until after basic frequency analysis reveals patterns.
- **Temporal view design:** Research doesn't specify optimal visualization for "module evolution over lectures" — mockup options during Phase 3 planning

**During Phase 4 (LLM integration):**
- **Prompt engineering specifics:** General LLM integration patterns are clear, but McKenna-specific module taxonomy application needs experimentation — plan for iteration
- **Batch processing ROI:** Cost savings are documented (~50% discount), but time/quality tradeoff needs validation with small batch first

**Not gaps (sufficient research):**
- Stack choices: Well-documented, clear recommendations
- Database schema: Hybrid selector approach is sound
- Performance strategies: Virtualization and materialized views are proven patterns
- Web scraping approach: Conservative rate limiting is well-established

## Sources

### Primary (HIGH confidence)

**Stack & Framework:**
- [Supabase Next.js Official Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — Auth setup, client/server patterns
- [Next.js Official Documentation](https://nextjs.org/docs) — App Router, Server Components, Server Actions
- [shadcn/ui Documentation](https://ui.shadcn.com/docs) — Component installation, Radix UI integration
- [PostgreSQL Full-Text Search Official Docs](https://www.postgresql.org/docs/current/textsearch.html) — tsvector, GIN indexes

**Web Annotation Standard:**
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) — TextQuoteSelector, TextPositionSelector specifications, multiple selector recommendations

**Performance:**
- [React Official Docs - Optimizing Performance](https://legacy.reactjs.org/docs/optimizing-performance.html) — Virtualization recommendations
- [PostgreSQL Full-Text Search Performance Study](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth) — 50x speedup with proper GIN index configuration

### Secondary (MEDIUM confidence)

**QDA Tool Features:**
- [Taguette](https://www.taguette.org/), [NVivo](https://lumivero.com/products/nvivo/), [QualCoder](https://guides.temple.edu/qda/qualcoder), [Atlas.ti](https://atlasti.com/), [Dovetail](https://www.softwareadvice.com/product/345899-Dovetail/) — Feature landscape verified across multiple tools
- [Atlas.ti Qualitative Research Guide](https://atlasti.com/guides/qualitative-research-guide-part-2/data-coding) — Coding workflows and best practices

**Architecture Patterns:**
- [MakerKit Next.js Architecture](https://makerkit.dev/docs/next-supabase/architecture/architecture) — Onion architecture, folder structure for Next.js + Supabase
- [Next.js + Supabase Production Experience](https://catjam.fi/articles/next-supabase-what-do-differently) — RLS best practices, server-side mutation patterns

**Annotation Pitfalls:**
- [Quantifying Orphaned Annotations in Hypothesis (Peer-reviewed)](https://www.cs.odu.edu/~mln/pubs/tpdl-2015/tpdl-2015-annotations.pdf) — 27% orphan rate, 61% at-risk
- [Rendering Large Lists in React - LogRocket](https://blog.logrocket.com/render-large-lists-react-5-methods-examples/) — Virtualization patterns and performance benchmarks

**LLM Integration:**
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript) — Official SDK documentation
- ["My AI is Lying to Me": User-reported LLM Hallucinations - Nature Scientific Reports](https://www.nature.com/articles/s41598-025-15416-8) — 38% factual incorrectness rate in hallucinations
- [Complete LLM Pricing Comparison 2026](https://www.cloudidr.com/blog/llm-pricing-comparison-2026) — Batch API pricing and cost optimization

**Web Scraping:**
- [Rate Limiting in Web Scraping - Scrape.do](https://scrape.do/blog/web-scraping-rate-limit/) — Best practices for respectful scraping
- [Web Scraping Without Getting Blocked - ScrapingBee](https://www.scrapingbee.com/blog/web-scraping-without-getting-blocked/) — User-Agent, delays, detection avoidance

### Tertiary (LOW confidence, needs validation)

**Annotation Library:**
- [Recogito Text Annotator - GitHub](https://github.com/recogito/text-annotator-js), [@recogito/react-text-annotator - npm](https://www.npmjs.com/package/@recogito/react-text-annotator) — v3.0.5 stable but limited production usage examples

**Productivity Research:**
- [When 'More Research' Becomes Procrastination](https://twspace.substack.com/p/when-more-research-becomes-procrastination) — Tool vs. Analysis Trap is inference from general productivity patterns, not domain-specific research

**UX Patterns:**
- [Overlapping Text Annotations - CodeMirror Discussion](https://discuss.codemirror.net/t/overlapping-text-annotations/2462) — Community discussion, not definitive solution
- [Exploring the UX of Web Annotations](https://tomcritchlow.com/2019/02/12/annotations/) — Blog post with anecdotal insights

---
*Research completed: 2026-02-04*
*Ready for roadmap: yes*
