# Feature Landscape: Qualitative Text Analysis / Transcript Annotation

**Domain:** Qualitative text analysis and transcript annotation tools
**Researched:** 2026-02-04
**Confidence:** MEDIUM (based on WebSearch verification across multiple current tools)

## Executive Summary

Qualitative text analysis tools in 2026 have evolved around three core patterns: **highlighting/tagging** (Taguette, basic annotation), **hierarchical coding** (NVivo, Atlas.ti, QualCoder), and **AI-assisted analysis** (Dovetail, modern QDA tools). For a McKenna corpus analysis tool, the distinguishing factor is **domain specificity** - pre-defined "modules" taxonomy rather than emergent codes, single-passage tagging for speed, and corpus-wide pattern tracing.

**Key insight:** Most tools are built for *generative* qualitative research (interviews, focus groups) where codes emerge through analysis. McKenna's corpus needs *applicative* analysis - applying a stable taxonomy of known themes across many texts.

## Table Stakes

Features users expect from ANY qualitative text annotation tool. Missing these = tool feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Text highlighting/selection** | Core interaction pattern across all QDA tools | Low | Standard browser selection API, straightforward |
| **Create and apply tags/codes** | Fundamental to coding workflow | Low | CRUD operations on tag entities |
| **View tagged passages** | Users need to see what they've coded | Low | Filter/query interface for coded segments |
| **Tag definitions/descriptions** | Codebook component - researchers need reference | Low | Simple metadata on tag entities |
| **Import text documents** | Users have existing transcripts to analyze | Medium | Format support (txt, docx, PDF) - start with txt/md |
| **Basic search within documents** | Navigate large texts, find specific passages | Low | Browser find-in-page or simple text search |
| **Export tagged passages** | Share findings, create reports | Medium | Generate output files with quotes organized by tag |
| **Visual distinction of tags** | Quickly identify different codes in text | Low | Color-coding or label display on highlights |
| **Document navigation** | Move between transcripts in corpus | Low | List/sidebar navigation |
| **Tag management interface** | Add, edit, delete, organize tags | Low | Standard CRUD UI |

