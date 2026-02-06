'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ModuleInputSchema, PRESET_COLORS, type Module, type ModuleWithUsageCount } from '@/lib/types/module'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Create a new module
 */
export async function createModule(formData: FormData): Promise<ActionResult<Module>> {
  // Parse and validate input
  const rawInput = {
    name: formData.get('name'),
    notes: formData.get('notes') || '',
    color: formData.get('color') || PRESET_COLORS[0].value,
  }

  const parsed = ModuleInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .insert({
      name: parsed.data.name,
      notes: parsed.data.notes || null,
      color: parsed.data.color,
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation (duplicate name)
    if (error.code === '23505') {
      return {
        success: false,
        error: 'A module with this name already exists',
        fieldErrors: { name: ['A module with this name already exists'] },
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/modules')
  return { success: true, data }
}

/**
 * Update an existing module
 */
export async function updateModule(
  id: string,
  formData: FormData
): Promise<ActionResult<Module>> {
  const rawInput = {
    name: formData.get('name'),
    notes: formData.get('notes') || '',
    color: formData.get('color'),
  }

  const parsed = ModuleInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .update({
      name: parsed.data.name,
      notes: parsed.data.notes || null,
      color: parsed.data.color,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'A module with this name already exists',
        fieldErrors: { name: ['A module with this name already exists'] },
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/modules')
  revalidatePath(`/modules/${id}`)
  return { success: true, data }
}

/**
 * Get module with count of highlights that reference it
 * Used before deletion to warn user of affected highlights
 */
export async function getModuleWithUsageCount(
  id: string
): Promise<ActionResult<ModuleWithUsageCount>> {
  const supabase = await createClient()

  // Get module
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (moduleError) {
    return { success: false, error: moduleError.message }
  }

  // Count highlights referencing this module
  // Note: highlights table doesn't exist yet (Phase 4), so return 0 for now
  // When highlights table exists, use:
  // const { count } = await supabase
  //   .from('highlights')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('module_id', id)
  const highlight_count = 0

  return {
    success: true,
    data: { ...module, highlight_count },
  }
}

/**
 * Delete a module
 * Highlights that referenced this module will have their module_id set to NULL
 * (handled by database ON DELETE SET NULL when highlights table exists)
 */
export async function deleteModule(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/modules')
  return { success: true, data: null }
}

/**
 * Update module's last_used_at timestamp
 * Called when a highlight is tagged with this module
 */
export async function touchModuleLastUsed(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('modules')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id)

  // Don't revalidate - this is a background operation
}

/**
 * Get all modules sorted by last_used_at (recently used first)
 * Used by the floating selector during reading
 */
export async function getModulesSortedByRecent(): Promise<ActionResult<Module[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data ?? [] }
}
