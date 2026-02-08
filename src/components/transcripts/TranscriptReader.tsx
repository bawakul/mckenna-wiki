'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import type { TranscriptWithParagraphs } from '@/lib/types/transcript'
import { TranscriptHeader } from './TranscriptHeader'
import { VirtualizedReader } from './VirtualizedReader'

interface TranscriptReaderProps {
  transcript: TranscriptWithParagraphs
}

export function TranscriptReader({ transcript }: TranscriptReaderProps) {
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(0)

  const paragraphs = useMemo(() => {
    // Sort by position to ensure correct order
    return [...transcript.transcript_paragraphs].sort((a, b) => a.position - b.position)
  }, [transcript.transcript_paragraphs])

  const handleVisibleRangeChange = useCallback((startIndex: number, _endIndex: number) => {
    setFirstVisibleIndex(startIndex)
  }, [])

  const handleScrollToTop = useCallback(() => {
    // For virtualized content, we need to scroll the container
    const container = document.querySelector('[data-virtualized-container]')
    container?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <TranscriptHeader transcript={transcript} />

        {/* Reading progress indicator */}
        {paragraphs.length > 0 && (
          <div className="mb-4 text-xs text-gray-400">
            {firstVisibleIndex + 1} / {paragraphs.length} paragraphs
          </div>
        )}

        <article className="pb-8">
          <VirtualizedReader
            paragraphs={paragraphs}
            onVisibleRangeChange={handleVisibleRangeChange}
          />
        </article>

        {/* Footer with navigation */}
        <footer className="border-t border-gray-100 pt-8 mt-8">
          <div className="flex justify-between items-center">
            <Link href="/transcripts" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Back to transcripts
            </Link>
            <button
              onClick={handleScrollToTop}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to top &uarr;
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