**Source confidence:** HIGH - These features appear consistently across [Taguette](https://www.taguette.org/), [QualCoder](https://guides.temple.edu/qda/qualcoder), [Dovetail](https://www.softwareadvice.com/product/345899-Dovetail/), [NVivo](https://lumivero.com/products/nvivo/), and [Atlas.ti](https://atlasti.com/).

## Differentiators

Features that set this tool apart for McKenna corpus analysis. Not expected, but highly valuable for the specific use case.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Pre-defined module taxonomy** | Speeds tagging vs emergent coding - user applies known themes, not discovering new ones | Low | Model is simpler than hierarchical codes, but UX must support adding modules during analysis |
| **One module per passage (v1)** | Simplifies decision-making, avoids analysis paralysis when tagging | Low | Constraint reduces cognitive load compared to multi-code options |
| **Module frequency dashboard** | See which ideas appear most across corpus | Low | Count aggregation, simple visualization |
| **Module co-occurrence patterns** | Discover which ideas McKenna combines frequently | Medium | Requires relationship tracking between modules across passages/documents |
| **Temporal pattern view** | See how module usage evolves across lectures by date | Medium | Leverage transcript metadata (dates), visualize trends |
| **Module tracing mode** | "Show me all passages for this module across all lectures" - corpus-wide view | Medium | Inverse navigation: tag → passages (vs document → tags) |
| **Linear reading mode** | Read one lecture, tag as you go - optimized for flow state | Low | UI mode emphasizing single-document focus |
| **Metadata-rich corpus navigation** | Filter/sort by date, location, topic tags (leverage existing metadata) | Medium | Depends on metadata structure in source transcripts |
| **LLM pre-tagging suggestions** | AI suggests modules for passage, user accepts/rejects | High | Requires LLM integration, prompt engineering, feedback loop |
| **Module growing with use** | Simple model (name + description) that user expands during analysis | Low | Designed for iterative taxonomy refinement |
| **Passage context view** | See surrounding text when reviewing tagged passages | Low | Display N sentences before/after in module trace view |
| **Cross-lecture module comparison** | Compare how McKenna discusses same module in different contexts | Medium | Group passages by module + additional metadata dimensions |

**McKenna-specific rationale:**
- Traditional QDA tools optimize for *discovering* themes through coding. This tool optimizes for *applying* a known taxonomy at speed.
- Most tools assume multi-code passages. McKenna corpus benefits from forced choice (one module) for clarity and momentum.
- Corpus-scale pattern discovery (frequency, co-occurrence, temporal) matters more than single-document analysis depth.

**Source confidence:** MEDIUM - Feature differentiation informed by understanding McKenna project goals vs. typical qualitative research workflows documented in [Atlas.ti guides](https://atlasti.com/guides/qualitative-research-guide-part-2/data-coding), [Delve codebook guide](https://delvetool.com/blog/codebook), and [EduCoder patterns](https://arxiv.org/html/2507.05385v1).

## Anti-Features

Features to explicitly NOT build for v1. Common in QDA tools but wrong for this use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Hierarchical code trees** | Modules are flat taxonomy, not nested categories - complexity adds no value | Keep module list flat with search/filter |
| **Multiple codes per passage** | Slows tagging, creates ambiguity in pattern analysis | Enforce one module per passage in v1 |
| **Emergent coding workflows** | McKenna's themes are pre-known, not discovered through coding | Pre-populate module taxonomy, allow additions |
| **Team collaboration features** | Single-user tool (personal research) | Defer multi-user until validated need |
| **Rich text formatting in passages** | Transcripts are plain text, formatting adds complexity | Keep passages as plain text with metadata |
| **Video/audio coding** | Corpus is text transcripts, not multimedia | Text-only for v1 (timestamps are metadata) |
| **Advanced querying (Boolean, proximity)** | Premature optimization - simple search sufficient for v1 | Basic text search + module filtering |
| **Inter-rater reliability (IRR) features** | Single researcher, no need for agreement metrics | Skip IRR calculations entirely |
| **Memos and theoretical notes** | Academic feature, not needed for personal analysis | User can keep separate notes file |
| **Complex export formats (SPSS, R)** | No quantitative analysis integration needed | Simple CSV/JSON + markdown report export |

**Rationale:** These features add complexity without addressing core use case. Traditional academic QDA tools ([NVivo](https://lumivero.com/products/nvivo/), [QualCoder](https://guides.temple.edu/qda/qualcoder)) include them because they serve diverse research methodologies. McKenna tool succeeds by being opinionated and focused.

**Source confidence:** HIGH - Features identified from comprehensive tool reviews: [Dovetail](https://www.looppanel.com/blog/dovetail-user-research), [NVivo](https://libguides.library.kent.edu/statconsulting/NVivo), [QualCoder capabilities](https://github.com/ccbogel/QualCoder), [EduCoder](https://arxiv.org/abs/2507.05385).

## Feature Dependencies

Understanding build order and relationships:

```
Core foundation:
- Document import → Document viewing → Text selection → Tag creation → Tag application

Module taxonomy:
- Tag creation → Tag management → Module definition expansion

Analysis views (depend on tagged data):
- Tag application → Module frequency dashboard
- Tag application → Module tracing mode
- Tag application + metadata → Temporal patterns
- Tag application + metadata → Cross-lecture comparison

Advanced (optional for v1):
- Tag application → Module co-occurrence
- Tag application + LLM → AI pre-tagging suggestions
```

**Critical path for MVP:**
1. Document import + viewing
2. Text selection + highlighting
3. Module creation + management
4. Module application (tagging)
5. Module tracing (view all passages for a module)
6. Module frequency dashboard

Everything else can come post-MVP.

## MVP Recommendation

For MVP, prioritize these features:

### Core Tagging (Must Have)
1. **Import transcripts** (txt/md format to start)
2. **Linear reading mode** (view one lecture at a time)
3. **Text selection + highlighting**
4. **Module CRUD** (create, edit, delete modules with name + description)
5. **Apply one module per passage**
6. **Visual distinction** (color or label per module)

### Core Analysis (Must Have)
7. **Module tracing mode** (view all passages tagged with a module across corpus)
8. **Module frequency dashboard** (simple counts)
9. **Document navigation** (list of lectures with metadata filters)

### Baseline UX (Must Have)
10. **Basic search** within current document
11. **Export tagged passages** (markdown format organized by module)

### Defer to Post-MVP:
- **LLM pre-tagging** (complex, validate core workflow first)
- **Module co-occurrence** (analytics feature, not core loop)
- **Temporal patterns** (nice-to-have visualization)
- **Advanced metadata filtering** (start with simple sort/filter)
- **PDF/docx import** (start with text files)
- **Rich passage context controls** (show fixed N sentences for v1)

**MVP validation criteria:**
- Can user read a lecture and tag passages with modules at flow-state speed?
- Can user trace a module across the corpus and see all relevant passages?
- Can user see which modules are most prevalent?

If yes to all three, MVP succeeds. Everything else is enhancement.

## Complexity Assessment

| Feature Category | Overall Complexity | Reasoning |
|------------------|-------------------|-----------|
| Core tagging | Low-Medium | Standard CRUD + text selection APIs, well-understood patterns |
| Module management | Low | Simple data model (name, description, color/label) |
| Analysis views | Medium | Requires data aggregation, but straightforward queries |
| LLM integration | High | External API, prompt engineering, UI for accept/reject flow |
| Metadata integration | Medium | Depends on transcript metadata structure consistency |

**Biggest risks:**
1. **Text selection/highlighting UX** - Must feel smooth and fast, not clunky
2. **Performance with large corpus** - 90 transcripts, 1.3M words - need efficient data structure
3. **Module taxonomy evolution** - UX for adding modules mid-analysis without disrupting flow

## Research Gaps and Open Questions

**LOW confidence areas (need validation):**
1. **Optimal text selection UX patterns** - Research focused on features, not specific interaction design for speed
2. **Performance benchmarks** - No data on how tools handle 1.3M word corpus
3. **EduCoder full feature set** - [Paper abstract](https://arxiv.org/abs/2507.05385) describes high-level patterns but not full implementation details

**Questions for prototyping phase:**
1. What's the fastest interaction for "select passage, assign module, continue reading"?
2. Should module tracing show passages in chronological order (by lecture date) or by relevance?
3. How should user add new modules without breaking reading flow?

## Sources

**High confidence (official documentation):**
- [Taguette features](https://www.taguette.org/) - Open source annotation tool
- [Atlas.ti qualitative coding guide](https://atlasti.com/guides/qualitative-research-guide-part-2/data-coding)
- [NVivo product overview](https://lumivero.com/products/nvivo/)
- [QualCoder GitHub](https://github.com/ccbogel/QualCoder) and [capabilities guide](https://guides.temple.edu/qda/qualcoder)

**Medium confidence (verified web search, multiple sources):**
- [Dovetail software reviews](https://www.softwareadvice.com/product/345899-Dovetail/) and [feature overview](https://www.looppanel.com/blog/dovetail-user-research)
- [Qualitative coding best practices](https://getthematic.com/insights/coding-qualitative-data)
- [Codebook management in qualitative research](https://atlasti.com/research-hub/codebook-qualitative-research)
- [Top qualitative data analysis tools 2026](https://thecxlead.com/tools/best-qualitative-data-analysis-software/)

**LOW confidence (single source, needs validation):**
- [EduCoder annotation patterns](https://arxiv.org/html/2507.05385v1) - Relevant but academic prototype, not production tool
- [Inter-rater reliability in annotation](https://www.cambridge.org/core/journals/proceedings-of-the-design-society-design-conference/article/investigating-interrater-reliability-of-qualitative-text-annotations-in-machine-learning-datasets/0ADA7BB033C7D65A208D3E2F9A6DA340) - Academic context

**Community/UX patterns:**
- [Text highlighting UX best practices](https://blog.tubikstudio.com/user-experience-tips-ux-writing/)
- [Web app UI/UX 2026 best practices](https://cygnis.co/blog/web-app-ui-ux-best-practices-2025/)
- [Content tagging for UX](https://heymarvin.com/resources/content-tagging)
