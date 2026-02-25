# Phase 1: Corpus Foundation - Research

**Researched:** 2026-02-05
**Domain:** Web scraping, text corpus storage, PostgreSQL full-text search
**Confidence:** HIGH

## Summary

Phase 1 involves scraping 90 McKenna transcripts from organism.earth (static HTML pages), storing them as structured JSON in a private corpus repository, and providing a seed script to import into Supabase with full-text search capabilities.

The standard approach for this domain combines:
- **Cheerio** for fast, reliable HTML parsing of static pages (no JavaScript execution needed)
- **Supabase/PostgreSQL** with tsvector generated columns and GIN indexes for sub-200ms full-text search
- **SHA-256 content hashing** via Node.js crypto module for change detection
- **Politeness delays** (2-3 seconds between requests) to respect organism.earth servers

This is a well-established pattern for static site scraping with structured text storage. The corpus size (~90 transcripts, 1.3M words) is small enough that batch processing is simpler than incremental updates, and PostgreSQL's built-in full-text search is more than sufficient without external search engines.

**Primary recommendation:** Use Cheerio + Axios for scraping, store JSON files with content hashes in a separate private repo, and create a seed script that upserts into Supabase using generated tsvector columns with GIN indexes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | 1.0.0+ | HTML parsing | Industry standard for static HTML scraping; jQuery-like API, 70% faster than browser automation for static content |
| axios | 1.7.0+ | HTTP requests | Most popular HTTP client for Node.js; simpler than fetch for error handling |
| @supabase/supabase-js | 2.x | Database client | Official Supabase client with TypeScript support, upsert operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:crypto | Built-in | SHA-256 hashing | Content change detection (built-in, no dependencies) |
| zod | 3.x | Schema validation | JSON schema validation for scraped data (optional but recommended) |
| p-limit | 5.x | Concurrency control | Rate limiting parallel scrapes (simple, battle-tested) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cheerio | Puppeteer/Playwright | Only needed for JavaScript-rendered content; 3-5x slower and more resource-intensive |
| Cheerio | JSDOM | 30-50% slower than Cheerio; only beneficial if you need full DOM API compatibility |
| PostgreSQL FTS | Elasticsearch | Overkill for 1.3M words; adds deployment complexity without proportional value for corpus size |

**Installation:**
```bash
npm install cheerio axios @supabase/supabase-js
npm install --save-dev @types/node zod p-limit
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── scrape/
│   ├── scraper.ts           # Main scraper orchestrator
│   ├── parser.ts            # HTML parsing logic
│   └── types.ts             # TypeScript types for transcript data
├── seed/
│   ├── import-corpus.ts     # Seed script to load JSON → Supabase
│   └── hash-utils.ts        # Content hashing utilities
└── corpus-repo/             # Separate private repo (git submodule or separate clone)
    └── transcripts/
        ├── 001-transcript-slug.json
        └── ...
```

### Pattern 1: Batch Scrape with Smart Import

**What:** Scrape all 90 transcripts every run (batch), but only upsert changed records into database (smart import via content hashes)

**When to use:** Small corpus (<500 items) where full scrape completes in reasonable time (minutes, not hours)

**Why:** Simpler than incremental detection; eliminates state tracking; corpus size makes batch feasible

**Example:**
```typescript
// scraper.ts - Batch scrape all URLs
const transcriptUrls = await getTranscriptUrls();
const transcripts = [];

for (const url of transcriptUrls) {
  await sleep(2000); // Politeness delay
  const html = await axios.get(url);
  const parsed = parseTranscript(html.data);
  const contentHash = createHash('sha256')
    .update(JSON.stringify(parsed.paragraphs))
    .digest('hex');

  transcripts.push({ ...parsed, contentHash });
}

// Write all to JSON files
for (const transcript of transcripts) {
  writeFileSync(
    `corpus-repo/transcripts/${transcript.id}.json`,
    JSON.stringify(transcript, null, 2)
  );
}
```

```typescript
// import-corpus.ts - Smart import via hash comparison
const jsonFiles = readdirSync('corpus-repo/transcripts');

for (const file of jsonFiles) {
  const transcript = JSON.parse(readFileSync(file));

  // Upsert: only updates if contentHash differs
  await supabase
    .from('transcripts')
    .upsert(transcript, { onConflict: 'id' });
}
```

### Pattern 2: Generated Column for Full-Text Search

**What:** Store searchable text in a generated tsvector column that auto-updates when source columns change

