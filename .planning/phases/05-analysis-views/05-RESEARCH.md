# Phase 5: Analysis Views - Research

**Researched:** 2026-02-13
**Domain:** Cross-corpus query optimization and data presentation
**Confidence:** HIGH

## Summary

This research investigates how to build a performant module tracing view that displays all passages tagged with a specific module across all lectures, sorted chronologically. The core technical challenge is **query performance at scale** — ensuring trace queries return results in under 200ms even with 1000+ annotations spanning multiple transcripts.

The standard approach uses **PostgreSQL views or materialized views** combined with strategic indexing to pre-join annotation, transcript, and module data. For implementation, there are three viable paths:

1. **Regular PostgreSQL view** - Simple, always fresh data, fast enough with proper indexes (<200ms at 1000 rows)
2. **Materialized view** - Pre-computed results, fastest reads (~0.1ms), requires refresh strategy
3. **Direct query with joins** - Maximum flexibility, relies on query planner optimization

The decision about query performance is: 1000+ annotations is not massive by PostgreSQL standards. With proper indexing (already in place from Phase 4), a regular view or even direct queries should easily meet the <200ms requirement without materialization complexity.

**Primary recommendation:** Start with a regular PostgreSQL view that joins annotations, transcripts, and modules. This provides clean API abstraction, leverages existing indexes, and avoids materialized view refresh overhead. Only consider materialization if profiling shows performance issues (unlikely with proper indexes on 1000 rows).

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Server-side rendering and routing | Already in project, server components ideal for data fetching |
| Supabase PostgREST | Built-in | Database API with automatic joins | Native to Supabase, provides type-safe database queries |
| PostgreSQL Views | Built-in | Pre-joined query abstraction | Native database feature, zero overhead, clean API |
| React 19 | 19.2.3 | Client-side interactivity | Already in project, provides useTransition for filtering |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostgreSQL Materialized Views | Built-in | Pre-computed query results | Only if profiling shows view queries exceed 200ms (unlikely) |
| pg_cron | Extension | Schedule materialized view refresh | Only needed if materialized views are used |
| React Server Components | Built-in | Zero-JS data presentation | Default for card list rendering (no interactivity needed) |
| useTransition | Built-in (React 19) | Non-blocking client filtering | For text search within trace results without UI lag |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL view | Direct JOIN queries | View provides cleaner API, easier to optimize later, better query plan caching |
| Server Components | Client-side data fetching | Server Components eliminate waterfalls, reduce bundle size, better Core Web Vitals |
| useTransition filtering | Debounced state updates | Transitions keep input responsive during heavy filtering, better UX for 1000+ items |

**Installation:**
```bash
# No new dependencies required
# All needed libraries already in project (Next.js 16, React 19, Supabase)
```

## Architecture Patterns

### Database View for Module Traces

**What:** A PostgreSQL view that pre-joins annotations with transcript metadata and module data, sorted chronologically.

**When to use:** As the primary data source for module trace queries. Supabase exposes views as queryable tables via PostgREST.

**Example:**
```sql
-- Source: PostgreSQL view patterns + Supabase best practices
-- https://www.postgresql.org/docs/current/rules-materializedviews.html
-- https://supabase.com/blog/postgresql-views

CREATE VIEW module_traces AS
SELECT
  a.id,
  a.module_id,
  a.highlighted_text,
  a.start_paragraph_id,
  a.end_paragraph_id,
  a.selector,
  a.created_at,

  -- Transcript metadata
  t.id as transcript_id,
  t.title as transcript_title,
  t.date as transcript_date,

  -- Module metadata
  m.name as module_name,
  m.color as module_color

FROM annotations a
INNER JOIN transcripts t ON a.transcript_id = t.id
LEFT JOIN modules m ON a.module_id = m.id
ORDER BY t.date ASC NULLS LAST, a.created_at ASC;

-- Add index on view's filter column for fast lookups
-- (Views can use indexes from base tables automatically)
-- Existing idx_annotations_module index will be used when filtering by module_id

COMMENT ON VIEW module_traces IS 'Denormalized view of annotations with transcript and module metadata for module tracing feature. Ordered chronologically by transcript date.';
```

**Key decisions:**
- INNER JOIN with transcripts (orphaned annotations filtered out automatically)
- LEFT JOIN with modules (supports untagged highlights)
- ORDER BY in view definition (default chronological sort)
- No aggregation (keeps row-level detail for passage display)
- Existing indexes on annotations.module_id and annotations.transcript_id will accelerate queries

