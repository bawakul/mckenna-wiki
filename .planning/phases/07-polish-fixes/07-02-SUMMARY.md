---
phase: 07-polish-fixes
plan: 02
subsystem: scraper
tags: [cheerio, typescript, corpus, parser, scraping]

# Dependency graph
requires:
  - phase: 01-corpus-foundation
    provides: scripts/scrape/parser.ts and corpus JSON structure
  - phase: 01.1-corpus-data-fixes
    provides: date and topic tag extraction patterns in parser
provides:
  - Updated parser that processes section.talk and section.talk-secondary in document order
  - Audience speaker label extraction from .talk-meta .talk-name elements
  - Re-scraped global-perspectives-and-psychedelic-poetics.json with audience content
  - Spot-check script and documented scope of corpus-wide impact
affects:
  - 07-03 (database re-seed decision depends on this spot-check data)
  - Any future full corpus re-scrape

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Combined cheerio selector pattern: $('section.talk, section.talk-secondary') for document-order traversal"
    - "Per-section speaker extraction from .talk-meta .talk-name before processing child paragraphs"

key-files:
  created:
    - scripts/scrape/spot-check.ts
  modified:
    - scripts/scrape/parser.ts

key-decisions:
  - "Process section.talk and section.talk-secondary with combined cheerio selector to maintain document order"
  - "Speaker falls back to authorName (Terence McKenna) when no talk-name is present in section"
  - "Skip <p class='talk-name'> elements - they are metadata, not content paragraphs"
  - "Full corpus re-scrape recommended: spot-check showed 8/8 sampled transcripts have missing audience content"
  - "Do NOT re-seed database yet - user must decide scope and review annotation preservation strategy"

patterns-established:
  - "Corpus spot-check script pattern: fetch by URL, parse with updated parser, report speaker distribution"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 07 Plan 02: Audience Transcript Recovery Summary

**Parser updated to capture section.talk-secondary audience content; global-perspectives re-scraped (57 -> 62 paragraphs); spot-check confirms issue affects all 8/8 sampled transcripts (full re-scrape needed)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-25T07:14:23Z
- **Completed:** 2026-02-25T10:13:00Z
- **Tasks:** 3 of 3 (Task 3 checkpoint resolved by user)
- **Files modified:** 2

## Accomplishments

- Parser now processes both `section.talk` and `section.talk-secondary` in document order
- Audience speaker labels correctly extracted from `.talk-meta .talk-name`
- Global Perspectives and Psychedelic Poetics re-scraped: 57 -> 62 paragraphs with Audience and McKenna labels
- Spot-check script added for sampling any transcript URL
- Scope assessment: 8/8 spot-checked transcripts have missing secondary speaker content — full corpus re-scrape is recommended

## Task Commits

Each task was committed atomically:

1. **Task 1: Update parser to process talk-secondary sections** - `ad80cf8` (feat)
2. **Task 2: Re-scrape affected transcript and spot-check corpus** - `146dadc` (feat)
3. **Task 3: Verify audience transcript recovery (checkpoint)** - Resolved by user 2026-02-25; deferred re-seeding captured as todo in `b69229a`

**Plan metadata:** `2c753bd` (docs: complete plan)

## Files Created/Modified

- `scripts/scrape/parser.ts` - Updated `parseTranscriptPage` to use `$('section.talk, section.talk-secondary')` combined selector; extracts sectionSpeaker from `.talk-meta .talk-name`; skips `<p class="talk-name">` metadata elements
- `scripts/scrape/spot-check.ts` - New script for spot-checking transcript URLs with the updated parser; reports paragraph counts, speaker labels, and audience content presence

## Decisions Made

- Combined cheerio selector `$('section.talk, section.talk-secondary')` preserves document order automatically (cheerio returns elements in DOM order)
- Speaker defaults to `authorName` when `sectionSpeaker` is null — ensures all existing monologue transcripts remain unaffected
- Skipping `<p class="talk-name">` elements prevents speaker label text from being included as paragraph content
- Full corpus re-scrape is recommended given 100% impact rate in spot-check (8/8 affected); user must decide before proceeding
- Database re-seeding deferred — existing annotations on affected transcripts could cascade-delete on re-import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scraper does not support --url flag as described in Task 2**
- **Found during:** Task 2 (re-scrape affected transcript)
- **Issue:** Plan described running `npx tsx scripts/scrape/scraper.ts --url [URL]` but `scraper.ts` only supports `--limit` and `--output`
- **Fix:** Wrote an inline scraping call using the same parser and hash utilities, producing the same JSON output format. Also created `scripts/scrape/spot-check.ts` as a reusable script for future URL-based checks
- **Files modified:** `scripts/scrape/spot-check.ts` (created)
- **Verification:** Global-perspectives transcript updated locally; paragraph count increased from 57 to 62 with audience content present
- **Committed in:** `146dadc` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking - missing --url CLI flag)
**Impact on plan:** No scope change. Inline scraping call produces identical output to what the flag would have done. Spot-check script is a useful addition.

## Issues Encountered

- Corpus directory is gitignored (correct for large binary data) — updated transcript JSON exists locally but is not committed to git
- The "concatenated speaker names" bug (e.g., "Terence McKennaRalph Abraham") in existing corpus is a separate pre-existing issue, out of scope for this plan

## Spot-Check Findings

All 8 sampled transcripts had missing secondary speaker content:

| Transcript | Secondary Paragraphs | Speakers Found |
|------------|---------------------|----------------|
| eros-and-the-eschaton | 10 | Host, Audience |
| virtual-reality-interview | 12 | Interviewer |
| man-and-woman-at-the-end-of-history | 137 | Eisler, Loye, Audience |
| new-and-old-maps-of-hyperspace | 14 | Host, Audience |
| trialogues-metamorphosis | 34 | Abraham, Sheldrake |
| shamanism-alchemy-millennium | 23 | Audience, Harrison, Abraham |
| the-evolutionary-mind | 187 | Sheldrake, Abraham |
| rap-dancing-into-the-third-millennium | 39 | Audience |

**Current corpus state:** 77 of 92 transcripts show as monologue-only; these are prime candidates for missing audience content. 15 already have multiple speakers (including some with the concatenated name bug).

**Recommendation:** Full corpus re-scrape with updated parser. User should decide on annotation preservation strategy before re-seeding.

## Checkpoint Resolution (Task 3)

**User decision (2026-02-25):**
- Parser output approved — audience paragraphs correctly recovered
- Annotations exported via bulk export UI before any re-seeding
- Re-seeding deferred to a todo item (not done during this plan)

**Todo created:** "Re-seed database with updated corpus parser" — captures CASCADE warning and annotations-exported status. See `.planning/phases/07-polish-fixes/todos/re-seed-database-with-updated-corpus-parser.md` (committed `b69229a`).

## User Setup Required

None required for this plan. Re-seeding is deferred to user's discretion via the todo item.

## Next Phase Readiness

- Parser fix is complete and committed — ready for full corpus re-scrape when user decides
- Annotations backed up (exported 2026-02-25) — re-seeding can proceed when ready
- No blocking issues for remaining Phase 7 plans

---
*Phase: 07-polish-fixes*
*Completed: 2026-02-25*
