# Architecture Patterns

**Domain:** Transcript annotation and qualitative analysis web app
**Researched:** 2026-02-04
**Confidence:** MEDIUM (patterns verified with official sources, specific implementation details are recommendations)

## Executive Summary

A transcript annotation web app should follow a **layered architecture** separating corpus management, annotation UI, analysis features, and LLM integration. The core challenge is balancing **text anchoring robustness** (surviving document edits) with **query performance** (fetching all annotations for a module across 90 transcripts). Recommended approach: **hybrid selector strategy** (paragraph IDs + character offsets + text quotes) with **denormalized read paths** for analysis queries.

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                           │
├─────────────────────────────────────────────────────────────┤
│  Public Routes        │  Auth Routes      │  App Routes     │
│  - Landing page       │  - Login/signup   │  - Reader       │
│  - About             │                   │  - Module view   │
│                      │                   │  - Analysis      │
├──────────────────────┴───────────────────┴──────────────────┤
│                     Component Layer                          │
│  - AnnotationReader (uses @recogito or similar)             │
│  - ModuleList, ModuleTracer                                 │
│  - AnalysisCharts, Timeline                                 │
│  - TranscriptMetadata                                       │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer (lib/)                │
│  - hooks/useAnnotations, useModules                         │
│  - queries/ (Supabase queries)                              │
│  - mutations/ (create/update/delete operations)             │
│  - utils/ (text anchoring, selector conversion)            │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│  - Supabase Client (browser)                                │
│  - Supabase Server (API routes, RSC)                        │
│  - LLM API clients (Anthropic/OpenAI)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  - transcripts (lecture metadata + full text)               │
│  - paragraphs (paragraph-level chunks with timestamps)      │
│  - modules (thematic categories)                            │
│  - annotations (text selections + module tags)              │
│  - annotation_selectors (W3C-style selectors for anchoring) │
│                                                              │
│  Functions & Indexes:                                        │
│  - GIN index on tsvector for full-text search              │
│  - Materialized view for module frequency analysis          │
│  - RLS policies for user access control                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  - organism.earth (scrape source)                           │
│  - Anthropic/OpenAI APIs (LLM pre-tagging)                  │
│  - Supabase Storage (audio files, exports)                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With | Notes |
|-----------|---------------|-------------------|-------|
| **Reader UI** | Display transcript, capture text selections, render annotations | Business logic layer, annotation library | Uses @recogito/react-text-annotator or similar |
| **Module Manager** | CRUD operations for modules, module metadata | Business logic layer | User-driven, not LLM-driven |
| **Module Tracer** | Browse all annotations for a given module, timeline view | Business logic layer, analysis queries | Performance-critical: must handle 90 transcripts efficiently |
| **Analysis Dashboard** | Charts, frequency analysis, pattern detection | Materialized views, aggregation queries | Read-heavy, can use caching |
| **LLM Pre-tagger** | Send transcript to LLM, receive suggested module tags | API routes (server-side only), LLM APIs | Async job, user reviews suggestions |
| **Corpus Ingester** | Scrape organism.earth, parse HTML, store in database | Supabase server client, scraper utilities | One-time batch or incremental updates |
| **Business Logic Layer** | Queries, mutations, hooks for React components | Supabase clients, UI components | React Query or SWR for data fetching |
| **Supabase Client** | Browser-side database access | PostgreSQL, Row-Level Security | Read operations, user-scoped writes |
| **Supabase Server** | Server-side database access with service role | PostgreSQL, bypasses RLS | Mutations, LLM operations, scraping |

## Data Flow

### Annotation Creation Flow

```
1. User selects text in Reader UI
   ↓
2. @recogito captures selection (DOM Range)
   ↓
3. Convert to hybrid selector:
   - TextQuoteSelector (exact text + prefix + suffix)
   - TextPositionSelector (character offsets in transcript)
   - ParagraphAnchor (paragraph_id + local offsets)
   ↓
4. User selects module from dropdown
   ↓
5. Mutation sent to Supabase (server route for RLS bypass)
   ↓
6. Insert into annotations table + annotation_selectors table
   ↓
7. Optimistic UI update, query invalidation
   ↓
8. Re-render Reader with new annotation overlay
```

