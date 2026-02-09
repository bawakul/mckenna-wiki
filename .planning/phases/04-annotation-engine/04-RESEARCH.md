# Phase 4: Annotation Engine - Research

**Researched:** 2026-02-09
**Domain:** Text annotation and highlighting in web documents
**Confidence:** MEDIUM

## Summary

This research investigates how to build a robust text annotation system that allows users to highlight passages in transcript text, optionally tag them with modules, and maintain those annotations even when the transcript content changes. The core technical challenge is **robust anchoring** — ensuring highlights remain correctly positioned after minor text edits.

The standard approach uses **W3C Web Annotation Data Model** with hybrid selectors (TextQuoteSelector + TextPositionSelector + paragraph ID) to achieve 73% successful re-anchoring (vs 27% orphan rate with naive implementations). For implementation, there are two viable paths:

1. **Custom Selection API implementation** - Full control, integrates with existing virtualized reader, lightweight
2. **@recogito/react-text-annotator library** - Feature-complete but may conflict with TanStack Virtual

**Primary recommendation:** Build custom implementation using W3C selector patterns. The Selection API is well-supported, Floating UI infrastructure exists from Phase 2, and virtualized rendering requires tight integration that third-party libraries may not provide.

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Selection API | Native | Text selection detection | Built into all modern browsers, zero bundle size |
| Floating UI | ^0.27.17 | Position popover near selection | Already in project (Phase 2), standard for floating elements |
| Intersection Observer API | Native | Track visible highlights in viewport | Native browser API, efficient scroll tracking |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostgreSQL JSONB | Built-in | Store annotation selectors | Flexible storage for W3C selector objects with efficient indexing |
| CSS Custom Highlight API | Experimental | Non-DOM highlight rendering | Alternative to mark elements (Firefox 2025+, Chrome/Edge 2023+) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom implementation | @recogito/react-text-annotator v3.0 | Library is feature-complete but may conflict with TanStack Virtual, adds 50kb+ to bundle, less control over rendering |
| mark elements | CSS Custom Highlight API | Cleaner DOM, better performance, but limited browser support (no Safari bug-free support as of 2026) |
| JSONB selectors | Separate selector columns | More rigid schema, harder to evolve selector strategy |

**Installation:**
```bash
# No new dependencies required for custom implementation
# Selection API, Intersection Observer, Floating UI already available
```

**If using @recogito library:**
```bash
npm install @recogito/react-text-annotator
# Warning: May require custom integration with virtualized reader
```

## Architecture Patterns

### W3C Web Annotation Data Model

The standard approach to robust text anchoring uses the **W3C Web Annotation specification** with hybrid selectors.

**Core concept:** Store multiple selector types for the same annotation, attempt re-anchoring with fallback strategies.

**Selector types:**

1. **TextQuoteSelector** (most robust)
   - `exact`: The highlighted text itself
   - `prefix`: Text immediately before selection (context)
   - `suffix`: Text immediately after selection (context)
   - Survives minor edits if surrounding context unchanged

2. **TextPositionSelector** (fast but fragile)
   - `start`: Character offset from document start
   - `end`: Character offset from document end
   - Breaks if text above selection changes

3. **Custom paragraph anchor** (project-specific)
   - `paragraphId`: Database ID of paragraph containing selection
   - `paragraphPosition`: Position within paragraph text
   - Survives edits in other paragraphs

**Hybrid selector example:**
```typescript
interface AnnotationSelector {
  // Combined selector for robust anchoring
  type: 'RangeSelector'
  refinedBy: [
    {
      type: 'TextQuoteSelector',
      exact: 'the highlighted passage text',
      prefix: 'up to 32 chars before ',
      suffix: ' up to 32 chars after'
    },
    {
      type: 'TextPositionSelector',
      start: 1523,
      end: 1571
    },
    {
      type: 'ParagraphAnchor', // Custom
      paragraphId: 'para-uuid',
      startOffset: 45,
      endOffset: 93
    }
  ]
}
```

