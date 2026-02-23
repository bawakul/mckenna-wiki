# Phase 6: Export & Polish - Research

**Researched:** 2026-02-23
**Domain:** File generation and download (Markdown, CSV, ZIP) in Next.js 15
**Confidence:** HIGH

## Summary

Phase 6 requires exporting tagged passages from a Next.js 15 application in two formats: Markdown (with YAML frontmatter) and CSV. Exports can be triggered from individual module trace pages or bulk exported from the modules list. The standard approach uses Next.js Route Handlers with proper Content-Disposition headers for direct downloads. For CSV generation, RFC 4180 compliance is critical for proper escaping. For bulk exports, client-zip provides a lightweight (2.6 kB gzipped), browser-native solution for ZIP generation that's 40x faster than JSZip.

The existing codebase uses Next.js 15 with TypeScript, Supabase for data, and Server Components. The module_traces view already provides denormalized data with all necessary fields (module, passage, transcript metadata). Export logic should follow established patterns: Server Components for data fetching, Route Handlers for file generation, and proper error handling.

**Primary recommendation:** Use Next.js Route Handlers for both formats, sanitize-filename for safe filenames, RFC 4180-compliant manual CSV generation (no library needed for simple data), and client-zip for browser-side bulk ZIP creation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Route Handlers | 15+ | File download endpoints | Native to Next.js, uses Web API Response object, no additional dependencies |
| client-zip | 2.5+ | Browser-side ZIP generation | 6.4 kB minified, 40x faster than JSZip, streaming architecture, TypeScript support |
| sanitize-filename | 1.6+ | Filename sanitization | Cross-platform safe, handles reserved names, 0 dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| RFC 4180 (manual) | N/A | CSV escaping rules | Simple data structures; avoid libraries for basic CSV generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual CSV | csv-stringify (csv.js.org) | Adds dependency for simple task; RFC 4180 compliance is straightforward |
| client-zip | JSZip | JSZip is 40x slower, larger bundle (23 kB vs 6.4 kB), async/await API less ergonomic |
| client-zip | archiver | Server-side only (Node.js streams), requires API endpoint; client-zip works in browser |

**Installation:**
```bash
npm install client-zip sanitize-filename
npm install --save-dev @types/sanitize-filename
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── export/
│   │       ├── markdown/
│   │       │   └── [moduleId]/
│   │       │       └── route.ts      # Single module markdown export
│   │       └── csv/
│   │           └── [moduleId]/
│   │               └── route.ts      # Single module CSV export
│   └── modules/
│       └── page.tsx                  # Add bulk export buttons (client-side ZIP)
├── lib/
│   └── export/
│       ├── markdown.ts               # Markdown generation logic
│       ├── csv.ts                    # CSV generation logic
│       └── filename.ts               # Filename sanitization utilities
```

### Pattern 1: Next.js Route Handler for File Downloads
**What:** Use Route Handlers (route.ts) with Web Response API to return files with proper Content-Disposition headers
**When to use:** Any file download endpoint in Next.js 15
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params

  // Generate file content
  const content = await generateMarkdown(moduleId)
  const filename = sanitizeFilename(`module-${moduleId}.md`)

  // Return with proper headers
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

### Pattern 2: RFC 4180 CSV Escaping
**What:** Fields containing commas, quotes, or newlines must be quoted; quotes inside fields are escaped by doubling them
**When to use:** Any CSV generation
**Example:**
```typescript
// Source: https://www.rfc-editor.org/rfc/rfc4180
function escapeCSVField(value: string): string {
  // Field needs quoting if it contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them (NOT backslash)
    const escaped = value.replace(/"/g, '""')
    return `"${escaped}"`
  }
  return value
}

function generateCSV(rows: string[][]): string {
  return rows
    .map(row => row.map(escapeCSVField).join(','))
    .join('\n')
}
```

### Pattern 3: Client-Side Bulk ZIP with client-zip
**What:** Generate ZIP files in the browser using client-zip's streaming API
**When to use:** Bulk exports where files are generated client-side or fetched from API
**Example:**
```typescript
// Source: https://www.npmjs.com/package/client-zip
import { downloadZip } from 'client-zip'

async function exportAllModules(modules: Module[]) {
  // Fetch markdown for each module
  const files = await Promise.all(
    modules.map(async (module) => {
      const response = await fetch(`/api/export/markdown/${module.id}`)
      const content = await response.text()
      return {
        name: `${sanitizeFilename(module.name)}.md`,
        lastModified: new Date(),
        input: content
      }
    })
  )

  // Generate ZIP and trigger download
  const blob = await downloadZip(files).blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'mckenna-modules-export.zip'
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}
```

