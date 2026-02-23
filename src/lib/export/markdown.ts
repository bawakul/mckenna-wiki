import type { ModuleTrace } from '@/lib/types/trace'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Generate markdown export with YAML frontmatter
 * Passages grouped by lecture, chronologically ordered
 */
export function generateMarkdown(module: { name: string; color: string; notes: string | null }, traces: ModuleTrace[]): string {
  // YAML frontmatter (must be first, triple-dash delimited)
  const frontmatter = `---
module: ${module.name}
color: "${module.color}"
exported: ${new Date().toISOString()}
passage_count: ${traces.length}
---

# ${module.name}

${module.notes || 'No description provided.'}

---

`

  // Group traces by transcript (already sorted chronologically from view)
  const byTranscript = new Map<string, ModuleTrace[]>()
  for (const trace of traces) {
    const key = trace.transcript_id
    if (!byTranscript.has(key)) {
      byTranscript.set(key, [])
    }
    byTranscript.get(key)!.push(trace)
  }

  // Generate sections (traces already in chronological order)
  const sections = Array.from(byTranscript.values()).map(lectureTraces => {
    const first = lectureTraces[0]
    const dateStr = formatDate(first.transcript_date)
    const header = dateStr
      ? `## ${first.transcript_title} (${dateStr})`
      : `## ${first.transcript_title}`

    const passages = lectureTraces.map(t => {
      return `> ${t.highlighted_text}\n`
    }).join('\n')

    return `${header}\n\n${passages}`
  })

  return frontmatter + sections.join('\n---\n\n')
}
