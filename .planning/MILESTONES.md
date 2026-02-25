# Milestones

## v1.0 MVP (Shipped: 2026-02-25)

**Phases completed:** 8 phases (1, 1.1, 2, 3, 4, 5, 6, 7), 35 plans
**Timeline:** 21 days (2026-02-04 → 2026-02-25)
**Codebase:** 7,214 LOC TypeScript, 183 files, 161 commits
**Git range:** 92f2700..c697102

**Delivered:** A personal web app for qualitative analysis of Terence McKenna's lectures — scrape, read, highlight, tag with thematic modules, trace patterns across corpus, and export.

**Key accomplishments:**
1. Scraped 92 McKenna transcripts (1.36M words) from organism.earth with full metadata and full-text search
2. Built thematic module taxonomy with CRUD operations and floating selector for quick tagging during reading
3. Clean transcript reader with TanStack Virtual virtualization, in-transcript search, and reading position memory
4. Text selection, highlighting, and module tagging with W3C-compliant selectors and robust paragraph anchoring
5. Module tracing across entire corpus — browse all passages tagged with a module, sorted chronologically
6. Markdown and CSV export (single module and bulk) with download UI
7. Dark mode, RLS security, multi-paragraph highlights, highlight offset fix, audience transcript parser recovery

**Known Gaps:**
- MODL-02 (pre-seed ~8 modules): Intentionally deferred — modules created organically during reading instead of upfront seeding
- RLS migration SQL ready but requires manual application via Supabase dashboard
- Database re-seeding with updated audience transcript parser deferred (annotations exported as backup)

**Archives:**
- `milestones/v1.0-ROADMAP.md`
- `milestones/v1.0-REQUIREMENTS.md`

---

