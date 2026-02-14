/**
 * Module Trace Queries
 * Server-side query functions for module tracing feature
 */

import { createClient } from '@/lib/supabase/server'
import type { ModuleTrace } from '@/lib/types/trace'

/**
 * Get all traces for a specific module
 * Returns annotations with joined transcript and module metadata
 * Sorted chronologically (oldest transcripts first)
 */
export async function getModuleTraces(moduleId: string): Promise<ModuleTrace[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('module_traces')
    .select('*')
    .eq('module_id', moduleId)

  if (error) throw error
  return data || []
}

/**
 * Get module with passage count
 * Fetches module data and counts associated annotations in parallel
 */
export async function getModuleWithCount(moduleId: string) {
  const supabase = await createClient()

  const [moduleResult, countResult] = await Promise.all([
    supabase.from('modules').select('*').eq('id', moduleId).single(),
    supabase
      .from('annotations')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', moduleId)
  ])

  if (moduleResult.error) return null

  return {
    ...moduleResult.data,
    passage_count: countResult.count || 0
  }
}
