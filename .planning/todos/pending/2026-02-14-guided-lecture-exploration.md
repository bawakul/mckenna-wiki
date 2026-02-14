---
created: 2026-02-14T00:00
title: Guided lecture exploration - choose your own adventure
area: planning
files: []
---

## Problem

The current tool is built around modules and annotations — analyst-facing features for tagging passages. But the *end experience* for someone encountering McKenna's ideas should be different: a guided, branching exploration.

McKenna's lectures constantly reference concepts he explores more deeply in other talks. A newcomer listening to a lecture on "the three abysses" will hit a point where he invokes (e.g.) "narcotic vs. ritualistic shamanism" without enough context. Without that background, the ideas sound absurd or conspiratorial. The context exists — it's just scattered across the corpus in other lectures.

**The vision:**
1. **Entry point lectures** — 2-3 carefully chosen lectures that work as starting points for newcomers
2. **Branching exploration** — When McKenna references a concept covered more deeply elsewhere, the reader can "double-click" to branch into those other lectures/passages
3. **Choose your own adventure** — The reader follows their curiosity through the corpus, with each branch providing the context needed to understand the next layer

This is essentially a *reading guide* or *curated exploration path* built on top of the annotation/module infrastructure. The modules tag the concepts; this feature would connect them into navigable paths.

**Key insight:** This may not be the mckenna-wiki tool itself, but rather the way the tool's output gets presented — a separate presentation layer or published format.

## Solution

TBD — This is a vision/direction idea, not a concrete implementation plan yet. Some possible approaches:

- Cross-reference links between annotations that share modules (already partially exists in trace views)
- Curated "starting lecture" metadata on transcripts
- A concept graph or map showing how topics connect across lectures
- A separate "guided reading" mode distinct from the analyst annotation mode
- Could be a future phase (Phase 7+) or a separate project that consumes the wiki's data
