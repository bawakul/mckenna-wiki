# Requirements: McKenna Lecture Analysis Tool

**Defined:** 2026-02-04
**Core Value:** The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Corpus Ingestion

- [ ] **CORP-01**: Scrape ~90 transcripts from organism.earth with full metadata (title, date, location, speakers, duration, word count, topic tags, referenced authors)
- [ ] **CORP-02**: Store transcripts as structured paragraphs with timestamps and speaker identification
- [ ] **CORP-03**: Index transcripts for full-text search across the entire corpus
- [ ] **CORP-04**: Store content hashes per transcript for change detection on re-scrape
- [ ] **CORP-05**: Corpus stored as separate reusable dataset (own repo, importable by app)

### Reading Interface

- [ ] **READ-01**: Display transcript in clean reading view with paragraph structure, timestamps, and speaker labels
- [ ] **READ-02**: Browse, filter, and sort transcript list by date, title, and topic tags
- [ ] **READ-03**: Smooth scrolling on transcripts up to 87K words via virtualization
- [ ] **READ-04**: Search within current transcript to find specific text

### Annotation

- [ ] **ANNO-01**: Select and highlight passages in transcript text
- [ ] **ANNO-02**: Highlights exist independently — module tag is optional and can be added later
- [ ] **ANNO-03**: Assign at most one module per highlight
- [ ] **ANNO-04**: Highlights anchored robustly so they survive minor text changes in transcripts
- [ ] **ANNO-05**: Display annotation list sidebar showing all highlights in current transcript

### Module Management

- [ ] **MODL-01**: Create, edit, and delete modules with name, description, and color
- [ ] **MODL-02**: Pre-seed taxonomy with ~8 known modules on first setup
- [ ] **MODL-03**: Quick-select modules during reading via keyboard shortcuts or fast buttons

### Analysis

- [ ] **ANLY-01**: Module tracing view — browse all passages tagged with a specific module across all lectures, sorted chronologically

### Export

- [ ] **EXPO-01**: Export tagged passages as markdown or CSV, organized by module

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analysis Views

- **ANLY-02**: Module frequency dashboard showing which modules appear most across the corpus
- **ANLY-03**: Timeline view showing module presence by lecture date
- **ANLY-04**: Passage context display — surrounding paragraphs when viewing tagged passage in trace view
- **ANLY-05**: Module co-occurrence analytics — which modules appear together frequently

### LLM Integration

- **LLM-01**: LLM suggests module tags for passages, user accepts/rejects/refines
- **LLM-02**: Batch pre-tagging across multiple transcripts with quality metrics tracking
- **LLM-03**: Ground truth calibration — validate LLM accuracy against manually tagged passages

### Advanced Features

- **ADV-01**: Advanced metadata filtering and faceted search across corpus
- **ADV-02**: Multiple modules per passage (upgrade from one-per-passage constraint)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Hierarchical code trees | Modules are flat taxonomy — nesting adds complexity without value for this use case |
| Multi-user collaboration | Single-user personal research tool |
| Audio/video coding | Text-only analysis; transcripts are the primary material |
| Advanced Boolean/proximity search | Simple search sufficient for v1 |
| Inter-rater reliability features | Single researcher, no agreement metrics needed |
| Rich text formatting in passages | Transcripts are plain text with metadata |
| Mobile-optimized annotation | Desktop-first research tool |
| Ingestion from sources beyond organism.earth | 90 transcripts / 1.3M words is sufficient to start |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORP-01 | — | Pending |
| CORP-02 | — | Pending |
| CORP-03 | — | Pending |
| CORP-04 | — | Pending |
| CORP-05 | — | Pending |
| READ-01 | — | Pending |
| READ-02 | — | Pending |
| READ-03 | — | Pending |
| READ-04 | — | Pending |
| ANNO-01 | — | Pending |
| ANNO-02 | — | Pending |
| ANNO-03 | — | Pending |
| ANNO-04 | — | Pending |
| ANNO-05 | — | Pending |
| MODL-01 | — | Pending |
| MODL-02 | — | Pending |
| MODL-03 | — | Pending |
| ANLY-01 | — | Pending |
| EXPO-01 | — | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 (pending roadmap creation)

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after initial definition*
