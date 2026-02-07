'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import type { TranscriptWithParagraphs } from '@/lib/types/transcript'
import { TranscriptHeader } from './TranscriptHeader'
import { ParagraphView, shouldShowSpeaker } from './ParagraphView'

interface TranscriptReaderProps {
  transcript: TranscriptWithParagraphs
}

export function TranscriptReader({ transcript }: TranscriptReaderProps) {
  const paragraphs = useMemo(() => {
    // Sort by position to ensure correct order
    return [...transcript.transcript_paragraphs].sort((a, b) => a.position - b.position)
  }, [transcript.transcript_paragraphs])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <TranscriptHeader transcript={transcript} />

        <article className="pb-24">
          {paragraphs.map((paragraph, index) => (
            <ParagraphView
              key={paragraph.id}
              paragraph={paragraph}
              showSpeaker={shouldShowSpeaker(paragraph, paragraphs[index - 1])}
            />
          ))}
        </article>

        {/* Footer with navigation */}
        <footer className="border-t border-gray-100 pt-8 mt-8">
          <div className="flex justify-between items-center">
            <Link href="/transcripts" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Back to transcripts
            </Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