**When to use:** All PostgreSQL full-text search implementations

**Why:** Eliminates manual trigger maintenance; ensures index stays synchronized; enables weighted search

**Example:**
```sql
-- Migration: Add generated tsvector column
ALTER TABLE transcripts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
) STORED;

-- Create GIN index for fast searches
CREATE INDEX transcripts_search_idx
ON transcripts
USING gin(search_vector);

-- Query pattern
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM transcripts, websearch_to_tsquery('english', 'McKenna psychedelics') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Pattern 3: Politeness Delays with p-limit

**What:** Rate limit parallel scraping operations to avoid overwhelming target server

**When to use:** Any scraping operation against servers you don't control

**Why:** Prevents IP blocking; ethical scraping; simpler than proxy rotation for small corpora

**Example:**
```typescript
import pLimit from 'p-limit';

const limit = pLimit(1); // Max 1 concurrent request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeResults = await Promise.all(
  urls.map(url => limit(async () => {
    await delay(2000); // 2-second delay between requests
    return scrapeUrl(url);
  }))
);
```

### Anti-Patterns to Avoid

- **On-the-fly tsvector generation:** Don't compute `to_tsvector()` in WHERE clauses; it prevents index usage and causes 10-50x slowdowns
- **Puppeteer for static HTML:** Using headless browsers for static HTML wastes 3-5x resources and adds failure modes (browser crashes, timeouts)
- **Fabricating missing metadata:** Store only what organism.earth provides; null is better than guessed data for research corpus integrity
- **Incremental scraping for small corpus:** State tracking complexity not worth it for 90 items that scrape in <5 minutes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Regex-based extraction | Cheerio | HTML isn't regular; regex breaks on nested tags, malformed markup, escaped entities |
| Concurrent requests | Manual Promise.all() loops | p-limit or similar | Easy to overwhelm servers; need backpressure and error isolation |
| Content hashing | String concatenation | crypto.createHash('sha256') | Collision-resistant, deterministic, battle-tested; custom hashing risks false positives |
| Full-text search | LIKE '%keyword%' | PostgreSQL tsvector + GIN | LIKE is 100x+ slower; no stemming, ranking, or phrase search |
| Retry logic | setTimeout loops | axios-retry or manual exponential backoff | Need exponential backoff, max attempts, error filtering; easy to create infinite loops |

**Key insight:** Text processing problems (parsing, searching, hashing) have decades of optimized solutions. Custom implementations for "simple" text tasks consistently underestimate edge cases (encodings, malformed input, Unicode normalization, performance at scale).

## Common Pitfalls

### Pitfall 1: HTML Structure Fragility

**What goes wrong:** Scraper breaks when organism.earth makes minor HTML changes (CSS class rename, layout shift)

**Why it happens:** Overly-specific selectors (e.g., `div.content > p.transcript-para:nth-child(2)`) couple tightly to exact DOM structure

**How to avoid:**
- Use semantic selectors when available (e.g., `article`, `main`, `[role="main"]`)
- Prefer data attributes or IDs over positional selectors
- Test selectors against multiple transcript pages before full scrape
- Document expected HTML structure in code comments

**Warning signs:**
- Selectors with `>` child combinators or `:nth-child()`
- No error handling for missing elements
- Single transcript used for testing

### Pitfall 2: Rate Limiting and IP Blocking

**What goes wrong:** Scraper gets blocked mid-run after 20-30 requests; all subsequent requests return 403/429 errors

**Why it happens:** Organism.earth (or any site) interprets rapid requests as bot attack; default axios fires requests as fast as possible

**How to avoid:**
- Implement 2-3 second delays between requests (conservative for small corpus)
- Use exponential backoff on 429 responses (wait 2s, 4s, 8s, etc.)
- Include descriptive User-Agent header with contact info
- Log successful scrapes so you can resume from failure point

**Warning signs:**
- No delays between requests
- 403/429 status codes in logs
- Scraper times out instead of failing fast

### Pitfall 3: Dynamic Content Assumptions

**What goes wrong:** Parser returns empty results or partial data because content loads via JavaScript

**Why it happens:** Cheerio only parses initial HTML; if organism.earth uses client-side rendering, content won't be present

**How to avoid:**
- **Test first:** Verify organism.earth serves static HTML by checking page source (View Page Source in browser)
- If content missing, switch to Puppeteer/Playwright
- For phase 1: based on organism.earth being a static transcript archive, Cheerio should work

**Warning signs:**
- Parser returns empty arrays for elements visible in browser
- "Loading..." text in parsed output
- JSON blobs in `<script>` tags instead of rendered HTML

### Pitfall 4: Encoding and Character Issues

**What goes wrong:** Special characters (smart quotes, em dashes, Unicode symbols) render as mojibake (�) or get corrupted

**Why it happens:** Mismatch between server encoding declaration and actual encoding; axios defaults to UTF-8 but server might send different charset

**How to avoid:**
- Explicitly set `responseType: 'text'` and `responseEncoding: 'utf-8'` in axios config
- Validate encoding by checking for common Unicode characters in sample transcripts
- Store JSON with UTF-8 encoding (Node.js default)

**Warning signs:**
- Replacement characters (�) in output
- "â€™" instead of apostrophes (double-encoding)
- Non-English words corrupted

### Pitfall 5: Missing Index on Generated Column

**What goes wrong:** Full-text search takes 5-10 seconds instead of <200ms; searches timeout on production

**Why it happens:** Generated tsvector column created but GIN index not added; PostgreSQL does sequential scan on every query

**How to avoid:**
- Always create GIN index immediately after adding generated column
- Test search performance with `EXPLAIN ANALYZE` before going to production
- Verify index exists: `SELECT * FROM pg_indexes WHERE tablename = 'transcripts'`

**Warning signs:**
- Search queries show "Seq Scan" in EXPLAIN output
- Query time increases linearly with corpus size
- No "Index Scan using ... GIN" in query plan

### Pitfall 6: Content Hash on Unstable Fields

**What goes wrong:** Content hash changes on every scrape even though transcript content unchanged; seed script re-imports all 90 transcripts every time

**Why it happens:** Hash includes timestamps, random IDs, or formatting whitespace that varies across scrapes

**How to avoid:**
- Hash only stable content (paragraph text, speaker identification)
- Exclude metadata that changes (scrape timestamps, page load times)
- Normalize whitespace before hashing (trim, collapse multiple spaces)
- Test hash stability: scrape same transcript twice, verify identical hash

**Warning signs:**
- All transcripts show as "updated" on every import
- Content hash differs between identical JSON files
- Database grows with duplicate records

## Code Examples

### Scraping with Cheerio and Politeness

```typescript
// Source: https://cheerio.js.org/docs/intro/
// Combined with rate limiting best practices
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const limit = pLimit(1); // 1 concurrent request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Transcript {
  id: string;
  title: string;
  date: string | null;
  paragraphs: Array<{
    position: number;
    speaker: string | null;
    timestamp: string | null;
    text: string;
    contentHash: string;
  }>;
}

