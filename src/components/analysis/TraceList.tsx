'use client'

import { useState, useTransition } from 'react'
import { TraceCard } from './TraceCard'
import type { ModuleTrace } from '@/lib/types/trace'

interface TraceListProps {
  traces: ModuleTrace[]
  moduleColor: string
}

export function TraceList({ traces, moduleColor }: TraceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTraces, setFilteredTraces] = useState(traces)
  const [isPending, startTransition] = useTransition()

  function handleSearch(query: string) {
    // Update input immediately (high priority)
    setSearchQuery(query)

    // Defer filtering (low priority, non-blocking)
    startTransition(() => {
      if (!query.trim()) {
        setFilteredTraces(traces)
        return
      }

      const lowercaseQuery = query.toLowerCase()
      const filtered = traces.filter(trace =>
        trace.highlighted_text.toLowerCase().includes(lowercaseQuery) ||
        trace.transcript_title.toLowerCase().includes(lowercaseQuery)
      )
      setFilteredTraces(filtered)
    })
  }

  return (
    <div>
      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search passages..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:ring-zinc-100"
        />
        {isPending && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Filtering...</p>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredTraces.length === 0 && searchQuery ? (
          <p className="text-zinc-500 text-center py-12 dark:text-zinc-400">
            No passages match "{searchQuery}"
          </p>
        ) : (
          filteredTraces.map(trace => (
            <TraceCard
              key={trace.id}
              trace={trace}
              moduleColor={moduleColor}
            />
          ))
        )}
      </div>
    </div>
  )
}
