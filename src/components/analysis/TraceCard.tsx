'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ModuleTrace } from '@/lib/types/trace'

interface TraceCardProps {
  trace: ModuleTrace
  moduleColor: string
}

export function TraceCard({ trace, moduleColor }: TraceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format date for display (handle various formats: "March 25, 1994", "June 1989", null)
  const displayDate = trace.transcript_date || 'Date unknown'

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Card header: lecture title + date */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {trace.transcript_title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {displayDate}
          </p>
        </div>
        <Link
          href={`/transcripts/${trace.transcript_id}`}
          className="flex-shrink-0 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View in lecture →
        </Link>
      </div>

      {/* Highlighted passage */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p
          className="rounded-sm px-1 py-0.5"
          style={{ backgroundColor: `${moduleColor}59` }}  // 35% opacity
        >
          {trace.highlighted_text}
        </p>
      </div>

      {/* Expand/collapse button (for future context expansion) */}
      {/* Note: Full context expansion would require fetching surrounding paragraphs.
          For v1, just show the highlighted text. Can add expand later if needed. */}
    </div>
  )
}
