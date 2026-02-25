import type { ParagraphHighlight, AnnotationWithModule, ParagraphAnchor } from '@/lib/types/annotation'

/**
 * A segment of text with optional highlight information
 */
interface TextSegment {
  text: string
  highlight?: ParagraphHighlight
}

/**
 * Split text into segments based on highlight ranges
 * Handles non-overlapping highlights by sorting and splitting
 */
export function splitIntoSegments(
  text: string,
  highlights: ParagraphHighlight[]
): TextSegment[] {
  if (highlights.length === 0) {
    return [{ text }]
  }

  // Sort highlights by startOffset (earliest first)
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset)

  const segments: TextSegment[] = []
  let currentPos = 0

  for (const highlight of sorted) {
    // Clamp offsets to valid text bounds
    const start = Math.max(0, Math.min(highlight.startOffset, text.length))
    const end = Math.max(start, Math.min(highlight.endOffset, text.length))

    // Add unhighlighted text before this highlight
    if (start > currentPos) {
      segments.push({
        text: text.slice(currentPos, start),
      })
    }

    // Add highlighted segment (skip if empty)
    if (end > start) {
      segments.push({
        text: text.slice(start, end),
        highlight,
      })
    }

    currentPos = Math.max(currentPos, end)
  }

  // Add remaining text after last highlight
  if (currentPos < text.length) {
    segments.push({
      text: text.slice(currentPos),
    })
  }

  return segments
}

/**
 * Get the background color class for a highlight
 * Untagged highlights: gray-200 (#e5e7eb)
 * Tagged highlights: use module color with transparency
 */
function getHighlightStyle(color: string | null): React.CSSProperties {
  if (!color) {
    // Untagged: neutral gray background
    return { backgroundColor: '#e5e7eb' }
  }
  // Tagged: module color with some transparency for readability
  // Convert hex to rgba with 40% opacity
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.35)` }
}

/**
 * Render text with highlight marks
 * Returns React elements with <mark> tags for highlighted portions
 */
export function renderTextWithHighlights(
  text: string,
  highlights: ParagraphHighlight[],
  onHighlightClick?: (annotationId: string) => void
): React.ReactNode {
  const segments = splitIntoSegments(text, highlights)

  return segments.map((segment, index) => {
    if (!segment.highlight) {
      // Plain text segment
      return <span key={index}>{segment.text}</span>
    }

    // Highlighted segment with mark element
    return (
      <mark
        key={index}
        data-annotation-id={segment.highlight.id}
        style={{
          ...getHighlightStyle(segment.highlight.color),
          cursor: onHighlightClick ? 'pointer' : 'default',
          borderRadius: '2px',
          padding: '0 1px',
        }}
        onClick={onHighlightClick ? () => onHighlightClick(segment.highlight!.id) : undefined}
      >
        {segment.text}
      </mark>
    )
  })
}

/**
 * Extract ParagraphHighlight data from an annotation for a specific paragraph
 * Returns null if the annotation doesn't apply to this paragraph
 */
export function getHighlightForParagraph(
  annotation: AnnotationWithModule,
  paragraphId: number
): ParagraphHighlight | null {
  // Check if this paragraph is within the annotation's range
  if (paragraphId < annotation.start_paragraph_id || paragraphId > annotation.end_paragraph_id) {
    return null
  }

  const selector = annotation.selector
  if (!selector || selector.type !== 'RangeSelector' || !selector.refinedBy) {
    return null
  }

  // First try: look for explicit ParagraphAnchor for this paragraph
  for (const refined of selector.refinedBy) {
    if (refined.type === 'ParagraphAnchor' && (refined as ParagraphAnchor).paragraphId === paragraphId) {
      const anchor = refined as ParagraphAnchor
      return {
        id: annotation.id,
        startOffset: anchor.startOffset,
        endOffset: anchor.endOffset,
        color: annotation.module?.color ?? null,
        moduleId: annotation.module_id,
      }
    }
  }

  // Fallback for middle paragraphs without explicit ParagraphAnchor
  // Supports both new annotations (with explicit middle anchors) and legacy
  // multi-paragraph annotations created before this plan.
  const isMiddle =
    annotation.start_paragraph_id !== annotation.end_paragraph_id &&
    paragraphId > annotation.start_paragraph_id &&
    paragraphId < annotation.end_paragraph_id

  if (isMiddle) {
    // Full paragraph highlight — endOffset 999999 is safely clamped to
    // text.length by splitIntoSegments: Math.min(highlight.endOffset, text.length)
    return {
      id: annotation.id,
      startOffset: 0,
      endOffset: 999999,
      color: annotation.module?.color ?? null,
      moduleId: annotation.module_id,
    }
  }

  return null
}

/**
 * Get all highlights for a specific paragraph from a list of annotations
 */
export function getHighlightsForParagraph(
  annotations: AnnotationWithModule[],
  paragraphId: number
): ParagraphHighlight[] {
  const highlights: ParagraphHighlight[] = []

  for (const annotation of annotations) {
    const highlight = getHighlightForParagraph(annotation, paragraphId)
    if (highlight) {
      highlights.push(highlight)
    }
  }

  return highlights
}
