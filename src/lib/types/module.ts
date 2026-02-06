import { z } from 'zod'

/**
 * Preset color palette for modules (muted/pastel colors)
 * These match Tailwind's color-100/200 shades for visual consistency
 */
export const PRESET_COLORS = [
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Pink', value: '#fae8ff' },
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Green', value: '#d1fae5' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Indigo', value: '#e0e7ff' },
  { name: 'Rose', value: '#fce7f3' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Gray', value: '#d4d4d8' },
  { name: 'Red', value: '#fca5a5' },
] as const

export type PresetColor = (typeof PRESET_COLORS)[number]['value']

/**
 * Zod schema for creating/updating a module
 * Validates input before database operations
 */
export const ModuleInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  notes: z.string().optional().default(''),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format')
    .default(PRESET_COLORS[0].value),
})

export type ModuleInput = z.infer<typeof ModuleInputSchema>

/**
 * Full module as stored in database
 */
export interface Module {
  id: string
  name: string
  notes: string | null
  color: string
  last_used_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Module with usage count (for delete confirmation UI)
 */
export interface ModuleWithUsageCount extends Module {
  highlight_count: number
}

/**
 * Soft character limit for module names (UI warning threshold)
 * Names longer than this will trigger a warning but not be blocked
 */
export const MODULE_NAME_SOFT_LIMIT = 40

/**
 * Check if name exceeds soft limit (for UI warning, not hard block)
 */
export function isNameOverSoftLimit(name: string): boolean {
  return name.length > MODULE_NAME_SOFT_LIMIT
}

/**
 * Get a random preset color (useful for default module creation)
 */
export function getRandomPresetColor(): PresetColor {
  const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length)
  return PRESET_COLORS[randomIndex].value
}
