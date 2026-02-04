# McKenna Lecture Analysis Tool

## What This Is

A personal web app for qualitative analysis of Terence McKenna's lectures. Import transcripts from organism.earth, read through them, highlight passages, tag them with recurring thematic "modules" (core ideas McKenna remixes across lectures), and see patterns across the corpus over time. The tool is personal; the insights and analysis are published publicly.

## Core Value

**The ability to tag passages in McKenna transcripts with thematic modules and see how those modules appear across the corpus.** The read-tag-pattern loop is the atomic unit of value — everything else supports it.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Scrape and store ~90 transcripts from organism.earth with full metadata (timestamps, speaker ID, dates, tags)
- [ ] Read transcripts in a clean web interface with paragraph-level navigation
- [ ] Create and manage a module taxonomy (name + description, starting with ~8 known modules)
- [ ] Highlight/select passages and assign a single module tag per passage
- [ ] Store annotations linked to specific text ranges within transcripts
- [ ] View module frequency across the corpus (which modules appear in which lectures, how often)
- [ ] View patterns over time (module presence by lecture date)
- [ ] LLM-assisted pre-tagging: suggest module tags for passages that the user accepts/rejects/refines

### Out of Scope

- Multi-module tagging per passage — keep it one module per passage for v1 clarity
- Sub-module hierarchy or structured module relationships — start simple, add structure when patterns demand it
- Public-facing tool (anyone browsing the annotated corpus) — personal tool, public insights
- Audio playback integration — text-only analysis for v1
- Ingestion from sources beyond organism.earth — 90 transcripts is sufficient to start
- Real-time collaboration or multi-user — single-user tool
- Mobile-optimized interface — desktop-first research tool
- Evolution tracking (how a module's expression changes over time) — v2 after enough data is tagged

## Context

**The corpus:** Organism.earth hosts ~90 transcribed McKenna lectures totaling ~1.3M words. HTML is well-structured with paragraph-level timestamps, speaker identification, rich metadata (title, subtitle, date, location, duration, word count, topic tags, referenced authors, summary). Transcript lengths range from ~1,400 to ~87,000 words.

**The "module" concept:** McKenna works with a finite set of 20-40 core ideas (novelty theory, the archaic revival, psychedelics as catalysts, culture as operating system, etc.) that he recombines and evolves across lectures. No one has done computational or systematic analysis of this recombination. This is novel work.

**Usage patterns:** Two primary workflows — (1) linear reading: read one lecture start-to-finish, tagging as you go; (2) module tracing: pick a module and trace it across lectures chronologically. Both are first-class.

**LLM role:** Convenience, not discovery. The user is the expert analyst. LLM saves time on obvious module instances. Human-in-the-loop: LLM suggests, user accepts/rejects/refines. Research shows ~78% agreement at detailed levels, ~96% at broader theme levels, ~81% time reduction.

**Data ethics:** Organism.earth scraping terms need to be verified before building the scraper. Transcripts stored locally for personal analysis, not redistributed.

**Broader landscape:** No structured downloadable dataset of McKenna transcripts exists. Total McKenna corpus estimated at ~500 hours / ~4.5M words across organism.earth (~90 talks), AskTMK/Uutter (108), Psychedelic Salon (320 episodes), Internet Archive (500+ hours), TerenceTranscribed.com.

**Prior art studied (not forked):**
- EduCoder — closest conceptual match (web-based transcript annotation with LLM pre-annotation)
- QualCoder — best AI integration patterns (multiple LLM providers, customizable prompts)
- LLMCode — good prompting patterns for thematic coding, hallucination detection
- Taguette — UX reference for the core highlight-and-tag interaction loop

## Constraints

- **Tech stack**: Next.js + React frontend, Supabase backend (transcripts, annotations, modules) — user preference
- **Annotation library**: @recogito/react-text-annotator for text selection and range management — W3C-compliant, handles overlapping annotations
- **LLM integration**: Anthropic/OpenAI APIs via Next.js API routes
- **Data source**: Organism.earth only for v1 — verify scraping terms before building
- **Single user**: No auth system needed for v1, personal tool

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One module per passage | Keeps data model and UI simple; multi-tagging adds complexity without clear v1 value | — Pending |
| Simple module model (name + description) | Let patterns emerge from use before imposing structure | — Pending |
| Personal tool, public insights | Avoids redistribution issues with transcripts; tool serves the analyst, publications serve the audience | — Pending |
| Organism.earth only for v1 | 90 transcripts / 1.3M words is sufficient corpus; other sources add complexity without proportional value | — Pending |
| LLM as convenience, not discovery | User is the domain expert; LLM accelerates obvious tagging, doesn't replace judgment | — Pending |
| Next.js + Supabase | User's preferred stack; good fit for text-heavy app with structured data | — Pending |

---
*Last updated: 2026-02-04 after initialization*
