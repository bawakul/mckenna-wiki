---
created: 2026-02-25T09:12:45.412Z
title: Re-seed database with updated corpus parser
area: database
files:
  - scripts/scrape/parser.ts
  - scripts/scrape/scraper.ts
  - scripts/scrape/spot-check.ts
---

## Problem

The corpus scraper parser was missing `section.talk-secondary` content — audience Q&A, interviewer questions, and multi-speaker dialogue were silently dropped during scraping. Parser fix committed in Phase 07 Plan 02 (commit `ad80cf8`).

Spot-check of 8 transcripts found **all 8** had missing secondary content. Some are significant:
- "The Evolutionary Mind" — 187 missing paragraphs (Sheldrake, Abraham)
- "Man and Woman at the End of History" — 137 missing paragraphs (Eisler, Loye, Audience)
- "Trialogues Metamorphosis" — 34 missing paragraphs (Abraham, Sheldrake)

77 of 92 transcripts in the corpus are monologue-only in stored JSON and likely affected.

## Solution

1. Re-scrape all 92 transcripts: `npx tsx scripts/scrape/scraper.ts --output corpus/transcripts`
2. Re-seed database with updated corpus JSON files
3. **WARNING:** Re-seeding CASCADE deletes `transcript_paragraphs` → deletes `annotations` on affected transcripts
4. Export annotations before re-seeding (markdown/CSV export already done 2026-02-25)
5. After re-seed, annotations would need to be re-anchored via TextQuoteSelector `exact` text match if restoration is desired
