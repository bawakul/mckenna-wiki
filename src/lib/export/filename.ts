import sanitize from 'sanitize-filename'

/**
 * Generate a safe filename for exports
 * Handles invalid characters, reserved names (CON, NUL), and adds timestamp
 */
export function generateSafeFilename(moduleName: string, extension: string): string {
  const safe = sanitize(moduleName, { replacement: '-' })
  const base = safe || 'export'
  const timestamp = new Date().toISOString().split('T')[0]
  return `${base}-${timestamp}.${extension}`
}