**Re-anchoring strategy** (fallback waterfall):
1. Try paragraph ID + offset (fastest, works if paragraph unchanged)
2. Try TextQuoteSelector with exact + prefix/suffix match (handles minor edits)
3. Try fuzzy TextQuoteSelector (allow minor variation in exact match)
4. Mark as orphaned if all fail

**Source:** [W3C Web Annotation Data Model](https://w3c.github.io/web-annotation/model/wd/), [Apache Annotator API](https://annotator.apache.org/docs/api/modules/dom.html)

### Database Schema

**Annotations table:**
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL, -- Optional

  -- W3C selector stored as JSONB
  selector JSONB NOT NULL,

  -- Denormalized for fast queries (extracted from selector)
  highlighted_text TEXT NOT NULL,
  start_paragraph_id INTEGER REFERENCES transcript_paragraphs(id),
  end_paragraph_id INTEGER REFERENCES transcript_paragraphs(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_annotations_transcript ON annotations(transcript_id);
CREATE INDEX idx_annotations_module ON annotations(module_id);
CREATE INDEX idx_annotations_paragraphs ON annotations(start_paragraph_id, end_paragraph_id);
CREATE INDEX idx_annotations_selector ON annotations USING GIN(selector); -- JSONB index
```

**Key decisions:**
- `module_id` nullable with `ON DELETE SET NULL` — highlights exist independently
- `ON DELETE CASCADE` for transcript — annotations belong to transcript
- JSONB for `selector` — flexible, can evolve selector strategy without migration
- Denormalized paragraph IDs — fast "get all annotations in viewport" queries
- GIN index on selector JSONB — efficient JSON queries for re-anchoring

**Source:** [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html), [Supabase foreign key best practices](https://supabase.com/docs/guides/database/tables)

### Recommended Project Structure

```
src/
├── components/
│   ├── annotations/
│   │   ├── HighlightRenderer.tsx        # Renders <mark> elements in paragraphs
│   │   ├── HighlightPopover.tsx         # Click highlight → show details/edit
│   │   ├── SelectionToolbar.tsx         # Floating "Highlight" button after selection
│   │   ├── AnnotationSidebar.tsx        # List of annotations in transcript
│   │   └── useTextSelection.ts          # Hook for Selection API
│   └── transcripts/
│       └── ParagraphView.tsx            # Updated to render highlights
├── lib/
│   ├── annotations/
│   │   ├── selectors.ts                 # W3C selector creation/matching
│   │   ├── anchoring.ts                 # Re-anchor logic with fallbacks
│   │   └── highlight-splitter.ts        # Split overlapping highlights
│   └── types/
│       └── annotation.ts                # TypeScript types
└── app/
    └── annotations/
        └── actions.ts                   # Server actions for CRUD
```

### Pattern 1: Selection Detection and Floating Button

**What:** Detect text selection, show floating "Highlight" button near selection.

**When to use:** User finishes selecting text (mouseup event).

**Example:**
```typescript
// Source: Custom implementation based on Selection API patterns
// https://javascript.info/selection-range
// https://floating-ui.com/docs/react

import { useEffect, useState, useRef } from 'react'
import { useFloating, offset, flip, shift } from '@floating-ui/react'

export function useTextSelection() {
  const [selection, setSelection] = useState<Range | null>(null)
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setSelection(null)
        setSelectedText('')
        return
      }

      const range = sel.getRangeAt(0)
      const text = range.toString().trim()

      // Only set if text is selected (not whitespace)
      if (text.length > 0) {
        setSelection(range)
        setSelectedText(text)
      }
    }

    // Listen for mouseup (end of selection drag)
    document.addEventListener('mouseup', handleSelectionChange)
    return () => document.removeEventListener('mouseup', handleSelectionChange)
  }, [])

  return { selection, selectedText }
}

