'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { TranscriptWithParagraphs } from '@/lib/types/transcript'
import { TranscriptHeader } from './TranscriptHeader'
import { VirtualizedReader } from './VirtualizedReader'
import { SearchSidebar } from './SearchSidebar'
import { ResumePrompt } from './ResumePrompt'
import { useTranscriptSearch } from './TranscriptSearch'
import { useReadingPosition } from '@/hooks/useReadingPosition'

interface TranscriptReaderProps {
  transcript: TranscriptWithParagraphs
}

export function TranscriptReader({ transcript }: TranscriptReaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentSearchResult, setCurrentSearchResult] = useState<number | undefined>()
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null)

  const paragraphs = useMemo(() => {
    return [...transcript.transcript_paragraphs].sort((a, b) => a.position - b.position)
  }, [transcript.transcript_paragraphs])

  // Search hook
  const { query, setQuery, results, clearSearch } = useTranscriptSearch(paragraphs)

  // Position memory hook
  const {
    savedPosition,
    showResumePrompt,
    dismissResumePrompt,
    savePosition,
    resumePosition,
  } = useReadingPosition({ transcriptId: transcript.id })

  // Handle visible range changes for position memory
  const handleVisibleRangeChange = useCallback(
    (startIndex: number, _endIndex: number) => {
      savePosition(startIndex)
    },
    [savePosition]
  )

  // Handle scroll to index (passed to VirtualizedReader)
  const handleScrollToIndex = useCallback((fn: (index: number) => void) => {
    scrollToIndexRef.current = fn
  }, [])

  // Handle search result click
  const handleSearchResultClick = useCallback((paragraphIndex: number) => {
    setCurrentSearchResult(
      results.findIndex((r) => r.paragraphIndex === paragraphIndex)
    )
    scrollToIndexRef.current?.(paragraphIndex)
  }, [results])

  // Handle resume reading
  const handleResume = useCallback(() => {
    const index = resumePosition()
    if (index !== null) {
      scrollToIndexRef.current?.(index)
    }
  }, [resumePosition])

  // Close search sidebar
  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false)
    clearSearch()
    setCurrentSearchResult(undefined)
  }, [clearSearch])

  // Keyboard shortcut for search (Cmd/Ctrl + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        handleCloseSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, handleCloseSearch])

  return (
    <div className="min-h-screen bg-white">
      <div className={`mx-auto max-w-3xl px-4 py-12 ${searchOpen ? 'mr-80' : ''}`}>
        <TranscriptHeader transcript={transcript} />

        {/* Search toggle button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {paragraphs.length} paragraphs
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
            <kbd className="hidden sm:inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {typeof window !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+F
            </kbd>
          </button>
        </div>

        <article className="pb-8">
          <VirtualizedReader
            paragraphs={paragraphs}
            searchQuery={query}
            currentSearchParagraphIndex={
              currentSearchResult !== undefined
                ? results[currentSearchResult]?.paragraphIndex
                : undefined
            }
            onVisibleRangeChange={handleVisibleRangeChange}
            onScrollToIndexReady={handleScrollToIndex}
          />
        </article>

        {/* Footer */}
        <footer className="border-t border-gray-100 pt-8 mt-8">
          <div className="flex justify-between items-center">
            <Link href="/transcripts" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Back to transcripts
            </Link>
          </div>
        </footer>
      </div>

      {/* Search sidebar */}
      <SearchSidebar
        query={query}
        onQueryChange={setQuery}
        results={results}
        isOpen={searchOpen}
        onClose={handleCloseSearch}
        onResultClick={handleSearchResultClick}
        currentResultIndex={currentSearchResult}
      />

      {/* Resume prompt */}
      {showResumePrompt && savedPosition && (
        <ResumePrompt
          paragraphIndex={savedPosition.paragraphIndex}
          totalParagraphs={paragraphs.length}
          onResume={handleResume}
          onDismiss={dismissResumePrompt}
        />
      )}
    </div>
  )
}
