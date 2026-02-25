# Phase 3: Reading Interface - Research

**Phase:** 03-reading-interface
**Researched:** 2026-02-07
**Researcher:** gsd-phase-researcher agent

## Research Question

**"What do I need to know to PLAN this phase well?"**

This research investigates the technical approaches, libraries, performance patterns, and implementation considerations needed to build a clean, performant reading experience for transcripts up to 87K words with virtualization, search, and position memory.

---

## 1. Virtualization for Large Text Documents

### The Challenge

**Performance requirement:** Smooth scrolling (30+ fps) for 87K word transcript (~10,000+ paragraphs)

**Problem:** Rendering 10K+ DOM elements simultaneously causes:
- Initial render slowdown (seconds vs milliseconds)
- Memory overhead (10K+ DOM nodes in memory)
- Sluggish scrolling performance
- Browser Ctrl+F breaks (can't search non-rendered content)

### Library Options

#### **Option A: TanStack Virtual** (Recommended)

**Current version:** Latest (2026-ready, React 19 compatible)

**Strengths:**
- **Headless UI** - Full control over markup and styles (critical for typography requirements)
- **Dynamic height support** - Automatically measures variable-height paragraphs via `measureElement` option
- **Lightweight** - 10-15kb bundle size
- **Framework-agnostic core** - Well-maintained, modern codebase
- **60 FPS virtualization** - Optimized for smooth scrolling
- **React 19 compatibility** - Set `useFlushSync: false` to avoid console warnings with React 19

**How it works:**
```typescript
// Uses estimated dimension initially, readjusts on fly as elements render
const virtualizer = useVirtualizer({
  count: paragraphs.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // Estimate for paragraphs
  measureElement: (el) => el.getBoundingClientRect().height, // Actual measurement
  overscan: 5 // Render 5 extra items above/below viewport
})
```

**Implementation pattern:**
- Uses `ref` callback to measure actual element heights after render
- Virtual items have `transform: translateY()` for positioning
- Only renders items in viewport + overscan buffer
- Automatically handles scroll position calculations

**Caveats:**
- Smooth scrolling to specific items not supported with dynamic heights (use instant scroll)
- CSS margins on paragraph content can break height calculations (use padding instead)
- Need to account for `scrollMargin` when items above viewport change height

**Sources:**
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [React Virtual Framework Guide](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)
- [TanStack Virtual Dynamic Example](https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic)
- [From Lag to Lightning: How TanStack Virtual Optimizes 1000s of Items](https://medium.com/@sanjivchaudhary416/from-lag-to-lightning-how-tanstack-virtual-optimizes-1000s-of-items-smoothly-24f0998dc444)

#### **Option B: React Virtuoso**

**Strengths:**
- **Zero-config variable heights** - Automatically adapts without manual measurement setup
- **Rich feature set** - Built-in scroll restoration, sticky headers, chat interface patterns
- **User-friendly API** - Less boilerplate than TanStack Virtual
- **Automatic height monitoring** - Watches for content changes and readjusts

**Tradeoffs:**
- Larger bundle size than TanStack Virtual
- Less control over implementation details
- May include features we don't need

**When to choose:** If you want faster initial implementation with less configuration, and bundle size isn't critical.

**Sources:**
- [React Virtuoso Official Site](https://virtuoso.dev/)
- [React Virtuoso Auto Resizing](https://virtuoso.dev/auto-resizing/)
- [Infinite Scrolling: react-window vs react-virtuoso](https://medium.com/@stuthineal/infinite-scrolling-made-easy-react-window-vs-react-virtuso-1fd786058a73)

#### **Option C: react-window**

**Status:** Not recommended for this use case

**Reason:** Assumes fixed or pre-calculated item heights. Variable-height text paragraphs would require complex manual measurement logic that TanStack Virtual and React Virtuoso handle automatically.

### Implementation Recommendations

**For Phase 3:**

1. **Start with TanStack Virtual** - Best fit for requirements:
   - Need full typography control (headless UI)
   - Already using lightweight stack (Next.js + Tailwind)
   - Variable paragraph heights are core challenge
   - React 19 in package.json (needs `useFlushSync: false` config)

2. **Structure:**
```typescript
// Paragraph rendering with virtualization
const virtualizer = useVirtualizer({
  count: paragraphs.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80, // ~3-4 lines of text
  overscan: 5,
})

// Only render virtual items
virtualizer.getVirtualItems().map(virtualItem => (
  <div
    key={virtualItem.key}
    data-index={virtualItem.index}
    ref={virtualizer.measureElement}
    style={{ transform: `translateY(${virtualItem.start}px)` }}
  >
    <Paragraph data={paragraphs[virtualItem.index]} />
  </div>
))
```

3. **Paragraph component:**
   - Use padding (not margin) for spacing to avoid height calculation issues
   - Render timestamp in left gutter (absolute positioning within paragraph container)
   - Show speaker label only when speaker changes from previous paragraph
   - Keep markup simple for accurate measurements

4. **Testing:**
   - Test with longest transcript (87K words) + 100 mock annotations (Phase 3 blocker from STATE.md)
   - Measure scroll performance with browser DevTools Performance panel
   - Verify 30+ fps during rapid scrolling
   - Check memory usage doesn't grow unbounded

**Sources:**
- [Virtual Scrolling Core Principles in React](https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/)
- [How to Speed Up Long Lists with TanStack Virtual](https://blog.logrocket.com/speed-up-long-lists-tanstack-virtual/)

---

## 2. Search Within Transcript

### Challenge: Search in Virtualized Content

**Problem:** Browser's native Ctrl+F doesn't work with virtualized content because most paragraphs aren't in the DOM. Need custom search implementation.

### Architecture

**Two-part search display** (from 03-CONTEXT.md decisions):
1. **Sidebar panel** - List of matches with context snippets
2. **In-text highlights** - Visual markers in reading view

**Implementation approach:**

```typescript
// 1. Search logic (client-side)
const searchResults = paragraphs
  .map((para, index) => ({
    paragraphIndex: index,
    matches: findMatches(para.text, searchQuery), // Array of {start, end, snippet}
  }))
  .filter(result => result.matches.length > 0)

// 2. Sidebar list rendering
searchResults.map(result => (
  <SearchResultItem
    onClick={() => scrollToIndex(result.paragraphIndex)}
    snippet={result.matches[0].snippet} // Show first match context
    highlightCount={result.matches.length}
  />
))

// 3. In-text highlighting (in Paragraph component)
function highlightText(text: string, searchQuery: string) {
  // Use react-highlight-words or custom implementation
  return <HighlightedText text={text} searchWords={[searchQuery]} />
}
```

### Text Highlighting Libraries

#### **Option A: react-highlight-words** (Recommended)

**Why:** Simple, battle-tested library for highlighting search matches in text.

**Features:**
- Plain text search (matches requirement: no regex)
- Case-insensitive option
- Custom highlight styling
- Lightweight (~2kb)

**Usage:**
```typescript
import Highlighter from 'react-highlight-words'

<Highlighter
  searchWords={[searchQuery]}
  textToHighlight={paragraph.text}
  highlightClassName="bg-yellow-200"
/>
```

**Performance considerations:**
- Use `useMemo` to cache highlighted text when search query unchanged
- Only highlight visible paragraphs (virtualization handles this automatically)

**Sources:**
- [react-highlight-words npm](https://www.npmjs.com/package/react-highlight-words)
- [react-highlight-words GitHub](https://github.com/bvaughn/react-highlight-words)
- [Building Real-time Search in React with Highlighting](https://medium.com/@dlrnjstjs/building-a-real-time-search-in-react-from-debouncing-to-highlighting-337001648414)

#### **Alternative: Custom implementation**

If bundle size is critical, implement simple string.replace() with highlight spans. React-highlight-words is only 2kb, so not a strong reason to DIY.

### Scrolling to Search Results

**Challenge:** TanStack Virtual with dynamic heights doesn't support smooth scrolling.

**Solution:** Use instant scroll to match paragraph.

```typescript
// Scroll to specific paragraph index
function scrollToMatch(paragraphIndex: number) {
  virtualizer.scrollToIndex(paragraphIndex, {
    align: 'start', // Position at top of viewport
    behavior: 'auto', // Instant (smooth not supported with dynamic heights)
  })
}
```

**UX consideration:** Instant scroll is acceptable for search navigation. Users expect immediate jumps when clicking search results.

### Sidebar Panel Implementation

**Requirements:**
- Can stay open while reading
- Shows match count and context snippets
- Click to jump to match
- No prev/next buttons (click-to-jump only)

**State management:**
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState<SearchResult[]>([])
const [sidebarOpen, setSidebarOpen] = useState(false)

// Trigger search when query changes
useEffect(() => {
  if (searchQuery.length >= 2) {
    const results = performSearch(paragraphs, searchQuery)
    setSearchResults(results)
    setSidebarOpen(true)
  } else {
    setSearchResults([])
    setSidebarOpen(false)
  }
}, [searchQuery, paragraphs])
```

**Sources:**
- [Search in Virtualized Lists Issue](https://github.com/bvaughn/react-virtualized/issues/1835)
- [React Autocomplete with Virtualized Results](https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972)

---

## 3. Position Memory (Resume Reading)

### Requirement

"Continue where you left off?" prompt when returning to transcript.

### Implementation Pattern

**Storage:** localStorage (survives browser close, specific to transcript)

**Data structure:**
```typescript
interface ReadingPosition {
  transcriptId: string
  scrollOffset: number // or paragraphIndex
  timestamp: number // When position was saved
  lastRead: string // ISO date string
}

// Key: `reading-position-${transcriptId}`
```

**Save position pattern:**

```typescript
// Debounced scroll handler (avoid excessive localStorage writes)
const debouncedSavePosition = useMemo(
  () => debounce((scrollOffset: number) => {
    const position: ReadingPosition = {
      transcriptId,
      scrollOffset,
      timestamp: Date.now(),
      lastRead: new Date().toISOString(),
    }
    localStorage.setItem(`reading-position-${transcriptId}`, JSON.stringify(position))
  }, 1000), // Save 1s after scroll stops
  [transcriptId]
)

// Attach to scroll event
useEffect(() => {
  const scrollElement = scrollRef.current
  const handleScroll = () => {
    debouncedSavePosition(scrollElement.scrollTop)
  }
  scrollElement?.addEventListener('scroll', handleScroll)
  return () => scrollElement?.removeEventListener('scroll', handleScroll)
}, [debouncedSavePosition])
```

**Restore position pattern:**

```typescript
// On component mount, check for saved position
useEffect(() => {
  const saved = localStorage.getItem(`reading-position-${transcriptId}`)
  if (!saved) return

  const position: ReadingPosition = JSON.parse(saved)

  // Show prompt if position saved recently (e.g., within last 7 days)
  const daysSinceLastRead = (Date.now() - position.timestamp) / (1000 * 60 * 60 * 24)
  if (daysSinceLastRead < 7) {
    setShowResumePrompt(true)
    setSavedPosition(position)
  }
}, [transcriptId])

// Resume action
function resumeReading() {
  scrollRef.current?.scrollTo({
    top: savedPosition.scrollOffset,
    behavior: 'auto', // Instant scroll
  })
  setShowResumePrompt(false)
}
```

**Alternative: Use paragraph index instead of pixel offset**

More resilient to content changes (e.g., if annotations added above reading position):

```typescript
// Save paragraph index of first visible paragraph
const firstVisibleIndex = virtualizer.getVirtualItems()[0]?.index ?? 0
localStorage.setItem(`reading-position-${transcriptId}`, JSON.stringify({
  transcriptId,
  paragraphIndex: firstVisibleIndex,
  timestamp: Date.now(),
}))

// Restore by scrolling to paragraph index
virtualizer.scrollToIndex(position.paragraphIndex, { align: 'start' })
```

**Recommended:** Use paragraph index approach for better resilience.

**Sources:**
- [Persist Scroll Position with React Hooks](https://chrisfrew.in/blog/persist-and-remember-page-scroll-position-with-react-hooks/)
- [Save and Restore Scroll Position in React](https://gist.github.com/jeffijoe/510f6823ef809e3711ed307823b48c0a)
- [Restore Scroll Position in Next.js](https://gist.github.com/claus/992a5596d6532ac91b24abe24e10ae81)
- [Boost UX: Memorizing Scroll Position](https://medium.com/front-end-weekly/boost-user-experience-memorizing-scroll-position-with-javascript-2adfb6ca6c2b)
- [Implementing Scroll Restoration in React Apps](https://blog.logrocket.com/implementing-scroll-restoration-in-ecommerce-react-apps/)

---

## 4. Transcript List with Search and Filtering

### Database Queries

**Already implemented (Phase 1):**
- Full-text search on transcripts: `search_transcripts()` RPC function
- GIN indexes on tsvector columns for sub-200ms performance
- Weighted search vectors (title > description > tags)

**List page queries needed:**

1. **Default view (chronological, oldest first):**
```sql
SELECT id, title, date
FROM transcripts
ORDER BY date ASC;
```

2. **Filter by topic tags:**
```sql
SELECT id, title, date
FROM transcripts
WHERE topic_tags && ARRAY['consciousness', 'alchemy'] -- Any tag matches
ORDER BY date ASC;
```

3. **Combined search (title + full-text corpus):**
```sql
SELECT id, title, date, ts_rank(search_vector, query) as rank
FROM transcripts, plainto_tsquery('english', 'psychedelic experience') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

**Implementation in Next.js:**

```typescript
// Server Component for list page
export default async function TranscriptsPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('transcripts')
    .select('id, title, date')

  // Apply filters
  if (searchParams.q) {
    // Full-text search
    const { data } = await supabase.rpc('search_transcripts', {
      search_query: searchParams.q
    })
    return <TranscriptList transcripts={data} />
  }

  if (searchParams.tag) {
    query = query.contains('topic_tags', [searchParams.tag])
  }

  // Default: chronological order
  query = query.order('date', { ascending: true })

  const { data: transcripts } = await query
  return <TranscriptList transcripts={transcripts} />
}
```

**Pagination consideration:**

With 92 transcripts total, pagination not strictly required for v1. But if list grows:
- Use `limit()` and `range()` for pagination
- Or implement infinite scroll with Next.js Server Actions

**Sources:**
- Existing migrations: `001_create_corpus_tables.sql`, `002_create_search_function.sql`
- [Full-Text Search in PostgreSQL](https://www.paradedb.com/learn/search-in-postgresql/full-text-search)
- [Next.js 14 Infinite Scroll Optimization](https://medium.com/@sainianmol16/optimized-infinite-scroll-with-next-js-14-server-actions-and-react-query-f5256edc90b4)

---

## 5. Typography and Reading Layout

### Design Goals (from 03-CONTEXT.md)

- **Paragraph spacing:** Compact (more content visible, less scrolling)
- **Timestamps:** Left margin gutter (keeps text clean)
- **Speaker labels:** Show on change only (avoid clutter in monologue sections)
- **Theme:** Light only (no dark mode)

### Implementation Patterns

**1. Paragraph container:**

```tsx
<div className="relative py-2 pl-16"> {/* Left padding for timestamp gutter */}
  {/* Timestamp in absolute positioned gutter */}
  {paragraph.timestamp && (
    <span className="absolute left-0 top-2 text-xs text-gray-400 w-14 text-right">
      {paragraph.timestamp}
    </span>
  )}

  {/* Speaker label (conditional) */}
  {shouldShowSpeaker && (
    <div className="text-sm font-semibold text-gray-700 mb-1">
      {paragraph.speaker}
    </div>
  )}

  {/* Paragraph text */}
  <p className="text-base leading-relaxed">
    {paragraph.text}
  </p>
</div>
```

**2. Typography choices (Claude's discretion):**

Suggested starting point:
- **Font family:** System font stack for performance (`font-sans` in Tailwind)
- **Font size:** 16px base (`text-base`)
- **Line height:** 1.625 (`leading-relaxed`) for comfortable reading
- **Max width:** 65-75 characters (~700px) for optimal readability
- **Paragraph spacing:** `py-2` (compact as specified)

**3. Speaker label logic:**

```typescript
function shouldShowSpeakerLabel(currentPara: Paragraph, prevPara?: Paragraph): boolean {
  if (!currentPara.speaker) return false
  if (!prevPara) return true // First paragraph
  return currentPara.speaker !== prevPara.speaker // Speaker changed
}
```

**4. Container layout:**

```tsx
<div className="max-w-3xl mx-auto px-4 py-8">
  {/* Virtualized paragraph list */}
  <div ref={scrollRef} className="h-screen overflow-auto">
    {/* Virtual items */}
  </div>
</div>
```

---

## 6. Loading States and Error Handling

### Loading Transcript

**Requirement (from 03-CONTEXT.md):** Spinner + transcript title

**Implementation:**

```tsx
// Server Component fetches transcript
export default async function TranscriptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: transcript, error } = await supabase
    .from('transcripts')
    .select('*, transcript_paragraphs(*)')
    .eq('id', params.id)
    .single()

  if (error || !transcript) {
    return <TranscriptNotFound />
  }

  return (
    <Suspense fallback={<TranscriptSkeleton title={transcript.title} />}>
      <TranscriptReader transcript={transcript} />
    </Suspense>
  )
}

// Loading skeleton
function TranscriptSkeleton({ title }: { title: string }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      <div className="flex items-center justify-center py-12">
        <Spinner />
        <span className="ml-3 text-gray-600">Loading transcript...</span>
      </div>
    </div>
  )
}
```

### Error States

**Empty states needed:**
1. No transcripts match filter
2. No search results found
3. Transcript not found (404)

**Implementation left to Claude's discretion** (from 03-CONTEXT.md).

Simple approach:
```tsx
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
```

---

## 7. Performance Optimization Summary

### Critical Performance Requirements

1. **Virtualization:** 30+ fps scrolling on 87K word transcript
   - **Solution:** TanStack Virtual with `overscan: 5`
   - **Test:** Browser DevTools Performance panel

2. **Search speed:** Sub-200ms full-text search
   - **Already implemented:** PostgreSQL GIN indexes (Phase 1)
   - **Verified:** 90-131ms query times in Phase 1 testing

3. **Initial load:** Fast Time to Interactive
   - **Approach:** Server Components fetch data, minimal client JS
   - **Bundle size:** TanStack Virtual adds only 10-15kb

### Performance Testing Plan

**In Phase 3 implementation:**

1. **Load longest transcript (87K words) with 100 mock annotations**
   - Required per STATE.md blocker
   - Verify smooth scrolling maintained with annotations present

2. **Measure metrics:**
   - Initial page load time
   - Time to First Contentful Paint (FCP)
   - Scroll performance (fps during rapid scrolling)
   - Search latency (query to results display)
   - Memory usage over time

3. **Browser DevTools Performance panel:**
   - Record scrolling session
   - Check for frame drops below 30fps
   - Identify any layout thrashing or excessive reflows

4. **Lighthouse audit:**
   - Target: 90+ Performance score
   - Monitor bundle size impact

**Sources:**
- [Optimizing Next.js Performance](https://dev.to/bhargab/optimizing-performance-in-nextjs-and-reactjs-best-practices-and-strategies-1j2a)
- [Next.js Large Page Data Warning](https://nextjs.org/docs/messages/large-page-data)

---

## 8. Known Issues and Gotchas

### Virtualization Pitfalls

1. **CSS margins break height calculations**
   - **Solution:** Use padding on paragraph content, not margin
   - **Why:** Margins can protrude outside container, causing incorrect measurements

2. **Smooth scrolling not supported with dynamic heights**
   - **Workaround:** Use instant scroll (`behavior: 'auto'`)
   - **Impact:** Acceptable for search navigation UX

3. **Browser Ctrl+F doesn't work**
   - **Solution:** Custom search implementation (covered in section 2)
   - **User education:** May need hint/tooltip explaining custom search

### React 19 Compatibility

**Issue:** TanStack Virtual may log console warnings about `flushSync` during scrolling in React 19.

**Solution:** Set `useFlushSync: false` in virtualizer config.

```typescript
const virtualizer = useVirtualizer({
  // ... other options
  useFlushSync: false, // Eliminates React 19 warnings
})
```

**Source:** [TanStack Virtual React 19 Best Practices](https://dev.to/sheldonwelinga/harnessing-the-power-of-tanstackreact-virtual-with-react-hooks-a-step-by-step-guide-mgg)

### LocalStorage Limitations

**Potential issues:**
1. **Storage quota:** 5-10MB limit per origin (unlikely to hit with reading positions)
2. **Privacy mode:** localStorage may not persist in private/incognito browsers
3. **Cross-device:** Positions don't sync across devices

**Mitigation:**
- Handle localStorage errors gracefully (try/catch)
- Degrade gracefully if unavailable (just don't show resume prompt)
- Document limitation (v1 acceptable, could sync via database in v2)

### PostgreSQL Full-Text Search Considerations

**ts_headline performance:**

PostgreSQL's `ts_headline()` function generates highlighted excerpts for search results. Per research:
- Average execution time: ~0.135ms per document
- Performance degrades with very large documents

**For Phase 3:**
- Don't use `ts_headline()` for paragraph-level search (too slow)
- Use client-side highlighting with react-highlight-words instead
- Reserve `ts_headline()` for transcript list page snippets (if needed)

**Source:** [PostgreSQL Full-Text Search Performance](https://iniakunhuda.medium.com/postgresql-full-text-search-a-powerful-alternative-to-elasticsearch-for-small-to-medium-d9524e001fe0)

---

## 9. Technology Stack Summary

### Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.x", // Virtualization
    "react-highlight-words": "^0.20.x" // Search highlighting
  }
}
```

**Bundle size impact:** ~12-17kb gzipped total

### Existing Stack (from package.json)

- **Next.js 16.1.6** - Server Components, App Router
- **React 19.2.3** - Latest React (note: TanStack Virtual React 19 config needed)
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript 5** - Type safety
- **Supabase** - Database with full-text search already configured
- **Zod** - Already in dependencies for validation

**No additional infrastructure needed** - everything can be built with existing stack + 2 small libraries.

---

## 10. Open Questions for Planning

### Questions to Answer in 03-PLAN.md

1. **Paragraph component structure:**
   - Should timestamp gutter be fixed width or dynamic?
   - How to handle missing timestamps (some paragraphs may not have them)?

2. **Search UX details:**
   - Should search be case-sensitive or insensitive?
   - Minimum query length before triggering search (2 chars? 3 chars)?
   - How to indicate current match when navigating results?
   - Should search results update live as user types (debounced)?

3. **Position memory expiration:**
   - How long should saved positions persist? (suggested: 7 days)
   - Should there be a "clear history" option?

4. **Transcript list page:**
   - Should date be formatted or displayed as-is from database?
   - How to display transcripts with missing dates (some are year-only)?
   - Should topic tags be clickable filters on list page?

5. **Empty states:**
   - What actions to suggest when no transcripts match filter?
   - Should search suggest alternative queries or just show "no results"?

6. **Mobile responsiveness:**
   - Should sidebar be full-screen on mobile?
   - Should timestamp gutter be hidden on small screens?
   - Touch-friendly tap targets for search results?

7. **Testing approach:**
   - Manual testing sufficient, or implement automated tests?
   - How to generate 100 mock annotations for performance testing?

---

## 11. Recommended Implementation Order

### Phase 3 Task Breakdown

**Suggested sequence for planning:**

1. **Transcript list page** (READ-02)
   - Simplest component, no virtualization complexity
   - Establishes routing and navigation patterns
   - Tests database queries

2. **Basic reading view without virtualization** (READ-01 partial)
   - Paragraph rendering with timestamps and speakers
   - Typography and layout
   - Tests with small transcript (~500 paragraphs)

3. **Add virtualization** (READ-03)
   - Integrate TanStack Virtual
   - Test with 87K word transcript
   - Performance validation

4. **In-transcript search** (READ-04)
   - Search logic and highlighting
   - Sidebar panel
   - Scroll-to-match navigation

5. **Position memory** (polish task)
   - localStorage save/restore
   - Resume prompt UI

6. **Final polish:**
   - Empty states
   - Loading states
   - Error handling
   - Mobile responsiveness

**Rationale:** Build foundation first, then layer complexity. Virtualization is critical but easier to add once basic paragraph rendering works.

---

## 12. Sources

### Virtualization
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [React Virtual Framework Guide](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)
- [TanStack Virtual Dynamic Example](https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic)
- [From Lag to Lightning: How TanStack Virtual Optimizes 1000s of Items](https://medium.com/@sanjivchaudhary416/from-lag-to-lightning-how-tanstack-virtual-optimizes-1000s-of-items-smoothly-24f0998dc444)
- [React Virtuoso Official Site](https://virtuoso.dev/)
- [React Virtuoso Auto Resizing](https://virtuoso.dev/auto-resizing/)
- [Infinite Scrolling: react-window vs react-virtuoso](https://medium.com/@stuthineal/infinite-scrolling-made-easy-react-window-vs-react-virtuso-1fd786058a73)
- [Virtual Scrolling Core Principles in React](https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/)
- [How to Speed Up Long Lists with TanStack Virtual](https://blog.logrocket.com/speed-up-long-lists-tanstack-virtual/)
- [TanStack Virtual Dynamic Heights Discussion](https://github.com/TanStack/virtual/discussions/338)
- [Implementing Dynamic Row Heights in Virtualized TanStack Table](https://borstch.com/snippet/implementing-dynamic-row-heights-in-virtualized-tanstack-table)

### Search and Highlighting
- [react-highlight-words npm](https://www.npmjs.com/package/react-highlight-words)
- [react-highlight-words GitHub](https://github.com/bvaughn/react-highlight-words)
- [Building Real-time Search in React with Highlighting](https://medium.com/@dlrnjstjs/building-a-real-time-search-in-react-from-debouncing-to-highlighting-337001648414)
- [Search in Virtualized Lists Issue](https://github.com/bvaughn/react-virtualized/issues/1835)
- [React Autocomplete with Virtualized Results](https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972)
- [FlexSearch - Next-generation Full-text Search](https://github.com/nextapps-de/flexsearch)

### Position Memory
- [Persist Scroll Position with React Hooks](https://chrisfrew.in/blog/persist-and-remember-page-scroll-position-with-react-hooks/)
- [Save and Restore Scroll Position in React](https://gist.github.com/jeffijoe/510f6823ef809e3711ed307823b48c0a)
- [Restore Scroll Position in Next.js](https://gist.github.com/claus/992a5596d6532ac91b24abe24e10ae81)
- [Boost UX: Memorizing Scroll Position](https://medium.com/front-end-weekly/boost-user-experience-memorizing-scroll-position-with-javascript-2adfb6ca6c2b)
- [Implementing Scroll Restoration in React Apps](https://blog.logrocket.com/implementing-scroll-restoration-in-ecommerce-react-apps/)
- [Scroll Restoration in Next.js](https://dev.to/mmazzarolo/scroll-restoration-in-next-js-ckc)

### PostgreSQL Full-Text Search
- [Full-Text Search in PostgreSQL](https://www.paradedb.com/learn/search-in-postgresql/full-text-search)
- [PostgreSQL Full-Text Search Performance](https://iniakunhuda.medium.com/postgresql-full-text-search-a-powerful-alternative-to-elasticsearch-for-small-to-medium-d9524e001fe0)
- [PostgreSQL Documentation: Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [Implementing High-Performance Full Text Search in Postgres](https://risingwave.com/blog/implementing-high-performance-full-text-search-in-postgres/)
- [Full‑Text Search in Postgres with TypeScript](https://betterstack.com/community/guides/scaling-nodejs/full-text-search-in-postgres-with-typescript/)

### Next.js and Performance
- [Optimizing Next.js Performance](https://dev.to/bhargab/optimizing-performance-in-nextjs-and-reactjs-best-practices-and-strategies-1j2a)
- [Next.js Large Page Data Warning](https://nextjs.org/docs/messages/large-page-data)
- [Next.js 14 Infinite Scroll Optimization](https://medium.com/@sainianmol16/optimized-infinite-scroll-with-next-js-14-server-actions-and-react-query-f5256edc90b4)
- [Mastering Infinite Scroll in Next.js](https://medium.com/@tharunbalaji110/mastering-infinite-scroll-in-next-js-real-world-patterns-for-production-ready-performance-edcec6b758cd)

### React 19 and TanStack Integration
- [Harnessing TanStack React Virtual with React Hooks](https://dev.to/sheldonwelinga/harnessing-the-power-of-tanstackreact-virtual-with-react-hooks-a-step-by-step-guide-mgg)
- [React Server Components + TanStack Query: 2026 Power Duo](https://dev.to/krish_kakadiya_5f0eaf6342/react-server-components-tanstack-query-the-2026-data-fetching-power-duo-you-cant-ignore-21fj)

---

## Summary

**You have everything you need to plan Phase 3.**

**Key decisions:**
1. Use **TanStack Virtual** for virtualization (headless UI, React 19 compatible, dynamic heights)
2. Use **react-highlight-words** for search highlighting (simple, lightweight)
3. Implement **client-side search** with sidebar panel + in-text highlights
4. Use **localStorage + paragraph index** for position memory (resilient to content changes)
5. Leverage **existing PostgreSQL full-text search** for transcript list filtering
6. Build with **Next.js Server Components** for fast initial loads

**No infrastructure changes needed** - 2 small libraries added to existing stack.

**Critical testing:** Load 87K word transcript with 100 mock annotations, verify 30+ fps scrolling.

**Next step:** Write 03-PLAN.md with detailed task breakdown and implementation specs.
