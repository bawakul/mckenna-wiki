'use client'

import { useState } from 'react'

interface ExportButtonsProps {
  moduleId: string
  moduleName: string
}

export function ExportButtons({ moduleId, moduleName }: ExportButtonsProps) {
  const [loadingMd, setLoadingMd] = useState(false)
  const [loadingCsv, setLoadingCsv] = useState(false)

  async function handleExport(format: 'markdown' | 'csv') {
    const setLoading = format === 'markdown' ? setLoadingMd : setLoadingCsv
    setLoading(true)

    try {
      const response = await fetch(`/api/export/${format}/${moduleId}`)
      if (!response.ok) throw new Error('Export failed')

      // Get filename from Content-Disposition or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${moduleName}.${format === 'markdown' ? 'md' : 'csv'}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/)
        if (match) filename = match[1]
      }

      // Download file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('markdown')}
        disabled={loadingMd}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {loadingMd ? 'Exporting...' : 'Export MD'}
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={loadingCsv}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {loadingCsv ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  )
}
