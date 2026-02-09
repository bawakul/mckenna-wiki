'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Annotation,
  AnnotationWithModule,
  CreateAnnotationInput,
} from '@/lib/types/annotation'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new annotation (highlight)
 */
export async function createAnnotation(
  input: CreateAnnotationInput
): Promise<ActionResult<Annotation>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('annotations')
    .insert({
      transcript_id: input.transcript_id,
      module_id: input.module_id || null,
      selector: input.selector,
      highlighted_text: input.highlighted_text,
      start_paragraph_id: input.start_paragraph_id,
      end_paragraph_id: input.end_paragraph_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create annotation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/transcripts/${input.transcript_id}`)
  return { success: true, data }
}

/**
 * Get all annotations for a transcript (with module data joined)
 */
export async function getAnnotationsForTranscript(
  transcriptId: string
): Promise<ActionResult<AnnotationWithModule[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('annotations')
    .select(`
      *,
      module:modules(id, name, color)
    `)
    .eq('transcript_id', transcriptId)
    .order('start_paragraph_id', { ascending: true })

  if (error) {
    console.error('Failed to fetch annotations:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as AnnotationWithModule[] }
}

/**
 * Get annotations for specific paragraphs (for viewport queries)
 * Used to fetch only annotations visible in current scroll position
 */
export async function getAnnotationsForParagraphs(
  transcriptId: string,
  paragraphIds: number[]
): Promise<ActionResult<AnnotationWithModule[]>> {
  if (paragraphIds.length === 0) {
    return { success: true, data: [] }
  }

  const supabase = await createClient()

  // Annotations where start OR end paragraph is in the list
  const { data, error } = await supabase
    .from('annotations')
    .select(`
      *,
      module:modules(id, name, color)
    `)
    .eq('transcript_id', transcriptId)
    .or(`start_paragraph_id.in.(${paragraphIds.join(',')}),end_paragraph_id.in.(${paragraphIds.join(',')})`)

  if (error) {
    console.error('Failed to fetch paragraph annotations:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as AnnotationWithModule[] }
}

/**
 * Update the module assigned to an annotation
 * Pass null to remove module (keep as untagged highlight)
 */
export async function updateAnnotationModule(
  annotationId: string,
  moduleId: string | null
): Promise<ActionResult<Annotation>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('annotations')
    .update({ module_id: moduleId })
    .eq('id', annotationId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update annotation module:', error)
    return { success: false, error: error.message }
  }

  // Revalidate the transcript page
  revalidatePath(`/transcripts/${data.transcript_id}`)
  return { success: true, data }
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(
  annotationId: string,
  transcriptId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('id', annotationId)

  if (error) {
    console.error('Failed to delete annotation:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/transcripts/${transcriptId}`)
  return { success: true, data: null }
}