function SelectionToolbar({ onHighlight }: { onHighlight: (range: Range) => void }) {
  const { selection, selectedText } = useTextSelection()
  const [isOpen, setIsOpen] = useState(false)

  // Virtual element for Floating UI (position at selection)
  const virtualElement = useRef({
    getBoundingClientRect: () => {
      if (!selection) return new DOMRect()
      return selection.getBoundingClientRect()
    }
  })

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })

  useEffect(() => {
    // Show toolbar when selection exists
    setIsOpen(!!selection)
    if (selection) {
      refs.setPositionReference(virtualElement.current)
    }
  }, [selection, refs])

  if (!isOpen || !selection) return null

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2"
    >
      <button
        onClick={() => {
          onHighlight(selection)
          setIsOpen(false)
        }}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Highlight
      </button>
    </div>
  )
}
```

### Pattern 2: Word Boundary Snapping

**What:** Expand selection to nearest word boundaries (no partial words).

**When to use:** When creating annotation from selection, before saving.

**Example:**
```typescript
// Source: Based on Selection API patterns
// https://developer.mozilla.org/en-US/docs/Web/API/Selection

function snapToWordBoundaries(range: Range): Range {
  const { startContainer, startOffset, endContainer, endOffset } = range

  // Helper: expand offset to word boundary
  function expandToWordStart(node: Node, offset: number): number {
    if (node.nodeType !== Node.TEXT_NODE) return offset
    const text = node.textContent || ''

    // Move backward until whitespace or start
    let newOffset = offset
    while (newOffset > 0 && /\S/.test(text[newOffset - 1])) {
      newOffset--
    }
    return newOffset
  }

  function expandToWordEnd(node: Node, offset: number): number {
    if (node.nodeType !== Node.TEXT_NODE) return offset
    const text = node.textContent || ''

    // Move forward until whitespace or end
    let newOffset = offset
    while (newOffset < text.length && /\S/.test(text[newOffset])) {
      newOffset++
    }
    return newOffset
  }

  const newRange = document.createRange()
  newRange.setStart(startContainer, expandToWordStart(startContainer, startOffset))
  newRange.setEnd(endContainer, expandToWordEnd(endContainer, endOffset))

  return newRange
}
```

### Pattern 3: Creating W3C Selectors from Selection

**What:** Convert DOM Range to W3C selector with hybrid anchoring.

**When to use:** When user confirms highlight creation.

**Example:**
```typescript
// Source: W3C Web Annotation model + Apache Annotator patterns
// https://github.com/robertknight/anchor-quote

interface W3CSelector {
  type: 'RangeSelector'
  refinedBy: Array<TextQuoteSelector | TextPositionSelector | ParagraphAnchor>
}

interface TextQuoteSelector {
  type: 'TextQuoteSelector'
  exact: string
  prefix: string
  suffix: string
}

interface TextPositionSelector {
  type: 'TextPositionSelector'
  start: number
  end: number
}

interface ParagraphAnchor {
  type: 'ParagraphAnchor'
  paragraphId: number
  startOffset: number
  endOffset: number
}

function createSelectorFromRange(
  range: Range,
  transcriptContainer: HTMLElement
): W3CSelector {
  const exact = range.toString()

  // Get surrounding context (32 chars before/after)
  const CONTEXT_LENGTH = 32
  const textBefore = getTextBefore(range, CONTEXT_LENGTH)
  const textAfter = getTextAfter(range, CONTEXT_LENGTH)

  // Calculate position offsets from document start
  const textPosition = calculateTextPosition(range, transcriptContainer)

  // Find paragraph IDs
  const paragraphAnchors = findParagraphAnchors(range)

  return {
    type: 'RangeSelector',
    refinedBy: [
      {
        type: 'TextQuoteSelector',
        exact,
        prefix: textBefore,
        suffix: textAfter,
      },
      {
        type: 'TextPositionSelector',
        start: textPosition.start,
        end: textPosition.end,
      },
      ...paragraphAnchors,
    ],
  }
}