### Pattern 4: YAML Frontmatter in Markdown
**What:** Triple-dash delimited YAML at the start of markdown files
**When to use:** Adding metadata to exported markdown files
**Example:**
```typescript
// Source: https://gohugo.io/content-management/front-matter/
function generateMarkdownWithFrontmatter(module: Module, passages: Trace[]): string {
  // Frontmatter must be first, triple-dash delimited, valid YAML
  const frontmatter = `---
module: ${module.name}
color: ${module.color}
exported: ${new Date().toISOString()}
passage_count: ${passages.length}
---

`

  const content = passages
    .map(p => `## ${p.transcript_title}${p.transcript_date ? ` (${formatDate(p.transcript_date)})` : ''}\n\n${p.highlighted_text}\n`)
    .join('\n')

  return frontmatter + content
}
```

### Pattern 5: Filename Sanitization
**What:** Use sanitize-filename to remove invalid characters and handle reserved names
**When to use:** Any user-generated or module-derived filenames
**Example:**
```typescript
// Source: https://www.npmjs.com/package/sanitize-filename
import sanitize from 'sanitize-filename'

function generateSafeFilename(moduleName: string, extension: string): string {
  // Sanitizes: removes/replaces invalid chars, handles reserved names (CON, NUL, etc.)
  const safe = sanitize(moduleName, { replacement: '-' })

  // Add fallback for empty result (e.g., module named "...")
  const base = safe || 'export'

  // Add timestamp for uniqueness if desired
  const timestamp = new Date().toISOString().split('T')[0]

  return `${base}-${timestamp}.${extension}`
}
```

### Anti-Patterns to Avoid
- **Backslash escaping in CSV:** CSV uses `""` to escape quotes, not `\"` (common mistake from string escaping habits)
- **Using filename* without fallback:** Always include both `filename` and `filename*` in Content-Disposition for compatibility
- **Server-side ZIP for bulk exports:** Increases server load and latency; client-zip handles this in browser efficiently
- **Missing charset in Content-Type:** Always specify `charset=utf-8` for text formats
- **Not sanitizing filenames:** Module names may contain slashes, colons, or other invalid characters

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV escaping | Custom quote/comma logic | RFC 4180 rules (or csv-stringify) | Edge cases: quotes inside quotes, newlines, consecutive commas; RFC compliance ensures interop |
| Filename sanitization | Regex to strip chars | sanitize-filename | Cross-platform reserved names (CON, NUL on Windows), length limits, hidden files (.) |
| ZIP generation | Custom binary format | client-zip | ZIP format has complex compression, CRC checksums, central directory; library handles all edge cases |
| Content-Disposition encoding | Manual header string | RFC 6266 pattern (filename + filename*) | UTF-8 filenames require RFC 5987 encoding; fallback needed for compatibility |

**Key insight:** File formats have subtle cross-platform and encoding issues that libraries solve. CSV looks simple but has 5+ edge cases; ZIP is a complex binary format.

## Common Pitfalls

### Pitfall 1: Missing await on Next.js 15 params
**What goes wrong:** Accessing `params.id` directly throws error or returns undefined
**Why it happens:** Next.js 15 changed params to Promise for streaming support
**How to avoid:** Always `await params` before destructuring
**Warning signs:** TypeScript error "Property 'id' does not exist on type 'Promise<...>'"

### Pitfall 2: Incorrect CSV quote escaping
**What goes wrong:** Excel or other tools fail to parse CSV, quotes appear incorrectly
**Why it happens:** Using backslash escape (`\"`) instead of double-quote (`""`)
**How to avoid:** Follow RFC 4180: escape `"` as `""`, not `\"`
**Warning signs:** CSV opens but shows `\"` literally, or parser errors

### Pitfall 3: Not handling missing timestamps
**What goes wrong:** CSV shows "null" or empty cells inconsistently
**Why it happens:** Directly using `trace.selector.timestamp` without checking for null
**How to avoid:** Use placeholder ("N/A" or empty string) for missing timestamps
**Warning signs:** CSV column alignment breaks, "null" appears as text

### Pitfall 4: Large bulk exports blocking UI
**What goes wrong:** Browser freezes when generating large ZIP files
**Why it happens:** Synchronous operations or too many simultaneous API calls
**How to avoid:** Use client-zip's streaming (already async), add loading states, batch API calls
**Warning signs:** Browser "Page Unresponsive" warnings, slow downloads