**Performance characteristics:**
- 1000 rows with proper indexes: ~10-50ms (well under 200ms target)
- Query plan reuse via view caching
- No additional storage overhead (computed on demand)
- Always fresh data (no refresh needed)

**Source:** [PostgreSQL Views Documentation](https://www.postgresql.org/docs/current/rules-materializedviews.html), [Supabase Views Blog Post](https://supabase.com/blog/postgresql-views)

### Recommended Project Structure

```
src/
├── app/
│   └── analysis/
│       └── modules/
│           └── [id]/
│               └── page.tsx              # Module trace view (Server Component)
├── components/
│   └── analysis/
│       ├── TraceCard.tsx                 # Single passage card (Server Component)
│       ├── TraceList.tsx                 # Card stack container (Client Component for filtering)
│       ├── TraceSearch.tsx               # Text search input (Client Component)
│       ├── ModuleSwitcher.tsx            # Dropdown to switch modules (Client Component)
│       └── ExpandablePassage.tsx         # Expand/collapse context (Client Component)
├── lib/
│   ├── queries/
│   │   └── module-traces.ts              # Supabase query functions
│   └── types/
│       └── trace.ts                      # TypeScript types for trace data
└── actions/
    └── analysis-actions.ts               # Server actions if needed
```

### Pattern 1: Server Component Data Fetching

**What:** Fetch all trace data on the server, render initial HTML, hydrate client components for interactivity.

**When to use:** Default pattern for trace view page. Eliminates waterfalls, improves Core Web Vitals.

**Example:**
```typescript
// Source: Next.js App Router documentation + React Server Components guide
// https://nextjs.org/docs/app/getting-started/fetching-data
// https://inhaq.com/blog/react-server-components-practical-guide-2026.html

// app/analysis/modules/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { TraceList } from '@/components/analysis/TraceList'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModuleTracePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch module and traces in parallel (no waterfall)
  const [moduleResult, tracesResult] = await Promise.all([
    supabase.from('modules').select('*').eq('id', id).single(),
    supabase
      .from('module_traces')
      .select('*')
      .eq('module_id', id)
      .order('transcript_date', { ascending: true, nullsFirst: false })
  ])

  if (moduleResult.error || !moduleResult.data) {
    notFound()
  }

  const module = moduleResult.data
  const traces = tracesResult.data || []

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            {module.name}
            <span className="ml-3 text-zinc-500 text-lg font-normal">
              ({traces.length} passages)
            </span>
          </h1>
        </header>

        {/* Client Component for filtering, receives server data as props */}
        <TraceList traces={traces} module={module} />
      </div>
    </div>
  )
}
```

**Performance benefits:**
- Zero waterfalls (both queries run in parallel)
- HTML streamed to client immediately
- No client-side loading spinners for initial data
- Reduced JavaScript bundle (Server Component renders to HTML)

**Source:** [Next.js Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data), [React Server Components Practical Guide 2026](https://inhaq.com/blog/react-server-components-practical-guide-2026.html)

### Pattern 2: Client-Side Filtering with useTransition

**What:** Filter large lists (1000+ items) without blocking UI interactions using React 19's concurrent features.

**When to use:** When users search/filter trace results. Keeps search input responsive while filtering runs in background.

**Example:**
```typescript
// Source: React 19 concurrent features documentation
// https://levelup.gitconnected.com/mastering-usetransition-and-usedeferredvalue-in-react-19-under-the-hood-real-world-patterns-0472f2121b94
// https://javascript.plainenglish.io/react-performance-hooks-understanding-usetransition-and-usedeferredvalue-af1ffec0561a

'use client'

import { useState, useTransition } from 'react'
import { TraceCard } from './TraceCard'
import { TraceSearch } from './TraceSearch'

interface TraceListProps {
  traces: ModuleTrace[]
  module: Module
}

export function TraceList({ traces, module }: TraceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTraces, setFilteredTraces] = useState(traces)
  const [isPending, startTransition] = useTransition()

  function handleSearch(query: string) {
    // Update search input immediately (high priority)
    setSearchQuery(query)

    // Defer filtering (low priority, non-blocking)
    startTransition(() => {
      const filtered = traces.filter(trace =>
        trace.highlighted_text.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredTraces(filtered)
    })
  }

  return (
    <div>
      <TraceSearch
        value={searchQuery}
        onChange={handleSearch}
        isPending={isPending}
      />

      <div className="mt-6 space-y-4">
        {filteredTraces.length === 0 && searchQuery ? (
          <p className="text-zinc-500 text-center py-12">
            No passages match "{searchQuery}"
          </p>
        ) : (
          filteredTraces.map(trace => (
            <TraceCard key={trace.id} trace={trace} moduleColor={module.color} />
          ))
        )}
      </div>
    </div>
  )
}
```

**Why useTransition:**
- User typing stays responsive (high-priority update)
- Filtering 1000+ items doesn't block input
- `isPending` flag shows visual feedback during filter
- Better than debouncing (no artificial delay when typing stops)

**Source:** [Mastering useTransition in React 19](https://levelup.gitconnected.com/mastering-usetransition-and-usedeferredvalue-in-react-19-under-the-hood-real-world-patterns-0472f2121b94)

### Pattern 3: Expandable Passage Context

**What:** Show highlighted text by default, expand to reveal paragraph plus neighbors on click.

**When to use:** In TraceCard component to balance density (many cards) with context (readability).

**Example:**
```typescript
// Source: React state management patterns
// Custom implementation for project needs

'use client'

import { useState } from 'react'

interface ExpandablePassageProps {
  highlightedText: string
  paragraphText: string | null      // Paragraph containing highlight
  beforeParagraph: string | null    // Previous paragraph
  afterParagraph: string | null     // Next paragraph
  moduleColor: string
}

export function ExpandablePassage({
  highlightedText,
  paragraphText,
  beforeParagraph,
  afterParagraph,
  moduleColor
}: ExpandablePassageProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isExpanded && paragraphText) {
    return (
      <div className="space-y-4">
        {beforeParagraph && (
          <p className="text-zinc-600 text-sm italic">
            {beforeParagraph}
          </p>
        )}

        <p className="text-zinc-900">
          {/* Highlight the passage within the paragraph */}
          <HighlightedText
            text={paragraphText}
            highlight={highlightedText}
            color={moduleColor}
          />
        </p>

        {afterParagraph && (
          <p className="text-zinc-600 text-sm italic">
            {afterParagraph}
          </p>
        )}

        <button
          onClick={() => setIsExpanded(false)}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Show less
        </button>
      </div>
    )
  }

  return (
    <div>
      <p
        className="cursor-pointer rounded-sm px-1"
        style={{ backgroundColor: moduleColor }}
        onClick={() => setIsExpanded(true)}
      >
        {highlightedText}
      </p>
      <button
        onClick={() => setIsExpanded(true)}
        className="mt-2 text-sm text-zinc-500 hover:text-zinc-700"
      >
        Show context
      </button>
    </div>
  )
}
```

**Key UX decisions:**
- Default collapsed (scannable card stack)
- Click to expand (progressive disclosure)
- Show paragraph neighbors (provides narrative flow)
- Maintain highlight color in expanded view (visual continuity)

### Pattern 4: Shareable URLs with Dynamic Routes

**What:** Use Next.js dynamic routes to create bookmarkable module trace URLs.

**When to use:** Always. Enables sharing specific traces, browser back/forward navigation.

**Example:**
```
URL pattern: /analysis/modules/[id]

Examples:
- /analysis/modules/uuid-123 → traces for module "Time Wave"
- /analysis/modules/uuid-456 → traces for module "Psychedelics"

File structure:
app/
└── analysis/
    └── modules/
        └── [id]/
            └── page.tsx  # Dynamic route using params.id
```

**Implementation:**
```typescript
// app/analysis/modules/[id]/page.tsx

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModuleTracePage({ params }: PageProps) {
  const { id } = await params
  // Use id to fetch module and traces
}

// Generate static params for known modules (optional optimization)
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: modules } = await supabase.from('modules').select('id')

  return modules?.map(m => ({ id: m.id })) || []
}
```

**Source:** [Next.js Dynamic Routes](https://nextjs.org/docs/app/getting-started/server-and-client-components)

### Anti-Patterns to Avoid

- **Fetching traces client-side with useEffect:** Creates waterfalls, slower initial load, worse Core Web Vitals. Always use Server Components for data fetching.
- **Materializing prematurely:** Adding materialized view complexity before profiling shows need. 1000 rows is not large; regular views with indexes are sufficient.
- **Rendering all 1000 cards immediately without filtering UI:** Overwhelming UX. Always provide search/filter even if performance is fine.
- **Using debounced search instead of useTransition:** Adds artificial delay. useTransition provides instant input response with deferred filtering.
- **Ordering in Supabase query instead of view definition:** View handles default sort once; queries don't need to specify order repeatedly.
- **Client-side sorting after fetch:** Wastes bandwidth and CPU. Let PostgreSQL sort on server (it's optimized for this).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query optimization without profiling | Custom indexes everywhere | PostgreSQL EXPLAIN ANALYZE + index_advisor extension | Premature optimization wastes time; explain plans show actual bottlenecks |
| Responsive filtering of large lists | Custom debouncing + loading states | React 19 useTransition hook | Built-in concurrent rendering, no artificial delays, better UX |
| Data fetching waterfalls | Sequential useEffect calls | Server Components + Promise.all() | Zero client waterfalls, better performance, smaller bundle |
| Materialized view refresh | Custom cron jobs outside database | pg_cron extension | Native PostgreSQL, transactional, integrated monitoring |
| Chronological sorting across varying date formats | String comparison or complex parsing | PostgreSQL ORDER BY with NULLS LAST | Database handles date types correctly, accounts for nulls, uses indexes |

**Key insight:** Query performance at 1000 rows is a solved problem with proper indexing. The database is already optimized for this scale. Focus implementation effort on UX (filtering, expandable context) rather than premature query optimization.

## Common Pitfalls

### Pitfall 1: Assuming 1000+ Rows Requires Materialized Views

**What goes wrong:** Developer sees "1000+ annotations" and "<200ms requirement" and immediately implements materialized views, adding refresh complexity.

**Why it happens:** Misunderstanding database scale. 1000 rows is tiny by PostgreSQL standards; modern databases handle millions of rows with proper indexes.

**How to avoid:**
- Profile first: Run EXPLAIN ANALYZE on actual query with real data
- Check existing indexes: annotations.module_id index already exists from Phase 4
- Understand query plan: PostgreSQL can serve 1000 rows with index scan in ~10-50ms
- Only materialize if profiling shows >200ms with proper indexes (unlikely)

**Warning signs:**
- No EXPLAIN ANALYZE output before deciding on materialization
- Refresh strategy discussions before measuring actual query time
- Complexity added without performance problem demonstrated

**Source:** [Supabase Materialized Views Best Practices](https://supabase.com/docs/guides/database/database-advisors), [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

### Pitfall 2: Fetching Paragraph Context with N+1 Queries

**What goes wrong:** For each trace card showing expanded context, app makes separate query to fetch before/after paragraphs. 100 expanded cards = 200+ extra queries.

**Why it happens:** Not thinking through data requirements upfront. View only includes annotation data, not surrounding paragraphs.

**How to avoid:**
- Include paragraph IDs in view (start_paragraph_id, end_paragraph_id already there)
- Fetch paragraph context in initial query using IN clause:
  ```typescript
  const paragraphIds = traces.flatMap(t => [
    t.start_paragraph_id - 1,  // before
    t.start_paragraph_id,      // containing
    t.start_paragraph_id + 1   // after
  ])

  const { data: paragraphs } = await supabase
    .from('transcript_paragraphs')
    .select('*')
    .in('id', paragraphIds)
  ```
- Build lookup map client-side, pass to TraceCard components
- Alternative: Add paragraph text to view with LEFT JOINs (denormalized but simpler)

**Warning signs:**
- Network tab shows hundreds of paragraph queries when scrolling
- Slow loading when many cards are expanded
- Supabase query count spikes with trace view usage

**Source:** PostgreSQL join patterns, [Faster PostgreSQL Counting](https://www.citusdata.com/blog/2016/10/12/count-performance/)

### Pitfall 3: Client-Side Filtering Blocks Input on Large Lists

**What goes wrong:** User types in search box, UI freezes for 100-500ms while filtering 1000 items. Feels laggy and unresponsive.

**Why it happens:** Synchronous state update blocks rendering. React re-renders entire filtered list before returning control to browser.

**How to avoid:**
- Use useTransition to mark filter updates as low-priority
- Input value updates immediately (high priority)
- Filtering happens in deferred cycle (doesn't block typing)
- Show isPending state during filter (subtle loading indicator)

**Pattern:**
```typescript
const [query, setQuery] = useState('')
const [isPending, startTransition] = useTransition()

function handleSearch(value: string) {
  setQuery(value)  // Immediate, high-priority

  startTransition(() => {
    // Deferred, non-blocking
    setFiltered(traces.filter(t => t.text.includes(value)))
  })
}
```

**Warning signs:**
- Input cursor freezes between keystrokes
- Search input feels sluggish with >500 items
- Users report "laggy" or "slow" search experience

**Source:** [React 19 useTransition Guide](https://levelup.gitconnected.com/mastering-usetransition-and-usedeferredvalue-in-react-19-under-the-hood-real-world-patterns-0472f2121b94), [Fixing React Input Lag](https://medium.com/@priyenmehta27/fixing-react-input-lag-how-usetransition-usedeferredvalue-saved-our-ux-666d9514219b)

### Pitfall 4: Server Component / Client Component Boundary Confusion

**What goes wrong:** Entire page marked 'use client' to enable filtering, losing Server Component benefits (waterfalls, larger bundle, slower initial load).

**Why it happens:** Unclear understanding of Server/Client component composition. Developers default to 'use client' when any interactivity needed.

**How to avoid:**
- Page (route) is Server Component (default)
- Fetch data on server, pass as props to Client Component
- Only mark interactive components with 'use client' (search input, expand buttons)
- Static content (cards, headers) can be Server Components even inside Client Component tree

**Correct pattern:**
```typescript
// page.tsx (Server Component - NO 'use client')
export default async function Page() {
  const data = await fetchData()  // Server-side
  return <TraceList data={data} />  // Pass to Client Component
}

// TraceList.tsx (Client Component - HAS 'use client')
'use client'
export function TraceList({ data }) {
  const [filtered, setFiltered] = useState(data)
  // Interactive filtering here
}
```

**Warning signs:**
- 'use client' at top of page.tsx file
- Data fetching with useEffect in route components
- Unnecessarily large client bundle size
- Slower initial page load compared to other routes

**Source:** [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [React Server Components Practical Guide](https://inhaq.com/blog/react-server-components-practical-guide-2026.html)

### Pitfall 5: Transcript Date Sorting Without NULL Handling

**What goes wrong:** Traces appear in wrong order. Lectures with missing dates sort first or last unpredictably.

**Why it happens:** PostgreSQL default NULL behavior in ORDER BY varies. Some transcripts have null dates (date unknown).

**How to avoid:**
- Always specify NULLS FIRST or NULLS LAST in ORDER BY
- For chronological order (oldest first): `ORDER BY date ASC NULLS LAST`
- Creates consistent behavior: known dates in chronological order, unknown dates at end
- Document decision in view definition

**Example:**
```sql
CREATE VIEW module_traces AS
SELECT ...
FROM annotations a
INNER JOIN transcripts t ON a.transcript_id = t.id
ORDER BY t.date ASC NULLS LAST, a.created_at ASC;
```

**Warning signs:**
- Traces appear in different order on refresh
- Lectures without dates appear at top instead of bottom
- User reports "wrong chronological order"

**Source:** [PostgreSQL ORDER BY documentation](https://www.postgresql.org/docs/current/queries-order.html)

## Code Examples

Verified patterns from official sources:

### Module Trace View with Server Components

```typescript
// Source: Next.js App Router + Supabase patterns
// https://nextjs.org/docs/app/getting-started/fetching-data
// https://supabase.com/docs/guides/database/joins-and-nesting

// app/analysis/modules/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { TraceList } from '@/components/analysis/TraceList'
import { ModuleSwitcher } from '@/components/analysis/ModuleSwitcher'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModuleTracePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Parallel queries (no waterfall)
  const [moduleResult, tracesResult, allModulesResult] = await Promise.all([
    supabase.from('modules').select('*').eq('id', id).single(),
    supabase
      .from('module_traces')
      .select('*')
      .eq('module_id', id),
    supabase.from('modules').select('id, name, color').order('name')
  ])

  if (moduleResult.error || !moduleResult.data) {
    notFound()
  }

  const module = moduleResult.data
  const traces = tracesResult.data || []
  const allModules = allModulesResult.data || []

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {module.name}
              <span className="ml-3 text-zinc-500 text-lg font-normal">
                ({traces.length} {traces.length === 1 ? 'passage' : 'passages'})
              </span>
            </h1>
          </div>

          {/* Client Component for module switching */}
          <ModuleSwitcher
            currentModuleId={module.id}
            modules={allModules}
          />
        </div>

        {traces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
            <p className="text-zinc-600">
              No passages tagged with this module yet.
            </p>
          </div>
        ) : (
          // Client Component for filtering, receives server data
          <TraceList traces={traces} module={module} />
        )}
      </div>
    </div>
  )
}

// Optional: Generate static params for all modules
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: modules } = await supabase.from('modules').select('id')
  return modules?.map(m => ({ id: m.id })) || []
}
```

### Client-Side Search with useTransition

```typescript
// Source: React 19 concurrent features
// https://levelup.gitconnected.com/mastering-usetransition-and-usedeferredvalue-in-react-19-under-the-hood-real-world-patterns-0472f2121b94

'use client'

import { useState, useTransition } from 'react'
import { TraceCard } from './TraceCard'

interface TraceListProps {
  traces: ModuleTrace[]
  module: Module
}

export function TraceList({ traces, module }: TraceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTraces, setFilteredTraces] = useState(traces)
  const [isPending, startTransition] = useTransition()

  function handleSearch(query: string) {
    // Update input immediately (high priority, non-blocking)
    setSearchQuery(query)

    // Defer filtering operation (low priority)
    startTransition(() => {
      if (!query.trim()) {
        setFilteredTraces(traces)
        return
      }

      const lowercaseQuery = query.toLowerCase()
      const filtered = traces.filter(trace =>
        trace.highlighted_text.toLowerCase().includes(lowercaseQuery)
      )
      setFilteredTraces(filtered)
    })
  }

  return (
    <div>
      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search passages..."
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        {isPending && (
          <p className="mt-2 text-sm text-zinc-500">Filtering...</p>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredTraces.length === 0 && searchQuery ? (
          <p className="text-zinc-500 text-center py-12">
            No passages match "{searchQuery}"
          </p>
        ) : (
          filteredTraces.map(trace => (
            <TraceCard
              key={trace.id}
              trace={trace}
              moduleColor={module.color}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

### PostgreSQL View Definition

```sql
-- Source: PostgreSQL views documentation + project schema
-- https://www.postgresql.org/docs/current/rules-materializedviews.html

-- Module traces view (denormalized for analysis queries)
CREATE VIEW module_traces AS
SELECT
  -- Annotation fields
  a.id,
  a.module_id,
  a.highlighted_text,
  a.selector,
  a.start_paragraph_id,
  a.end_paragraph_id,
  a.created_at as annotation_created_at,

  -- Transcript metadata (for display and sorting)
  t.id as transcript_id,
  t.title as transcript_title,
  t.date as transcript_date,
  t.location as transcript_location,

  -- Module metadata (for display)
  m.name as module_name,
  m.color as module_color

FROM annotations a
INNER JOIN transcripts t ON a.transcript_id = t.id
LEFT JOIN modules m ON a.module_id = m.id

-- Default chronological order (oldest lectures first)
-- NULLS LAST ensures lectures with unknown dates appear at end
ORDER BY
  t.date ASC NULLS LAST,
  a.created_at ASC;

-- Add helpful comment
COMMENT ON VIEW module_traces IS
  'Denormalized view of annotations with transcript and module metadata.
   Used by module tracing feature to display all passages for a given module
   across the entire corpus, sorted chronologically by lecture date.';

-- Note: View automatically uses existing indexes:
-- - idx_annotations_module (for WHERE module_id = ?)
-- - idx_annotations_transcript (for joins)
-- - idx_transcripts_date (for ORDER BY)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side data fetching (useEffect) | Server Components with async/await | 2024 (Next.js App Router stable) | Eliminates waterfalls, faster initial load, smaller bundles |
| Debounced search filtering | useTransition for concurrent filtering | 2025 (React 19 stable) | No artificial delays, better perceived performance, responsive input |
| Materialized views for all aggregations | Regular views with strategic indexes | Ongoing (PostgreSQL optimization maturity) | Less complexity, always fresh data, sufficient performance for <100k rows |
| Custom loading states everywhere | Suspense boundaries + streaming | 2024+ (RSC + Suspense stable) | Declarative loading, progressive enhancement, better UX |
| Manual query optimization | EXPLAIN ANALYZE + index_advisor | 2023+ (Supabase tooling) | Data-driven optimization, avoid premature optimization |

**Deprecated/outdated:**
- **Client-side routing with data fetching in useEffect:** Next.js App Router Server Components eliminate this pattern entirely
- **Manual debouncing for search:** React 19 useTransition provides better UX without artificial delays
- **Overly aggressive materialization:** Modern PostgreSQL + proper indexing handles moderate datasets (1k-100k rows) efficiently with regular views

## Open Questions

Things that couldn't be fully resolved:

1. **Paragraph context fetching strategy**
   - What we know: Need before/after paragraphs for expanded view, denormalizing into view adds complexity
   - What's unclear: Whether to fetch paragraph context in initial query (larger payload) or on-demand when expanding (N+1 risk)
   - Recommendation: Start with on-demand fetching using paragraph IDs, optimize to batch fetch if many cards expanded simultaneously

2. **Actual query performance at scale**
   - What we know: 1000 rows with proper indexes should be <200ms, existing indexes are in place
   - What's unclear: Real-world performance with actual transcript/annotation data in production
   - Recommendation: Profile with EXPLAIN ANALYZE using production data before launch. Add materialized view only if needed.

3. **Handling lectures with partial dates (year only)**
   - What we know: Some transcripts have year-only dates (e.g., "1985"), others have full dates (e.g., "1985-03-15")
   - What's unclear: How PostgreSQL's ORDER BY handles mixed date formats, whether custom sorting logic needed
   - Recommendation: Test with real data. May need to normalize date column to timestamp or use custom sort logic.

4. **Module switching UX pattern**
   - What we know: User should be able to switch modules within trace view (dropdown vs sidebar vs other)
   - What's unclear: Best UX for discovering and switching between module traces
   - Recommendation: Simple dropdown in header (user's discretion). Could enhance with module grid sidebar later based on usage patterns.

## Sources

### Primary (HIGH confidence)

- [Next.js Data Fetching Documentation](https://nextjs.org/docs/app/getting-started/fetching-data) - Official Next.js guidance
- [PostgreSQL Views Documentation](https://www.postgresql.org/docs/current/rules-materializedviews.html) - Official PostgreSQL docs
- [Supabase PostgreSQL Views Blog Post](https://supabase.com/blog/postgresql-views) - Official Supabase guidance
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html) - Official optimization guide
- [Supabase Joins and Nesting](https://supabase.com/docs/guides/database/joins-and-nesting) - Official PostgREST patterns

### Secondary (MEDIUM confidence)

- [React Server Components Practical Guide 2026](https://inhaq.com/blog/react-server-components-practical-guide-2026.html) - Community guide with current practices
- [Mastering useTransition in React 19](https://levelup.gitconnected.com/mastering-usetransition-and-usedeferredvalue-in-react-19-under-the-hood-real-world-patterns-0472f2121b94) - Technical deep-dive on concurrent features
- [PostgreSQL Speeding Up GROUP BY and Joins](https://www.cybertec-postgresql.com/en/postgresql-speeding-up-group-by-and-joins/) - Performance optimization patterns
- [Faster PostgreSQL Counting](https://www.citusdata.com/blog/2016/10/12/count-performance/) - Aggregate optimization techniques
- [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) - Security and performance patterns

### Tertiary (LOW confidence - WebSearch only, marked for validation)

- Various Medium articles on useTransition/useDeferredValue - Community patterns, not official documentation
- Stack Overflow discussions on view performance - Anecdotal, not authoritative
- Blog posts on Next.js architecture - Community opinions, may not reflect latest best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js, React 19, PostgreSQL views are established technologies with official docs
- Architecture: HIGH - Server Component patterns are official Next.js guidance, PostgreSQL views are standard approach
- Pitfalls: MEDIUM - N+1 queries and Client/Server boundary confusion are documented issues, but specific to project context

**Research date:** 2026-02-13
**Valid until:** ~60 days (moderately stable - React 19 features stable, PostgreSQL patterns established, but Next.js evolving rapidly)

**Critical validation needed:**
- Profile actual query performance with EXPLAIN ANALYZE on production-like data before deciding on materialized views
- Test transcript date sorting with mixed date formats (year-only vs full dates) from real corpus
- Verify useTransition behavior with 1000+ items on target devices (mobile, older hardware)