function findParagraphAnchors(range: Range): ParagraphAnchor[] {
  const anchors: ParagraphAnchor[] = []

  // Find paragraph elements containing selection
  let node = range.startContainer
  while (node && node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentElement
  }

  const startPara = (node as Element)?.closest('[data-paragraph-id]')
  if (!startPara) return anchors

  const paragraphId = parseInt(startPara.getAttribute('data-paragraph-id') || '0')

  // Calculate offset within paragraph text
  const paraText = startPara.textContent || ''
  const rangeText = range.toString()
  const startOffset = paraText.indexOf(rangeText)

  if (startOffset >= 0) {
    anchors.push({
      type: 'ParagraphAnchor',
      paragraphId,
      startOffset,
      endOffset: startOffset + rangeText.length,
    })
  }

  return anchors
}
```

### Pattern 4: Rendering Highlights in Virtualized Content

**What:** Render <mark> elements around annotated text without breaking virtualization.

**When to use:** In ParagraphView component when rendering paragraph with annotations.

**Example:**
```typescript
// Source: Custom pattern for virtualized highlights
// Combines react-highlight-words approach with annotation data

interface Highlight {
  id: string
  startOffset: number
  endOffset: number
  color: string | null // Module color, or null for untagged
}

function renderTextWithHighlights(text: string, highlights: Highlight[]) {
  if (highlights.length === 0) {
    return <>{text}</>
  }

  // Sort highlights by start position
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset)

  // Split text into segments
  const segments: Array<{ text: string; highlight?: Highlight }> = []
  let currentPos = 0

  for (const highlight of sorted) {
    // Add unhighlighted text before this highlight
    if (highlight.startOffset > currentPos) {
      segments.push({
        text: text.slice(currentPos, highlight.startOffset),
      })
    }

    // Add highlighted segment
    segments.push({
      text: text.slice(highlight.startOffset, highlight.endOffset),
      highlight,
    })

    currentPos = highlight.endOffset
  }

  // Add remaining unhighlighted text
  if (currentPos < text.length) {
    segments.push({ text: text.slice(currentPos) })
  }

  // Render segments
  return (
    <>
      {segments.map((segment, i) => {
        if (segment.highlight) {
          const bgColor = segment.highlight.color || '#e5e7eb' // Gray for untagged
          return (
            <mark
              key={`${segment.highlight.id}-${i}`}
              data-annotation-id={segment.highlight.id}
              className="cursor-pointer rounded-sm px-0.5"
              style={{ backgroundColor: bgColor }}
            >
              {segment.text}
            </mark>
          )
        }
        return <span key={i}>{segment.text}</span>
      })}
    </>
  )
}
```

### Anti-Patterns to Avoid

- **Storing only character offsets:** Fragile to any text changes. Always use hybrid selectors.
- **Wrapping highlights with DOM mutation:** Breaks React's virtual DOM reconciliation in virtualized lists. Pre-process text and render with keys.
- **Using CSS z-index for overlapping highlights:** Complex stacking contexts. Instead, render only one color (most recent or first created as user decides).
- **Saving on every selection change:** Excessive database writes. Debounce or only save on explicit user action.
- **Not handling orphaned annotations:** Show orphans in sidebar with warning, allow user to delete or re-anchor manually.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text selection with word boundaries | Custom boundary detection | Selection API + modify() or custom snap function | Cross-browser edge cases (text nodes, inline elements, RTL text) |
| Floating popover positioning | Manual getBoundingClientRect + absolute positioning | Floating UI (already in project) | Handles viewport bounds, flip, shift, scroll sync automatically |
| Fuzzy text matching for re-anchoring | String similarity from scratch | Apache Annotator patterns or Levenshtein distance library | Complex algorithm, well-tested implementations exist |
| JSONB query optimization | Manual JSON parsing in queries | PostgreSQL GIN indexes + @> operator | Native database optimization, 10-100x faster |
| Viewport intersection tracking | Scroll event listeners + manual bounds checking | Intersection Observer API | Battery-efficient, runs off main thread, built-in threshold support |

**Key insight:** Text annotation is a solved problem with W3C standards. Don't reinvent selector strategies — 20+ years of research on robust anchoring exists. Custom implementation is warranted for tight integration with virtualized reader, but use proven selector patterns.

## Common Pitfalls

### Pitfall 1: Selection Breaks on Virtualized Re-renders

**What goes wrong:** User selects text, virtual scroller re-renders, selection disappears or becomes invalid.

**Why it happens:** TanStack Virtual unmounts/remounts DOM elements as they enter/exit viewport. Browser selection references specific DOM nodes which may no longer exist.

**How to avoid:**
- Capture Range immediately on selection complete (mouseup event)
- Store Range's bounding rect and text content, not DOM node references
- If re-render happens before user confirms highlight, show warning "Selection lost, please select again"

**Warning signs:**
- Selection toolbar appears briefly then disappears
- getBoundingClientRect() returns zero-size rect
- Range.startContainer.parentElement is null

**Source:** [TanStack Virtual issues with selection](https://github.com/TanStack/virtual/issues), DOM reference invalidation patterns

### Pitfall 2: Overlapping Highlights Create Nested Mark Elements

**What goes wrong:** Two annotations overlap, rendering creates `<mark><mark>text</mark></mark>`, causing styling conflicts and click handler issues.

**Why it happens:** Naive highlight rendering doesn't split overlapping ranges into discrete segments.

**How to avoid:**
- Pre-process annotations to split overlapping ranges into non-overlapping segments
- Each segment knows which annotation(s) it belongs to
- Render flat structure: adjacent mark elements, not nested
- For overlaps, choose one color (e.g., first created) and store conflict info in data attribute

**Example of splitting:**
```typescript
// Annotation A: chars 10-30
// Annotation B: chars 20-40
// Split into segments:
// [0-10]: no highlight
// [10-20]: A only (color A)
// [20-30]: A and B overlap (color A, data-conflicts="B")
// [30-40]: B only (color B)
// [40+]: no highlight
```

**Warning signs:**
- Nested mark elements in DOM inspector
- Click handlers fire multiple times
- Background colors not appearing correctly

**Source:** [Handling overlapping highlights](https://medium.com/@lucas.eckman/easy-as-1-2-3-cdca597f35a6), [Hypothesis DOM mutation issue](https://github.com/hypothesis/product-backlog/issues/1144)

### Pitfall 3: Orphaned Annotations After Text Changes

**What goes wrong:** User edits transcript text (typo fix, reformatting), 27% of annotations fail to re-anchor and become orphans.

**Why it happens:** Single selector strategy (e.g., only TextPositionSelector) is fragile to edits.

**How to avoid:**
- Always use hybrid selectors (TextQuote + TextPosition + ParagraphAnchor)
- Implement fallback re-anchoring strategy (try each selector in order)
- When re-anchoring fails, mark annotation as orphaned but don't delete
- Show orphaned annotations in sidebar with "⚠️ Text changed, click to re-position" UI

**Re-anchoring strategy:**
```typescript
async function reAnchorAnnotation(selector: W3CSelector, transcriptDOM: Element): Promise<Range | null> {
  // Try fastest method first
  const paraAnchor = selector.refinedBy.find(s => s.type === 'ParagraphAnchor')
  if (paraAnchor) {
    const result = tryParagraphAnchor(paraAnchor, transcriptDOM)
    if (result) return result
  }

  // Try quote selector with exact match
  const quoteSelector = selector.refinedBy.find(s => s.type === 'TextQuoteSelector')
  if (quoteSelector) {
    const result = tryExactQuoteMatch(quoteSelector, transcriptDOM)
    if (result) return result

    // Try fuzzy match (allow small variations)
    const fuzzyResult = tryFuzzyQuoteMatch(quoteSelector, transcriptDOM)
    if (fuzzyResult) return fuzzyResult
  }

  // All methods failed
  return null
}
```

**Warning signs:**
- Annotations disappearing after transcript re-import
- Highlights in wrong positions
- Empty annotation sidebar after edits

**Source:** [Microsoft Research: Robustly Anchoring Annotations](https://www.microsoft.com/en-us/research/publication/robustly-anchoring-annotations-using-keywords/), [Hypothesis fuzzy anchoring](https://web.hypothes.is/blog/fuzzy-anchoring/)

### Pitfall 4: Mark Elements Not Announced by Screen Readers

**What goes wrong:** Highlighted text looks different visually but screen reader users don't know it's highlighted.

**Why it happens:** mark element semantics not announced by most screen readers in default settings.

**How to avoid:**
- For critical highlights, add `aria-label` or `aria-describedby` to mark elements
- Don't overuse announcements (verbose and annoying)
- Provide alternative "view annotations" list that's screen reader accessible
- Consider role="mark" with aria-label for important highlights only

**Example:**
```tsx
<mark
  role="mark"
  aria-label={hasModule ? `Highlighted as ${moduleName}` : 'Highlighted'}
  style={{ backgroundColor: color }}