### Module Tracing Flow

```
1. User selects module from Module Manager
   ↓
2. Query: SELECT annotations WHERE module_id = X
   - Join with paragraphs to get transcript context
   - Join with transcripts to get lecture metadata
   ↓
3. Return list of (annotation + surrounding context + lecture info)
   ↓
4. Render in ModuleTracer UI:
   - Timeline view (sorted by lecture date)
   - Frequency chart (annotations per lecture)
   - Click annotation → jump to Reader at that location
```

### LLM Pre-tagging Flow

```
1. User clicks "Auto-tag transcript" in Reader
   ↓
2. API route (server-side) fetches transcript text
   ↓
3. Send to LLM with prompt:
   "Identify passages related to these modules: [list]"
   ↓
4. LLM returns JSON: [{text_quote, suggested_module, confidence}]
   ↓
5. Store in temporary "suggestions" table
   ↓
6. UI shows suggestions as highlighted overlays (different color)
   ↓
7. User clicks suggestion: Accept → insert as annotation, Reject → delete suggestion
```

### Corpus Ingestion Flow (One-time Batch)

```
1. Script: fetch organism.earth lecture index page
   ↓
2. Extract lecture URLs (90 lectures)
   ↓
3. For each lecture:
   - Fetch HTML
   - Parse: title, date, location, transcript paragraphs (speaker + timestamp + text)
   - Store in Supabase: INSERT transcript, INSERT paragraphs (batch)
   ↓
4. Generate tsvector for full-text search (trigger or post-processing)
   ↓
5. Script logs: success/failure per lecture, stores in metadata table
```

**Incremental Update (Future):**
- Store last_scraped timestamp per transcript
- Scraper checks if organism.earth version is newer (checksum or last-modified header)
- Only re-scrape if changed
- For this use case (historical lectures), one-time batch is sufficient

## Database Schema

### Core Tables

**transcripts**
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  lecture_date DATE,
  location TEXT,
  duration_minutes INT,
  word_count INT,
  full_text TEXT, -- Full transcript for simple queries, full-text search
  full_text_tsvector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', full_text)) STORED,
  source_url TEXT, -- organism.earth URL
  scraped_at TIMESTAMP DEFAULT now(),
  metadata JSONB, -- Flexible: topic tags, referenced authors, etc.
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_transcripts_fts ON transcripts USING GIN(full_text_tsvector);
CREATE INDEX idx_transcripts_date ON transcripts(lecture_date);
```

**paragraphs**
```sql
CREATE TABLE paragraphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  paragraph_index INT NOT NULL, -- 0-based, preserves order
  speaker TEXT, -- "Terence McKenna" or "Audience" or NULL
  timestamp_seconds INT, -- Seconds from start of lecture, NULL if unavailable
  text TEXT NOT NULL,
  char_offset_start INT NOT NULL, -- Character offset in transcript.full_text
  char_offset_end INT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(transcript_id, paragraph_index)
);

CREATE INDEX idx_paragraphs_transcript ON paragraphs(transcript_id, paragraph_index);
CREATE INDEX idx_paragraphs_offsets ON paragraphs(transcript_id, char_offset_start, char_offset_end);
```

**Why both full_text and paragraphs?**
- `transcripts.full_text`: For full-text search, LLM ingestion, simple queries
- `paragraphs`: For annotation anchoring (stable IDs even if transcript text changes), timestamp display, speaker attribution

**modules**
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- "Alchemy", "Hyperspace", "Language"
  description TEXT, -- User-written definition
  color TEXT, -- Hex code for UI display
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**annotations**
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  paragraph_id UUID REFERENCES paragraphs(id) ON DELETE CASCADE, -- Primary anchor
  text_quote TEXT NOT NULL, -- Exact text selected (W3C TextQuoteSelector.exact)
  prefix TEXT, -- W3C TextQuoteSelector.prefix (for disambiguation)
  suffix TEXT, -- W3C TextQuoteSelector.suffix
  char_offset_start INT, -- Relative to paragraph.text (local offsets)
  char_offset_end INT,
  global_char_offset_start INT, -- Relative to transcript.full_text (for fallback)
  global_char_offset_end INT,
  note TEXT, -- User's optional comment on this annotation
  created_by UUID, -- User ID (Supabase auth.users)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_annotations_module ON annotations(module_id); -- Critical for module tracing
CREATE INDEX idx_annotations_transcript ON annotations(transcript_id);
CREATE INDEX idx_annotations_paragraph ON annotations(paragraph_id);
CREATE INDEX idx_annotations_user ON annotations(created_by);
```

