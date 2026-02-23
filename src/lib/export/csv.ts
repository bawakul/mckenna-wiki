import type { ModuleTrace } from '@/lib/types/trace'

/**
 * Escape CSV field per RFC 4180
 * Fields containing comma, quote, or newline must be quoted
 * Quotes inside fields are escaped by doubling ("")
 */
function escapeCSVField(value: string | null): string {
  const str = value ?? 'N/A'
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatCSVDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  // Parse and format to "Month Year"
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Generate RFC 4180 compliant CSV for module traces
 * Columns: module, passage, lecture_title, date, timestamp
 */
export function generateCSV(moduleName: string, traces: ModuleTrace[]): string {
  const header = ['module', 'passage', 'lecture_title', 'date', 'timestamp']

  const rows = traces.map(t => [
    moduleName,
    t.highlighted_text,
    t.transcript_title,
    formatCSVDate(t.transcript_date),
    'N/A' // Timestamp not stored in selector - use N/A placeholder
  ])

  const allRows = [header, ...rows]
  return allRows
    .map(row => row.map(escapeCSVField).join(','))
    .join('\n')
}