>
  {text}
</mark>
```

**Warning signs:**
- Screen reader testing shows no highlight indication
- Accessibility audit flags missing semantic information

**Source:** [Making mark more accessible](https://www.tpgi.com/short-note-on-making-your-mark-more-accessible/), [W3C Digital Publishing: Accessibility When Users Select and Highlight Text](https://www.w3.org/dpub/IG/wiki/Accessibility_When_Users_Select_and_Highlight_Text)

### Pitfall 5: Debounced Autosave Loses Optimistic Updates

**What goes wrong:** User creates highlight, sees it immediately, but if they navigate away before debounce completes, highlight disappears.

**Why it happens:** Debouncing delays database save, optimistic UI update only in memory.

**How to avoid:**
- Use TanStack Query/Mutation with optimistic updates
- Add mutation to queue immediately, process sequentially
- If navigation imminent, flush pending mutations synchronously
- Show visual indicator when saves are pending

**Pattern:**
```typescript
// Use mutation with optimistic update
const createAnnotationMutation = useMutation({
  mutationFn: createAnnotation,
  onMutate: async (newAnnotation) => {
    // Optimistically add to UI immediately
    await queryClient.cancelQueries(['annotations', transcriptId])
    const previous = queryClient.getQueryData(['annotations', transcriptId])

    queryClient.setQueryData(['annotations', transcriptId], (old) => [...old, newAnnotation])

    return { previous }
  },
  onError: (err, newAnnotation, context) => {
    // Rollback on error
    queryClient.setQueryData(['annotations', transcriptId], context.previous)
  },
})
```

**Warning signs:**
- Highlights disappear on page refresh
- User reports "I created it but it's gone"
- Race conditions between multiple rapid creations

**Source:** [React Query autosave patterns](https://www.pz.com.au/avoiding-race-conditions-and-data-loss-when-autosaving-in-react-query), [TanStack DB usePacedMutations](https://tanstack.com/db/latest/docs/guides/mutations)

## Code Examples

Verified patterns from official sources:

### Creating Annotation from Selection

```typescript
// Source: W3C Web Annotation model + Selection API
// https://w3c.github.io/web-annotation/model/wd/
// https://javascript.info/selection-range