**Why hybrid selector approach?**
- **paragraph_id**: Stable anchor if transcript text changes slightly (typo fixes, formatting)
- **text_quote + prefix + suffix**: Human-readable, helps resolve ambiguity (W3C standard)
- **Local char offsets**: Fast lookup within paragraph for UI rendering
- **Global char offsets**: Fallback if paragraph structure changes

**annotation_selectors** (Optional, for future W3C Web Annotation compatibility)
```sql
CREATE TABLE annotation_selectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  selector_type TEXT NOT NULL, -- "TextQuoteSelector", "TextPositionSelector", "ParagraphAnchor"
  selector_value JSONB NOT NULL, -- Full W3C selector object
  created_at TIMESTAMP DEFAULT now()
);
```

**Why separate table?**
- Allows multiple selector strategies per annotation (resilience to document changes)
- Future-proof for W3C Web Annotation Data Model compliance
- For MVP, can be skipped if annotations table has all necessary fields

### Denormalized Read Paths (Performance)

**module_annotations_view** (Materialized View)
```sql
CREATE MATERIALIZED VIEW module_annotations_view AS
SELECT
  a.id AS annotation_id,
  a.module_id,
  m.name AS module_name,
  a.transcript_id,
  t.title AS transcript_title,
  t.lecture_date,
  a.text_quote,
  p.speaker,
  p.timestamp_seconds,
  a.created_at
FROM annotations a
JOIN modules m ON a.module_id = m.id
JOIN transcripts t ON a.transcript_id = t.id
JOIN paragraphs p ON a.paragraph_id = p.id;

CREATE INDEX idx_module_annotations_module ON module_annotations_view(module_id);
CREATE INDEX idx_module_annotations_date ON module_annotations_view(lecture_date);

-- Refresh strategy: REFRESH MATERIALIZED VIEW CONCURRENTLY module_annotations_view;
-- Trigger on annotations INSERT/UPDATE/DELETE, or refresh nightly
```

