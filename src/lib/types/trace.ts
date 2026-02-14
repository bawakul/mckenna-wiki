/**
 * Module Trace Types
 * TypeScript types for the module tracing feature
 */

import type { AnnotationSelector } from './annotation'

/**
 * Module trace as returned from module_traces view
 * Denormalized annotation data with transcript and module metadata
 */
export interface ModuleTrace {
  id: string
  module_id: string | null
  highlighted_text: string
  selector: AnnotationSelector
  start_paragraph_id: number
  end_paragraph_id: number
  annotation_created_at: string
  transcript_id: string
  transcript_title: string
  transcript_date: string | null  // Can be null for lectures with unknown dates
  module_name: string | null
  module_color: string | null
}