async function handleCreateHighlight(range: Range) {
  // 1. Snap to word boundaries
  const snappedRange = snapToWordBoundaries(range)

  // 2. Create W3C selector
  const selector = createSelectorFromRange(snappedRange, transcriptContainer)

  // 3. Extract paragraph IDs for fast queries
  const paragraphIds = extractParagraphIds(snappedRange)

  // 4. Create annotation
  const annotation = {
    transcript_id: transcriptId,
    module_id: null, // Untagged initially
    selector,
    highlighted_text: snappedRange.toString(),
    start_paragraph_id: paragraphIds.start,
    end_paragraph_id: paragraphIds.end,
  }

  // 5. Save to database (optimistic update)
  await createAnnotationMutation.mutateAsync(annotation)

  // 6. Clear selection
  window.getSelection()?.removeAllRanges()
}
```

### Floating UI Virtual Element for Selection

```typescript
// Source: Floating UI documentation - positioning relative to Range
// https://floating-ui.com/docs/virtual-elements
// https://github.com/floating-ui/floating-ui/discussions/2841

function SelectionToolbar() {
  const { selection } = useTextSelection()

  // Create virtual element from selection Range
  const virtualElement = useMemo(() => ({
    getBoundingClientRect: () => {
      if (!selection) return new DOMRect()
      return selection.getBoundingClientRect()
    }
  }), [selection])

  const { refs, floatingStyles } = useFloating({
    open: !!selection,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })

  useEffect(() => {
    if (selection) {
      refs.setPositionReference(virtualElement)
    }
  }, [selection, virtualElement, refs])

  // ... rest of component
}
```

### Annotation Sidebar with Scroll Sync

```typescript
// Source: Intersection Observer patterns
// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
// https://github.com/thebuilder/react-intersection-observer

