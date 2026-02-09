/**
 * Annotation Types
 * TypeScript types for the annotation system matching W3C Web Annotation model
 */

// Context length for TextQuoteSelector prefix/suffix
export const SELECTOR_CONTEXT_LENGTH = 32

/**
 * W3C Text Quote Selector
 * Most robust selector - survives minor text edits
 * Uses surrounding context to locate text even if position changes
 */
export interface TextQuoteSelector {
  type: 'TextQuoteSelector'
  exact: string      // The highlighted text
  prefix: string     // Up to 32 chars before
  suffix: string     // Up to 32 chars after
}

/**
 * W3C Text Position Selector
 * Fast but fragile - breaks if text above changes
 * Used as fast-path before falling back to quote matching
 */
export interface TextPositionSelector {
  type: 'TextPositionSelector'
  start: number      // Character offset from document start
  end: number        // Character offset from document end
}

/**
 * Custom paragraph anchor (project-specific)
 * Survives edits in other paragraphs
 * Uses database paragraph IDs for stable anchoring
 */
export interface ParagraphAnchor {
  type: 'ParagraphAnchor'
  paragraphId: number
  startOffset: number  // Offset within paragraph text
  endOffset: number
}

/**
 * Combined selector for robust anchoring
 * Try each selector in order until one successfully re-anchors
 */
export interface AnnotationSelector {
  type: 'RangeSelector'
  refinedBy: (TextQuoteSelector | TextPositionSelector | ParagraphAnchor)[]
}

/**
 * Annotation as stored in database
 */
export interface Annotation {
  id: string
  transcript_id: string
  module_id: string | null
  selector: AnnotationSelector
  highlighted_text: string
  start_paragraph_id: number
  end_paragraph_id: number
  created_at: string
  updated_at: string
}

/**
 * Annotation with module data joined (for display)
 */
export interface AnnotationWithModule extends Annotation {
  module: {
    id: string
    name: string
    color: string
  } | null
}

/**
 * Input for creating new annotation
 */
export interface CreateAnnotationInput {
  transcript_id: string
  module_id?: string | null
  selector: AnnotationSelector
  highlighted_text: string
  start_paragraph_id: number
  end_paragraph_id: number
}

/**
 * Highlight info for rendering in paragraph
 * Simplified for performance - just what's needed to render
 */
export interface ParagraphHighlight {
  id: string
  startOffset: number
  endOffset: number
  color: string | null  // Module color, null = untagged (gray)
  moduleId: string | null
}