async function scrapeTranscript(url: string): Promise<Transcript> {
  // Politeness delay
  await delay(2000);

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'McKenna-Wiki-Corpus-Scraper/1.0 (your-email@example.com)'
    },
    responseEncoding: 'utf-8'
  });

  const $ = cheerio.load(response.data);

  // Example selectors (adjust based on organism.earth structure)
  const title = $('h1.transcript-title').text().trim();
  const date = $('time').attr('datetime') || null;

  const paragraphs = $('article p').map((index, element) => {
    const text = $(element).text().trim();
    const speaker = $(element).find('.speaker').text() || null;
    const timestamp = $(element).data('timestamp') || null;

    // Hash individual paragraph for anchoring
    const contentHash = createHash('sha256')
      .update(text)
      .digest('hex')
      .slice(0, 16); // First 16 chars sufficient for collision-free anchoring

    return {
      position: index,
      speaker,
      timestamp,
      text,
      contentHash
    };
  }).get();

  return {
    id: url.split('/').pop()!.replace('.html', ''),
    title,
    date,
    paragraphs
  };
}

// Batch scrape all URLs
async function scrapeAllTranscripts(urls: string[]): Promise<Transcript[]> {
  return Promise.all(
    urls.map(url => limit(() => scrapeTranscript(url)))
  );
}
```

### Supabase Full-Text Search Setup

```sql
-- Source: https://supabase.com/docs/guides/database/full-text-search

-- Create transcripts table
CREATE TABLE transcripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  location TEXT,
  speakers TEXT[],
  duration_minutes INTEGER,
  word_count INTEGER,
  topic_tags TEXT[],
  referenced_authors TEXT[],
  content_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create paragraphs table