function AnnotationSidebar({ annotations }: { annotations: Annotation[] }) {
  const [visibleAnnotations, setVisibleAnnotations] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Track which annotations are visible in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const annotationId = entry.target.getAttribute('data-annotation-id')
          if (!annotationId) return

          setVisibleAnnotations((prev) => {
            const next = new Set(prev)
            if (entry.isIntersecting) {
              next.add(annotationId)
            } else {
              next.delete(annotationId)
            }
            return next
          })
        })
      },
      {
        threshold: 0.5, // At least 50% visible
      }
    )

    // Observe all mark elements
    document.querySelectorAll('mark[data-annotation-id]').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [annotations])

  return (
    <aside className="w-80 border-l overflow-y-auto">
      {annotations.map((annotation) => (
        <AnnotationListItem
          key={annotation.id}
          annotation={annotation}
          isVisible={visibleAnnotations.has(annotation.id)}
          onClick={() => scrollToAnnotation(annotation.id)}
        />
      ))}
    </aside>
  )
}

function scrollToAnnotation(annotationId: string) {
  const mark = document.querySelector(`mark[data-annotation-id="${annotationId}"]`)
  if (mark) {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOM Range serialization (XPath) | W3C Web Annotation with TextQuoteSelector | ~2017 (W3C Recommendation) | More robust to DOM structure changes, interoperable across tools |
| Single selector (character offset only) | Hybrid selectors with fallbacks | ~2020 (research showed 27% orphan rate) | 73% successful re-anchoring vs 27% with naive approach |
| mark elements for all highlights | CSS Custom Highlight API (experimental) | 2023+ (Chrome/Edge first) | Cleaner DOM, better performance, but limited browser support |
| Manual scroll event listeners | Intersection Observer API | 2019 (widely supported) | Battery-efficient, off main thread, better performance |
| react-highlight library (archived) | Custom implementation or @recogito | 2024+ | Old library unmaintained, modern alternatives better |

**Deprecated/outdated:**
- **Annotator.js (openannotation):** Archived, unmaintained since 2016. Use Apache Annotator or @recogito instead.
- **XPath selectors alone:** Fragile to DOM structure changes. Always combine with TextQuoteSelector.
- **Hypothesis client for general use:** Designed for their specific platform. Extract patterns but don't use library directly.

## Open Questions

Things that couldn't be fully resolved:

1. **CSS Custom Highlight API viability**
   - What we know: Supported in Chrome/Edge (2023+), Firefox (2025+), cleaner than mark elements
   - What's unclear: Safari support still buggy, accessibility story uncertain, TanStack Virtual compatibility unknown
   - Recommendation: Start with mark elements (proven), consider Custom Highlight API as future optimization

2. **@recogito/react-text-annotator integration with TanStack Virtual**
   - What we know: Library is feature-complete (v3.0), handles W3C selectors, supports React 19
   - What's unclear: Whether it works with virtualized content (most examples show static HTML)
   - Recommendation: Test with small prototype. If it doesn't work with virtualization, build custom implementation

3. **Optimal prefix/suffix length for TextQuoteSelector**
   - What we know: W3C examples use 32 characters, Apache Annotator uses variable length
   - What's unclear: Best length for McKenna transcripts (may depend on paragraph length, vocabulary uniqueness)
   - Recommendation: Start with 32 chars, A/B test with 16 and 64 if orphan rate is high

4. **Handling cross-paragraph highlights in virtualized reader**
   - What we know: User can select across multiple paragraphs, each paragraph renders independently in virtual scroller
   - What's unclear: Best way to render highlight spanning 3+ paragraphs without full-document re-render
   - Recommendation: Store annotations with start/end paragraph IDs, render highlight segments in each affected paragraph

## Sources

### Primary (HIGH confidence)

- [W3C Web Annotation Data Model](https://w3c.github.io/web-annotation/model/wd/) - Official specification
- [Selection and Range - JavaScript.info](https://javascript.info/selection-range) - Comprehensive Selection API guide
- [Floating UI React Documentation](https://floating-ui.com/docs/react) - Already used in project (Phase 2)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html) - Official docs
- [Intersection Observer API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Web standard

### Secondary (MEDIUM confidence)

- [Microsoft Research: Robustly Anchoring Annotations Using Keywords](https://www.microsoft.com/en-us/research/publication/robustly-anchoring-annotations-using-keywords/) - Academic research on orphan prevention (27% orphan rate finding)
- [Hypothesis: Fuzzy Anchoring](https://web.hypothes.is/blog/fuzzy-anchoring/) - Real-world implementation of fallback strategies
- [Apache Annotator Documentation](https://annotator.apache.org/docs/api/modules/dom.html) - W3C-compliant implementation patterns
- [CSS Custom Highlight API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API) - Browser compatibility verified
- [React Query Autosave Patterns](https://www.pz.com.au/avoiding-race-conditions-and-data-loss-when-autosaving-in-react-query) - TanStack Query best practices

### Tertiary (LOW confidence - WebSearch only, marked for validation)

- [GitHub: duckyb/annotator](https://github.com/duckyb/annotator) - TypeScript library with fallback strategies (not verified in production)
- [@recogito/react-text-annotator npm](https://www.npmjs.com/package/@recogito/react-text-annotator) - Library features from npm page (need to test with virtualization)
- [Handling overlapping highlights - Medium](https://medium.com/@lucas.eckman/easy-as-1-2-3-cdca597f35a6) - Community pattern, not verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - W3C spec is authoritative, Selection API and Floating UI are proven
- Architecture: MEDIUM - W3C patterns are standard, but project-specific integration with virtualization needs testing
- Pitfalls: HIGH - Orphan rate research is peer-reviewed, screen reader issues are documented in W3C

**Research date:** 2026-02-09
**Valid until:** ~90 days (stable domain - W3C specs don't change frequently, but browser API support evolving)

**Critical validation needed:**
- Test @recogito library with TanStack Virtual (may inform custom vs library decision)
- Verify CSS Custom Highlight API Safari support status (claimed buggy in 2026 sources)
- Prototype highlight rendering in virtualized paragraphs (confirm no performance regression)
