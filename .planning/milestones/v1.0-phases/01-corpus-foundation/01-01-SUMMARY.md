---
phase: 01-corpus-foundation
plan: 01
subsystem: scraping
tags: [nextjs, typescript, cheerio, axios, supabase, organism-earth, web-scraping]

# Dependency graph
requires:
  - phase: none
    provides: new project initialization
provides:
  - Next.js 16 project with TypeScript and Tailwind
  - Phase 1 dependencies installed (cheerio, axios, supabase-js, zod, p-limit, tsx)
  - Organism.earth HTML structure fully documented with working selectors
  - 105 McKenna transcript URLs discovered
  - Sample HTML files for offline development
affects: [01-02-schema-design, 01-03-scraper-build, all-corpus-foundation]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19, cheerio@1.2.0, axios@1.13.4, @supabase/supabase-js@2.95.0, zod@4.3.6, p-limit@7.3.0, tsx@4.21.0]
  patterns: [polite-scraping-3s-delays, exploratory-scripts-before-production, sample-based-structure-discovery]

key-files:
  created:
    - scripts/scrape/explore.ts: Exploratory script for HTML structure discovery
    - scripts/scrape/find-mckenna.ts: McKenna-specific document finder
    - scripts/scrape/SELECTORS.md: Complete HTML structure reference (250 lines)
    - .env.example: Environment variable template
    - package.json: Project dependencies and scripts
  modified: []

key-decisions:
  - "Use tsx for running TypeScript scripts directly (no build step needed)"
  - "Save HTML samples to gitignored directory for offline analysis"
  - "Document selectors comprehensively before building production scraper"
  - "3-second delay between requests for polite scraping"
  - "Discovered 105 McKenna transcripts available (more than 90 required)"

patterns-established:
  - "Exploratory scripting pattern: discover structure first, then build production code"
  - "Selector documentation pattern: comprehensive reference before scraper implementation"
  - "Sample-based validation: save raw HTML for offline testing"

# Metrics
duration: 9min
completed: 2026-02-05
---

# Phase 1 Plan 01: Project Initialization & HTML Exploration Summary

**Next.js 16 project initialized with 105 McKenna transcripts discovered on organism.earth, HTML structure fully documented with working selectors for metadata, paragraphs, and timestamps**

## Performance

- **Duration:** 9 minutes
- **Started:** 2026-02-05T16:58:52Z
- **Completed:** 2026-02-05T17:08:49Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments

- Next.js 16 project with TypeScript, Tailwind, and App Router initialized and building successfully
- All 6 Phase 1 dependencies installed and verified (cheerio, axios, supabase-js, zod, p-limit, tsx)
- Discovered McKenna author page with 105 transcript document URLs (exceeds 90 required for v1)
- Fully documented HTML structure with working CSS selectors for all required data fields
- 10 HTML samples saved for offline scraper development and testing
- Verified polite scraping works without blocks (3-second delays, descriptive User-Agent)

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js project with Phase 1 dependencies** - `3621bde` (chore)
2. **Task 2: Explore organism.earth HTML structure** - `25769f0` (feat)
3. **Bug fix: TypeScript error in explore script** - `33d50d0` (fix)

_Note: Bug fix was auto-applied under Rule 3 (blocking issue - build was failing)_

## Files Created/Modified

**Configuration:**
- `package.json` - Project dependencies and scrape:explore script
- `package-lock.json` - Locked dependency versions
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.mjs` - PostCSS configuration
- `.gitignore` - Updated for .env.local and scraping samples
- `.env.example` - Environment variable template (Supabase + corpus repo path)

**Source files:**
- `src/app/layout.tsx` - Next.js root layout
- `src/app/page.tsx` - Homepage
- `src/app/globals.css` - Global styles
- `public/*` - Next.js static assets

**Scraping scripts:**
- `scripts/scrape/explore.ts` - Exploratory scraping script with structure analysis (300+ lines)
- `scripts/scrape/find-mckenna.ts` - McKenna-specific document discovery (100+ lines)
- `scripts/scrape/SELECTORS.md` - Complete HTML structure reference (250 lines)
- `scripts/scrape/samples/` - 10 HTML files saved (gitignored, 1.1 MB total)

## Decisions Made

**Project structure:**
- Use `scripts/scrape/` and `scripts/seed/` directories for corpus management code (separate from Next.js app code)
- Keep scraper code in app repo (not separate corpus repo) as decided in CONTEXT.md
- Use tsx for running TypeScript scripts without build step (faster iteration)

**Scraping approach:**
- Build exploratory scripts first to discover structure before writing production scraper
- Save raw HTML samples for offline development and testing
- Document all selectors comprehensively in SELECTORS.md before building scraper
- 3-second delays between requests for polite scraping (no blocks observed)

**Environment:**
- .env.local for local secrets (gitignored)
- .env.example for template (committed)
- More specific .env ignore pattern (`.env` and `.env*.local`) to allow .env.example in git

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript error in explore script**
- **Found during:** Task 1 verification (npm run build)
- **Issue:** cheerio `.get(0)` method call caused TypeScript error, blocking build
- **Fix:** Changed from `.get(0)?.attribs` to direct array access with type guard: `firstPElement[0]` with `'attribs' in firstPElement` check
- **Files modified:** `scripts/scrape/explore.ts`
- **Verification:** `npm run build` passes successfully
- **Committed in:** `33d50d0` (separate fix commit after Task 2)

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Essential fix for build to pass. No scope creep.

## Issues Encountered

**Issue 1: create-next-app refused to initialize in directory with existing files**
- **Problem:** create-next-app detected `.planning/` directory and refused to proceed
- **Solution:** Created project in temp directory (`mckenna-wiki-temp`), then moved all files to actual project directory
- **Impact:** None - project initialized successfully with workaround

**Issue 2: node_modules corruption during copy**
- **Problem:** Copying node_modules from temp directory caused MODULE_NOT_FOUND errors
- **Solution:** Deleted node_modules and package-lock.json, ran fresh `npm install`
- **Impact:** None - dependencies reinstalled cleanly

**Issue 3: Exploratory script initially fetched index/author/topic pages instead of actual transcripts**
- **Problem:** First run found 71 URLs but most were not transcript documents
- **Solution:** Created second script (find-mckenna.ts) to specifically find McKenna author page and extract document URLs
- **Impact:** Positive - discovered 105 McKenna transcript URLs, more than 90 required

## User Setup Required

None - no external service configuration required.

Environment variables in `.env.example` are placeholders for future use in subsequent plans.

## Next Phase Readiness

**Ready for next plan (01-02: Database Schema Design):**
- ✅ Project builds successfully
- ✅ All dependencies installed
- ✅ HTML structure fully documented with working selectors
- ✅ 105 McKenna transcript URLs discovered (exceeds 90 required)
- ✅ Sample HTML files available for schema design reference
- ✅ Selectors verified for: title, metadata (location, duration, word count), author, paragraphs, timestamps

**Known structure for schema design:**
- Metadata fields: location, word count, duration, views (all optional)
- Timestamps: MM:SS or HH:MM:SS format, one per paragraph
- Paragraphs: preserve source breaks, no explicit speaker markup
- Author: "Terence McKenna" for all documents (monologue format)
- No date field in structured metadata (will need title/URL parsing)

**Blockers:** None

**Concerns:**
- Date extraction will require parsing from title or URL slug (not in structured metadata)
- Longest transcript mentioned in requirements is 87K words - should test scraper performance on large documents early
- No speaker markup observed - all content is McKenna speaking (monologue format confirmed)

---
*Phase: 01-corpus-foundation*
*Completed: 2026-02-05*