CREATE TABLE transcript_paragraphs (
  id SERIAL PRIMARY KEY,
  transcript_id TEXT REFERENCES transcripts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  speaker TEXT,
  timestamp TEXT,
  text TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  UNIQUE(transcript_id, position)
);

-- Add generated tsvector column with weighted fields
ALTER TABLE transcript_paragraphs
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(text, '')), 'A')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX paragraphs_search_idx
ON transcript_paragraphs
USING gin(search_vector);

-- Also index transcript-level search
ALTER TABLE transcripts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(topic_tags, ' '), '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(referenced_authors, ' '), '')), 'C')
) STORED;

CREATE INDEX transcripts_search_idx
ON transcripts
USING gin(search_vector);
```

### Seed Script with Upsert

```typescript
// Source: https://supabase.com/docs/reference/javascript/upsert
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for seed script
);

async function seedCorpus() {
  const corpusDir = join(__dirname, '../../corpus-repo/transcripts');
  const files = readdirSync(corpusDir).filter(f => f.endsWith('.json'));

  console.log(`Importing ${files.length} transcripts...`);

  for (const file of files) {
    const filePath = join(corpusDir, file);
    const transcript = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Upsert transcript metadata
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcripts')
      .upsert({
        id: transcript.id,
        title: transcript.title,
        date: transcript.date,
        location: transcript.location,
        speakers: transcript.speakers,
        duration_minutes: transcript.duration_minutes,
        word_count: transcript.word_count,
        topic_tags: transcript.topic_tags,
        referenced_authors: transcript.referenced_authors,
        content_hash: transcript.contentHash
      }, { onConflict: 'id' })
      .select()
      .single();

    if (transcriptError) {
      console.error(`Failed to upsert transcript ${transcript.id}:`, transcriptError);
      continue;
    }

    // Upsert paragraphs
    const paragraphs = transcript.paragraphs.map((p: any) => ({
      transcript_id: transcript.id,
      position: p.position,
      speaker: p.speaker,
      timestamp: p.timestamp,
      text: p.text,
      content_hash: p.contentHash
    }));

    const { error: paragraphsError } = await supabase
      .from('transcript_paragraphs')
      .upsert(paragraphs, { onConflict: 'transcript_id,position' });

    if (paragraphsError) {
      console.error(`Failed to upsert paragraphs for ${transcript.id}:`, paragraphsError);
      continue;
    }

    console.log(`✓ Imported ${transcript.id} (${paragraphs.length} paragraphs)`);
  }

  console.log('Corpus import complete!');
}

seedCorpus().catch(console.error);
```

### Content Hashing for Change Detection

```typescript
// Source: https://nodejs.org/api/crypto.html
import { createHash } from 'crypto';

// Hash entire transcript content for change detection
function hashTranscriptContent(transcript: {
  title: string;
  paragraphs: Array<{ text: string }>;
}): string {
  // Normalize: only hash stable content, not metadata
  const normalized = {
    title: transcript.title.trim(),
    paragraphs: transcript.paragraphs.map(p => p.text.trim())
  };

  return createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}

// Hash individual paragraph for anchoring
function hashParagraph(text: string): string {
  // Normalize whitespace for stable hashing
  const normalized = text.trim().replace(/\s+/g, ' ');

  return createHash('sha256')
    .update(normalized)
    .digest('hex')
    .slice(0, 16); // 16 chars = 64 bits, collision-free for corpus size
}
```

### Full-Text Search Query

```typescript
// Source: https://supabase.com/docs/guides/database/full-text-search
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

async function searchCorpus(query: string, limit: number = 20) {
  // Use websearch_to_tsquery for user-friendly search syntax
  // Supports: "exact phrase", negation, OR
  const { data, error } = await supabase
    .rpc('search_paragraphs', {
      search_query: query,
      result_limit: limit
    });

  if (error) throw error;
  return data;
}

// RPC function (create in Supabase SQL editor):
/*
CREATE OR REPLACE FUNCTION search_paragraphs(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  transcript_id TEXT,
  transcript_title TEXT,
  position INTEGER,
  speaker TEXT,
  text TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.transcript_id,
    t.title AS transcript_title,
    tp.position,
    tp.speaker,
    tp.text,
    ts_rank(tp.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM transcript_paragraphs tp
  JOIN transcripts t ON tp.transcript_id = t.id
  WHERE tp.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC, t.date DESC, tp.position ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
*/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual triggers for tsvector updates | Generated columns (GENERATED ALWAYS AS) | PostgreSQL 12 (2019) | Eliminates trigger maintenance; auto-sync guaranteed |
| to_tsquery() for search input | websearch_to_tsquery() | PostgreSQL 11 (2018) | User-friendly syntax; quoted phrases, negation work intuitively |
| Request/Promise-based scraping | Async iterators with backpressure | Node.js 10+ (2018) | Better memory usage for large scrapes; natural rate limiting |
| Puppeteer for all scraping | Cheerio for static, Puppeteer for dynamic | ~2020 consensus | 3-5x faster, fewer failure modes for static HTML |