### Pitfall 5: Unsanitized module names in filenames
**What goes wrong:** Download fails with "Invalid filename" or saves with garbled name
**Why it happens:** Module name contains `/`, `:`, or other OS-restricted characters
**How to avoid:** Always use sanitize-filename before generating download
**Warning signs:** Failed downloads, filenames with strange chars or truncation

### Pitfall 6: Incorrect YAML frontmatter syntax
**What goes wrong:** Markdown parsers fail to read frontmatter metadata
**Why it happens:** Missing triple-dashes, non-YAML syntax, wrong indentation
**How to avoid:** Use `---` delimiters, validate YAML syntax (key: value), frontmatter must be first in file
**Warning signs:** Metadata appears as plain text in rendered markdown

## Code Examples

Verified patterns from official sources:

### Complete Route Handler Example
```typescript
// src/app/api/export/markdown/[moduleId]/route.ts
import { createClient } from '@/lib/supabase/server'
import { getModuleTraces, getModuleWithCount } from '@/lib/queries/module-traces'
import { generateMarkdown } from '@/lib/export/markdown'
import { generateSafeFilename } from '@/lib/export/filename'
import { notFound } from 'next/navigation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params

  // Fetch data (parallel)
  const [module, traces] = await Promise.all([
    getModuleWithCount(moduleId),
    getModuleTraces(moduleId)
  ])

  if (!module) {
    notFound()
  }

  // Generate content
  const markdown = generateMarkdown(module, traces)
  const filename = generateSafeFilename(module.name, 'md')

  // Return file
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
```

### Markdown Generation with Frontmatter
```typescript
// src/lib/export/markdown.ts
import type { Module } from '@/lib/types/module'
import type { ModuleTrace } from '@/lib/types/trace'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function generateMarkdown(module: Module, traces: ModuleTrace[]): string {
  // YAML frontmatter (must be first, triple-dash delimited)
  const frontmatter = `---
module: ${module.name}
color: ${module.color}
exported: ${new Date().toISOString()}
passage_count: ${traces.length}
---

# ${module.name}

${module.notes || 'No description provided.'}

---

`

  // Group traces by lecture
  const byLecture = new Map<string, ModuleTrace[]>()
  for (const trace of traces) {
    const key = trace.transcript_id
    if (!byLecture.has(key)) {
      byLecture.set(key, [])
    }
    byLecture.get(key)!.push(trace)
  }

  // Generate sections (lectures already sorted by date in view)
  const sections = Array.from(byLecture.values()).map(lectureTraces => {
    const first = lectureTraces[0]
    const dateStr = formatDate(first.transcript_date)
    const header = dateStr
      ? `## ${first.transcript_title} (${dateStr})`
      : `## ${first.transcript_title}`

    const passages = lectureTraces.map(t => {
      const timestamp = t.selector.timestamp || 'N/A'
      return `**[${timestamp}]**\n\n${t.highlighted_text}\n`
    }).join('\n')

    return `${header}\n\n${passages}`
  })

  return frontmatter + sections.join('\n---\n\n')
}
```

### CSV Generation with RFC 4180 Escaping
```typescript
// src/lib/export/csv.ts
import type { ModuleTrace } from '@/lib/types/trace'

