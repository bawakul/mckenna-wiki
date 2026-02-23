'use client'

import { downloadZip } from 'client-zip'
import sanitize from 'sanitize-filename'
import { useState } from 'react'

interface Module {
  id: string
  name: string
}

interface BulkExportButtonProps {
  modules: Module[]
  format: 'markdown' | 'csv'
}

export function BulkExportButton({ modules, format }: BulkExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (modules.length === 0) {
      alert('No modules to export')
      return
    }

    setLoading(true)

    try {
      // Fetch all module exports in parallel
      const results = await Promise.all(
        modules.map(async (module) => {
          const response = await fetch(`/api/export/${format}/${module.id}`)
          if (!response.ok) throw new Error(`Failed to export ${module.name}`)
          const content = await response.text()
          return { module, content }
        })
      )

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'csv') {
        // CSV: combine into single file with all modules
        // Skip header for subsequent files, add module column
        const combined = results.map(r => r.content).join('\n')
        const blob = new Blob([combined], { type: 'text/csv' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `mckenna-all-modules-${timestamp}.csv`
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)
      } else {
        // Markdown: ZIP with separate files per module
        const files = results.map(r => ({
          name: sanitize(`${r.module.name}.md`, { replacement: '-' }) || 'module.md',
          lastModified: new Date(),
          input: r.content
        }))

        const blob = await downloadZip(files).blob()
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `mckenna-all-modules-${timestamp}.zip`
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)
      }
    } catch (error) {
      console.error('Bulk export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const label = format === 'markdown' ? 'Export All (ZIP)' : 'Export All (CSV)'
  const loadingLabel = 'Exporting...'

  return (
    <button
      onClick={handleExport}
      disabled={loading || modules.length === 0}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}