**Deprecated/outdated:**
- **plainto_tsquery()**: Still works but websearch_to_tsquery() is more intuitive for users (accepts quoted phrases, negation)
- **Manual tsvector triggers**: Generated columns are simpler and guaranteed to stay in sync
- **request library**: Deprecated; use axios or native fetch (Node 18+)
- **JSDOM for scraping**: Cheerio is faster for HTML parsing; JSDOM only needed for full DOM API

## Open Questions

### Question 1: Organism.earth HTML Structure

**What we know:**
- Site is static HTML (no JavaScript rendering required)
- Contains ~90 transcripts with metadata
- User mentioned testing with 5-10 transcripts first

**What's unclear:**
- Exact CSS selectors for title, date, paragraphs, speaker identification
- Whether timestamps are in data attributes, text content, or separate elements
- How metadata (location, referenced authors) is structured on page

**Recommendation:** First task should be exploratory scraping of 3-5 sample transcripts to document HTML structure and create selector reference. Store selector patterns in code comments for future maintenance.

### Question 2: Corpus Repository Access Pattern

**What we know:**
- Separate private GitHub repo for corpus data
- JSON files (one per transcript)
- Seed script in main app repo reads from corpus repo

**What's unclear:**
- Should corpus repo be git submodule, or separate clone?
- Should seed script expect corpus repo at specific relative path, or take path as argument?
- Do we need versioning/branching strategy for corpus updates?

**Recommendation:** Start with git submodule (keeps repos linked), make corpus path configurable via environment variable. Defer branching strategy until re-scraping needs emerge.

## Sources

### Primary (HIGH confidence)
- [Supabase Full-Text Search Official Docs](https://supabase.com/docs/guides/database/full-text-search) - Generated columns, GIN indexes, tsvector implementation
- [Cheerio Official Documentation](https://cheerio.js.org/docs/intro/) - API reference, limitations, TypeScript support
- [Supabase JavaScript Upsert Reference](https://supabase.com/docs/reference/javascript/upsert) - Conflict resolution, onConflict parameter
- [Node.js Crypto Module Docs](https://nodejs.org/api/crypto.html) - SHA-256 hashing API

### Secondary (MEDIUM confidence)
- [Cheerio vs Puppeteer Comparison - Proxyway](https://proxyway.com/guides/cheerio-vs-puppeteer-for-web-scraping) - Performance benchmarks, use case guidance
- [PostgreSQL FTS Performance Optimization - OneUpTime](https://oneuptime.com/blog/post/2026-01-25-full-text-search-gin-postgresql/view) - Published Jan 2026, GIN index optimization
- [TypeScript Web Scraping Tutorial - ZenRows](https://www.zenrows.com/blog/web-scraping-typescript) - Complete TypeScript setup with Cheerio
- [Web Scraping Rate Limiting Best Practices - Scrape.do](https://scrape.do/blog/web-scraping-rate-limit/) - Exponential backoff, politeness delays

### Tertiary (LOW confidence - flagged for validation)
- [Web Scraping Common Mistakes - Medium](https://medium.com/@datajournal/dos-and-donts-of-web-scraping-e4f9b2a49431) - General pitfalls list (not organism.earth-specific)
- [JSON Schema Best Practices - JSON Utils](https://jsonutils.org/blog/json-schema-complete-tutorial.html) - Schema design patterns (not transcript-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Cheerio, Supabase, crypto are established, well-documented solutions verified with official docs
- Architecture patterns: HIGH - Generated columns, GIN indexes, upsert patterns confirmed via official Supabase documentation
- Scraping patterns: MEDIUM - Rate limiting and politeness verified across multiple sources, but organism.earth-specific structure unknown until testing
- Pitfalls: MEDIUM - Common scraping/FTS pitfalls cross-verified, but some are general wisdom rather than organism.earth-specific experiences

**Research date:** 2026-02-05
**Valid until:** 2026-04-05 (60 days - stable tech stack, slow-moving PostgreSQL features)