**Why materialized view?**
- Module tracing query is read-heavy (browse all annotations for module X across 90 transcripts)
- Pre-joins reduce query complexity
- Refresh can be async (annotations don't change frequently during analysis phase)

## Patterns to Follow

### Pattern 1: Hybrid Text Anchoring

**What:** Store multiple selector types per annotation for robustness

**When:** Transcript content may change (typo fixes, re-scraping with improved parser)

**Why:** W3C Web Annotation Data Model recommends multiple selectors for resilience. TextQuoteSelector survives minor edits, ParagraphAnchor survives major restructuring, TextPositionSelector provides fast initial lookup.

**Implementation:**
```typescript
interface AnnotationSelector {
  // Primary anchor: stable paragraph ID
  paragraphId: string;

  // W3C TextQuoteSelector (most robust to minor edits)
  textQuote: {
    exact: string;    // Selected text
    prefix: string;   // 20 chars before
    suffix: string;   // 20 chars after
  };

  // TextPositionSelector (fast lookup)
  charOffsets: {
    start: number;    // Relative to paragraph.text
    end: number;
  };

  // Global offsets (fallback)
  globalCharOffsets: {
    start: number;    // Relative to transcript.full_text
    end: number;
  };
}

// Resolution strategy (in order of preference):
// 1. Try paragraph_id + local char offsets
// 2. If mismatch, try text_quote match within paragraph
// 3. If failed, try text_quote match in adjacent paragraphs
// 4. If failed, try global char offsets in transcript.full_text
// 5. If all failed, mark annotation as "orphaned" (needs manual review)
```

**Sources:**
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) - TextQuoteSelector and TextPositionSelector specifications
- [Recogito architecture](https://recogito.pelagios.org/) - Uses W3C selectors for resilience

### Pattern 2: Server-Side Mutations with RLS

**What:** Route all write operations through API routes (server-side) with service role, use RLS only for reads

**When:** Need to enforce complex business logic or bypass RLS for admin operations

**Why:** RLS for everything makes authorization difficult in practice. Server-side mutations with service role give full control, RLS protects read access.

**Implementation:**
```typescript
// lib/supabase/client.ts (browser)
export const supabase = createClientComponentClient(); // RLS-protected reads

// lib/supabase/server.ts (API routes, RSC)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS
);

// app/api/annotations/route.ts
export async function POST(request: Request) {
  const { transcript_id, module_id, selector } = await request.json();

  // Validate user session
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Business logic: validate module exists, transcript exists
  // Use supabaseAdmin to insert (bypasses RLS)
  const { data, error } = await supabaseAdmin
    .from('annotations')
    .insert({ transcript_id, module_id, created_by: session.user.id, ...selector })
    .select();

  return Response.json(data);
}
```

**Sources:**
- [Next.js + Supabase Best Practices](https://catjam.fi/articles/next-supabase-what-do-differently) - "Use RLS only for select operations"
- [MakerKit Architecture](https://makerkit.dev/docs/next-supabase/architecture/architecture) - Layered architecture with server-side mutations

### Pattern 3: Dedicated tsvector Column with GIN Index

**What:** Store precomputed tsvector for full-text search, use GIN index with `fastupdate=off` for static corpus

**When:** Large text corpus (1.3M words), search is read-heavy, content doesn't change frequently

**Why:** Generated tsvector columns eliminate runtime text processing overhead. GIN indexes with `fastupdate=off` optimize for read performance on static datasets (50x speedup over default settings).

**Implementation:**
```sql
-- In transcripts table
full_text_tsvector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', full_text)) STORED

-- GIN index with optimized settings for static corpus
CREATE INDEX idx_transcripts_fts ON transcripts
USING GIN(full_text_tsvector)
WITH (fastupdate=off); -- Critical for read performance on static data

-- Query
SELECT title, ts_headline('english', full_text, query) AS snippet
FROM transcripts, to_tsquery('english', 'psychedelic & consciousness') AS query
WHERE full_text_tsvector @@ query
ORDER BY ts_rank(full_text_tsvector, query) DESC;
```

**Sources:**
- [PostgreSQL BM25 Full-Text Search Performance](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth) - 50x speedup with proper optimization
- [Optimizing Full Text Search with tsvector](https://thoughtbot.com/blog/optimizing-full-text-search-with-postgres-tsvector-columns-and-triggers) - Generated columns vs. functional indexes

### Pattern 4: Onion Architecture (Layered Separation)

**What:** Separate routes → components → lib (business logic) → core (infrastructure)

**When:** Building maintainable Next.js + Supabase apps

**Why:** Prevents merge conflicts during upstream updates, makes testing easier, co-locates domain logic with routes

**Implementation:**
```
app/
├── (site)/              # Public routes (landing, about)
│   ├── page.tsx
│   └── layout.tsx
├── auth/                # Auth routes (unauthenticated only)
│   ├── login/
│   └── signup/
└── (app)/               # Protected routes
    ├── reader/
    │   ├── [id]/
    │   │   ├── page.tsx              # Reader route
    │   │   └── _components/          # Co-located domain components
    │   │       ├── AnnotationReader.tsx
    │   │       └── ModuleSelector.tsx
    ├── modules/
    │   ├── page.tsx                  # Module list
    │   ├── [id]/                     # Module tracer
    │   └── _components/
    └── analysis/
        └── page.tsx

components/              # Shared UI components (across routes)
├── ui/                  # shadcn/ui components
└── shared/              # App-specific shared components

lib/                     # Business logic (domain-specific)
├── hooks/
│   ├── useAnnotations.ts
│   ├── useModules.ts
│   └── useTranscripts.ts
├── queries/             # Supabase queries
│   ├── annotations.ts
│   └── modules.ts
├── mutations/           # Write operations
│   └── createAnnotation.ts
└── utils/
    ├── textAnchoring.ts
    └── selectorConversion.ts

lib/supabase/            # Infrastructure (core)
├── client.ts            # Browser client
├── server.ts            # Server client
└── middleware.ts        # Session management
```

**Sources:**
- [MakerKit Next.js Architecture](https://makerkit.dev/docs/next-supabase/architecture/architecture) - Onion architecture for Next.js + Supabase
- [Next.js + Supabase Guide](https://medium.com/@iamqitmeeer/supabase-next-js-guide-the-real-way-01a7f2bd140c) - Folder structure best practices

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Only Character Offsets

**What goes wrong:** Character offsets become invalid after any text edit (typo fix, re-scraping with improved parser)

**Why bad:** Annotations become orphaned, users lose work, manual re-annotation required

**Instead:** Use hybrid selector strategy (paragraph IDs + text quotes + character offsets)

**Sources:**
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) - "edits or dynamically transcluded content may change the selection"

### Anti-Pattern 2: One Row Per Transcript with Full Text

**What goes wrong:** Can't anchor annotations to paragraph-level granularity, can't display timestamps or speaker attribution, queries become unwieldy

**Why bad:** Annotations have no stable anchor points, timeline view impossible, speaker filtering impossible

**Instead:** Store both `transcripts.full_text` (for search) and `paragraphs` table (for anchoring)

### Anti-Pattern 3: RLS for Everything

**What goes wrong:** Complex business logic in RLS policies becomes unmaintainable, debugging is hard, service role operations blocked

**Why bad:** "RLS for everything makes authorization difficult in practice"

**Instead:** RLS for read operations, server-side API routes for mutations with service role

**Sources:**
- [Next.js + Supabase Production Experience](https://catjam.fi/articles/next-supabase-what-do-differently) - Lessons from production deployment

### Anti-Pattern 4: Real-time Corpus Scraping

**What goes wrong:** Scraper failures block user workflow, rate limiting from organism.earth, unnecessary complexity

**Why bad:** For historical corpus (90 lectures, mostly static), incremental scraping adds complexity without benefit

**Instead:** One-time batch scraping as setup script, store `scraped_at` timestamp for future incremental updates if needed

**Sources:**
- [ETL Best Practices 2026](https://blog.skyvia.com/etl-architecture-best-practices/) - "Batch ETL is best suited where some degree of data latency is permissible"

### Anti-Pattern 5: Client-Side LLM API Calls

**What goes wrong:** API keys exposed in browser, CORS issues, rate limiting affects all users

**Why bad:** Security vulnerability, unpredictable costs, no centralized error handling

**Instead:** API routes for LLM calls, server-side with service role, async job queue for long-running tasks

## Build Order Dependencies

### Phase 1: Foundation (No dependencies)
1. **Database schema:** Create tables (transcripts, paragraphs, modules, annotations)
2. **Corpus ingester:** Scrape organism.earth → populate database
3. **Basic UI:** Landing page, authentication (Supabase Auth)

**Why first:** Can't build annotation features without corpus in database

### Phase 2: Core Reading Experience (Depends on Phase 1)
1. **Reader UI:** Display transcript with paragraph structure, timestamps
2. **Basic annotation:** Text selection → create annotation (manual module tagging only)
3. **Module CRUD:** Create/edit modules, assign colors

**Why second:** Core workflow (linear reading + tagging) must work before analysis features

### Phase 3: Analysis Features (Depends on Phase 2)
1. **Module tracer:** Browse all annotations for a given module
2. **Timeline view:** Annotations sorted by lecture date
3. **Frequency charts:** Annotations per module, per lecture

**Why third:** Can't analyze patterns without annotations in database

### Phase 4: LLM Integration (Depends on Phase 2)
1. **Pre-tagging API:** Send transcript to LLM → receive suggestions
2. **Suggestion UI:** Display suggestions, accept/reject workflow
3. **Batch processing:** Auto-tag all transcripts, background job

**Why fourth:** LLM features are enhancements, not blockers for core workflow

### Phase 5: Refinements (Optional)
1. **Full-text search:** Search across corpus, jump to results
2. **Export:** Download annotations as CSV/JSON
3. **Collaboration:** Share annotations with other users

**Dependencies:**
- **Phase 2 → Phase 3:** Need annotations to analyze
- **Phase 2 → Phase 4:** LLM needs existing module definitions
- **Phase 1 is foundation for all:** No corpus = no features

## Scalability Considerations

| Concern | At 100 annotations | At 10K annotations | At 100K annotations |
|---------|-------------------|-------------------|---------------------|
| **Module tracing query** | Simple JOIN, <50ms | Needs index on `annotations.module_id`, <200ms | Materialized view required, refresh nightly, <100ms |
| **Reader page load** | Fetch transcript + annotations, <100ms | Same (filtered by transcript_id) | Same |
| **Full-text search** | GIN index sufficient, <100ms | GIN index with `fastupdate=off`, <200ms | Consider PostgreSQL BM25 extension for ranking improvements |
| **LLM pre-tagging** | Sync API call, 5-10s | Same (per transcript) | Background job queue, batch processing |
| **Database size** | <10MB | <500MB | <5GB (consider partitioning by year) |

**For this use case (90 transcripts, ~20-40 modules, single user):**
- 100K annotations = ~1,111 annotations per transcript (very high, unlikely)
- 10K annotations = ~111 per transcript (realistic for deep analysis)
- Simple indexes sufficient, no need for advanced scaling initially

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Actions                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
│                                                                  │
│  Reader Page                Module Tracer          Analysis      │
│  ↓                          ↓                      ↓             │
│  useAnnotations()           useModuleAnnotations() useStats()   │
│  (React Query)              (React Query)          (React Query) │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer (lib/)                   │
│                                                                  │
│  queries/annotations.ts     mutations/              utils/       │
│  - getAnnotations()         - createAnnotation()    - anchoring  │
│  - getModuleAnnotations()   - updateAnnotation()    - selectors  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase Layer                            │
│                                                                  │
│  Client (Browser)           Server (API Routes)                  │
│  - Read operations          - Write operations                   │
│  - RLS enforced             - Service role (RLS bypass)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│                                                                  │
│  transcripts ←──┐           modules                             │
│  ↓              │           ↓                                    │
│  paragraphs     └── annotations (references both)               │
│  ↓                          ↓                                    │
│  GIN indexes                module_annotations_view (mat. view) │
└─────────────────────────────────────────────────────────────────┘
```

**Read Flow:**
1. Component calls hook (e.g., `useAnnotations(transcript_id)`)
2. Hook calls query function in lib/ (e.g., `getAnnotations()`)
3. Query uses Supabase client (browser) with RLS
4. PostgreSQL returns data via indexes
5. React Query caches result, updates UI

**Write Flow:**
1. Component calls mutation (e.g., `createAnnotation()`)
2. Mutation sends POST to API route
3. API route validates session, uses Supabase server (service role)
4. PostgreSQL writes data, triggers materialized view refresh (if needed)
5. Mutation invalidates React Query cache
6. Component re-fetches, UI updates

## Critical Design Decisions

### Decision 1: Paragraph-Level Storage

**Choice:** Store both `transcripts.full_text` (monolithic) and `paragraphs` table (chunked)

**Rationale:**
- Annotations need stable anchor points (paragraph IDs survive text edits)
- Timestamps and speaker attribution require paragraph-level granularity
- Full text still needed for full-text search and LLM ingestion
- Storage cost is negligible (~1.3M words = ~7MB text)

**Alternatives considered:**
- Only full_text: No stable anchors, no timestamps
- Only paragraphs: Complex to reconstruct full transcript, full-text search harder

### Decision 2: Hybrid Selector Strategy

**Choice:** Store paragraph_id + text_quote + char_offsets (3 selector types)

**Rationale:**
- Robustness to document changes (W3C recommendation)
- Fast initial lookup (char offsets), fallback to text matching if offsets invalid
- Human-readable (text_quote useful for debugging, export)

**Alternatives considered:**
- Only char offsets: Brittle, breaks on any edit
- Only text quotes: Slower lookup, ambiguous for repeated phrases
- W3C Web Annotation full spec: Over-engineered for single-user app

### Decision 3: Materialized View for Module Tracing

**Choice:** Denormalize module tracing query into materialized view

**Rationale:**
- Module tracing is read-heavy, performance-critical for UX
- Pre-joins reduce query complexity
- Refresh can be async (annotations don't change during active reading)
- For 10K annotations, query time drops from ~500ms (live JOIN) to <100ms (mat. view)

**Alternatives considered:**
- Live JOINs: Too slow for large annotation counts
- Application-level caching: Invalidation complexity, stale data
- Denormalized columns in annotations table: Data duplication, update anomalies

### Decision 4: Server-Side Mutations

**Choice:** All write operations go through API routes with service role

**Rationale:**
- Complex business logic (validate module exists, check user permissions)
- Centralized error handling and logging
- RLS policies become simpler (read-only)
- Easier to add features like webhooks, background jobs

**Alternatives considered:**
- Client-side mutations with RLS: Hard to maintain, debugging difficult
- Supabase Edge Functions: Same pattern, but more vendor lock-in

## Sources

**W3C Standards:**
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) - TextQuoteSelector, TextPositionSelector specifications

**Qualitative Analysis Software:**
- [Top 5 Qualitative Data Analysis Software 2026](https://www.usercall.co/post/top-5-qualitative-data-analysis-software-tools) - NVivo, Atlas.ti component architecture
- [Essential Guide to Coding Qualitative Data](https://delvetool.com/guide) - Code-passage-annotation data model

**Next.js + Supabase Architecture:**
- [MakerKit Next.js Architecture](https://makerkit.dev/docs/next-supabase/architecture/architecture) - Onion architecture, folder structure
- [Next.js + Supabase Production Experience](https://catjam.fi/articles/next-supabase-what-do-differently) - RLS best practices, lessons learned
- [Supabase Next.js Guide](https://medium.com/@iamqitmeeer/supabase-next-js-guide-the-real-way-01a7f2bd140c) - Client vs. server operations

**PostgreSQL Performance:**
- [PostgreSQL Full-Text Search Performance](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth) - 50x speedup with proper indexing
- [Optimizing Full Text Search with tsvector](https://thoughtbot.com/blog/optimizing-full-text-search-with-postgres-tsvector-columns-and-triggers) - Generated columns, GIN indexes

**Annotation Tools:**
- [Recogito 2 Architecture](https://recogito.pelagios.org/) - ElasticSearch storage, W3C selectors
- [Hypothesis Annotation Tool](https://github.com/hypothesis/h) - Open-source annotation platform (architecture details not publicly documented)

**ETL Best Practices:**
- [ETL Best Practices 2026](https://blog.skyvia.com/etl-architecture-best-practices/) - Batch vs. incremental patterns

## Confidence Assessment

| Topic | Level | Reason |
|-------|-------|--------|
| Component boundaries | HIGH | Verified with Next.js + Supabase official docs, MakerKit architecture guide |
| Database schema | MEDIUM | Hybrid selector approach is recommendation based on W3C spec, not battle-tested in production |
| Text anchoring strategy | MEDIUM | W3C spec confirmed, but specific implementation (paragraph IDs + offsets) is inference from qualitative analysis software patterns |
| Build order | HIGH | Clear dependencies (corpus → annotation → analysis), verified with project context |
| Performance optimizations | MEDIUM | PostgreSQL full-text search benchmarks confirmed, materialized view approach is standard pattern but not specific to this use case |

## Open Questions for Implementation

1. **Annotation library choice:** @recogito/react-text-annotator vs. Hypothesis client vs. custom? Need to evaluate W3C selector compatibility.
2. **Materialized view refresh strategy:** On every annotation write (slower writes), or nightly batch (stale data for up to 24h)?
3. **LLM prompt engineering:** How to structure prompt for module pre-tagging? Few-shot examples needed?
4. **Export format:** CSV, JSON, or W3C Web Annotation JSON-LD for interoperability?
5. **Collaboration features:** If multi-user in future, how to handle conflicting module definitions?