function escapeCSVField(value: string | null): string {
  const str = value ?? 'N/A'

  // Quote field if it contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // Escape quotes by doubling (RFC 4180)
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function formatCSVDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

export function generateCSV(moduleName: string, traces: ModuleTrace[]): string {
  // Header row
  const header = ['module', 'passage', 'lecture_title', 'date', 'timestamp']

  // Data rows
  const rows = traces.map(t => [
    moduleName,
    t.highlighted_text,
    t.transcript_title,
    formatCSVDate(t.transcript_date),
    t.selector.timestamp || 'N/A'
  ])

  // Combine and escape
  const allRows = [header, ...rows]
  return allRows
    .map(row => row.map(escapeCSVField).join(','))
    .join('\n')
}
```

### Client Component for Bulk Export
```typescript
// src/components/modules/BulkExportButton.tsx
'use client'

import { downloadZip } from 'client-zip'
import sanitize from 'sanitize-filename'
import { useState } from 'react'
import type { Module } from '@/lib/types/module'

interface BulkExportButtonProps {
  modules: Module[]
  format: 'markdown' | 'csv'
}

export function BulkExportButton({ modules, format }: BulkExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)

    try {
      // Fetch all module exports in parallel
      const files = await Promise.all(
        modules.map(async (module) => {
          const response = await fetch(`/api/export/${format}/${module.id}`)
          if (!response.ok) throw new Error(`Failed to export ${module.name}`)

          const content = await response.text()
          const ext = format === 'markdown' ? 'md' : 'csv'

          return {
            name: sanitize(`${module.name}.${ext}`, { replacement: '-' }),
            lastModified: new Date(),
            input: content
          }
        })
      )

      if (format === 'csv') {
        // CSV: combine into single file
        const combined = files.map(f => f.input).join('\n\n')
        const blob = new Blob([combined], { type: 'text/csv' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `mckenna-modules-export-${Date.now()}.csv`
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)
      } else {
        // Markdown: ZIP with separate files
        const blob = await downloadZip(files).blob()
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `mckenna-modules-export-${Date.now()}.zip`
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? 'Exporting...' : `Export All as ${format.toUpperCase()}`}
    </button>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API Routes | App Router Route Handlers | Next.js 13+ | Web API Response object, better streaming, no bodyParser config |
| JSZip | client-zip | 2021+ | 40x faster, 74% smaller bundle, streaming architecture |
| Server-side bulk ZIP | Client-side ZIP | 2021+ (client-zip) | Reduces server load, faster UX, scales better |
| params as object | params as Promise | Next.js 15 | Supports streaming, requires await |
| Static GET caching | Dynamic GET default | Next.js 15 | Export endpoints uncached by default (desired behavior) |

**Deprecated/outdated:**
- **JSZip async API**: Still works but slower and larger; client-zip is modern standard for browser ZIP
- **Backslash CSV escaping**: Never standard but common mistake; RFC 4180 mandates `""` for quotes
- **Accessing params directly in Next.js 15**: TypeScript error; must await params first

## Open Questions

Things that couldn't be fully resolved:

1. **Bulk export performance with 50+ modules**
   - What we know: client-zip streams efficiently, but fetching 50+ API calls may be slow
   - What's unclear: Whether to implement server-side batch endpoint or keep client-side parallel fetches
   - Recommendation: Start with client-side (simpler), add server batch endpoint if performance testing shows issues

2. **Timestamp format preference**
   - What we know: selector.timestamp exists but format undefined (likely "HH:MM:SS" or seconds)
   - What's unclear: User preference for display format in exports
   - Recommendation: Use format as-is from database; formatting can be added in polish phase if needed

3. **Module color representation in exports**
   - What we know: color field exists (hex code), included in frontmatter
   - What's unclear: Whether to include in CSV (visual metadata in non-visual format)
   - Recommendation: Include in markdown frontmatter, omit from CSV (not actionable data)

## Sources

### Primary (HIGH confidence)
- [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route) - Official Next.js 16.1.6 docs, verified 2026-02-20
- [RFC 4180: CSV File Format](https://www.rfc-editor.org/rfc/rfc4180) - Official IETF standard for CSV
- [RFC 6266: Content-Disposition Header](https://www.rfc-editor.org/rfc/rfc6266) - Official HTTP header specification
- [client-zip NPM package](https://www.npmjs.com/package/client-zip) - Official package documentation
- [sanitize-filename NPM package](https://www.npmjs.com/package/sanitize-filename) - Official package documentation

### Secondary (MEDIUM confidence)
- [Next.js Route Handlers Best Practices](https://makerkit.dev/blog/tutorials/nextjs-api-best-practices) - Developer guide for Route Handler patterns
- [YAML Front Matter Specification](https://gohugo.io/content-management/front-matter/) - Hugo docs on frontmatter format
- [Handling Special Characters in CSV Files](https://inventivehq.com/blog/handling-special-characters-in-csv-files) - RFC 4180 compliance guide
- [CSV Escaping in TypeScript](https://ssojet.com/escaping/csv-escaping-in-typescript) - TypeScript-specific CSV guidance
- [Sanitizing Filenames](https://www.devhut.net/how-to-sanitize-a-filename/) - Cross-platform filename constraints

### Tertiary (LOW confidence)
- [Markdown for Academic Notes](https://oneuptime.com/blog/post/2026-01-19-why-markdown-is-the-best-format-for-notetaking/view) - Markdown export patterns (marked for validation)
- [JSZip vs client-zip comparison](https://npm-compare.com/adm-zip,client-zip,jszip,zip-local) - Performance claims (verified by official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All recommendations from official docs or authoritative sources (RFC, NPM)
- Architecture: HIGH - Patterns verified from Next.js 15+ docs and established practices
- Pitfalls: MEDIUM - Based on RFC standards and common issues documented in forums; direct experience needed for validation

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days - stable domain, slow-moving standards)
