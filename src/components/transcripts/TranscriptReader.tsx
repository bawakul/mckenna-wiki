'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { TranscriptWithParagraphs } from '@/lib/types/transcript'
import { formatTranscriptDate, formatWordCount } from '@/lib/types/transcript'
import { VirtualizedReader } from './VirtualizedReader'
import { ResumePrompt } from './ResumePrompt'
import { useTranscriptSearch, type SearchResult } from './TranscriptSearch'
import { useReadingPosition } from '@/hooks/useReadingPosition'
import Highlighter from 'react-highlight-words'

interface TranscriptReaderProps {
  transcript: TranscriptWithParagraphs
}

export function TranscriptReader({ transcript }: TranscriptReaderProps) {
  const [currentSearchResult, setCurrentSearchResult] = useState<number | undefined>()
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const paragraphs = useMemo(() => {
    return [...transcript.transcript_paragraphs].sort((a, b) => a.position - b.position)
  }, [transcript.transcript_paragraphs])

  // Check if any paragraph has a timestamp (for gutter display)
  const hasTimestamps = useMemo(() => {
    return paragraphs.some(p => p.timestamp !== null && p.timestamp !== '')
  }, [paragraphs])

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

  // Keyboard shortcut for search (Cmd/Ctrl + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0)

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-gray-100 h-screen overflow-y-auto sticky top-0">
        <div className="p-6">
          {/* Back link */}
          <Link
            href="/transcripts"
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to transcripts
          </Link>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 mt-4 leading-tight">
            {transcript.title}
          </h1>

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{formatTranscriptDate(transcript.date)}</span>
            {transcript.word_count && (
              <>
                <span className="text-gray-300">·</span>
                <span>{formatWordCount(transcript.word_count)}</span>
              </>
            )}
          </div>

          {transcript.location && (
            <p className="mt-1 text-sm text-gray-500">{transcript.location}</p>
          )}

          {/* Description */}
          {transcript.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">
              {transcript.description}
            </p>
          )}

          {/* Topic tags */}
          {transcript.topic_tags && transcript.topic_tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {transcript.topic_tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/transcripts?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 my-6" />

          {/* Search section */}
          <div>
            <label htmlFor="transcript-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search in transcript
            </label>
            <input
              ref={searchInputRef}
              id="transcript-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search text..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <p className="mt-1 text-xs text-gray-400">
              {query.length >= 2
                ? results.length === 0
                  ? 'No matches found'
                  : `${totalMatches} match${totalMatches === 1 ? '' : 'es'} in ${results.length} paragraph${results.length === 1 ? '' : 's'}`
                : `${paragraphs.length} paragraphs`
              }
            </p>
          </div>

          {/* Search results */}
          {query.length >= 2 && results.length > 0 && (
            <div className="mt-4 space-y-2 max-h-[40vh] overflow-y-auto">
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.paragraph.id}
                  result={result}
                  query={query}
                  isActive={currentSearchResult === index}
                  onClick={() => handleSearchResultClick(result.paragraphIndex)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main reading area */}
      <main className="flex-1 min-w-0">
        <div className="h-screen">
          <VirtualizedReader
            paragraphs={paragraphs}
            searchQuery={query}
            hasTimestamps={hasTimestamps}
            currentSearchParagraphIndex={
              currentSearchResult !== undefined
                ? results[currentSearchResult]?.paragraphIndex
                : undefined
            }
            onVisibleRangeChange={handleVisibleRangeChange}
            onScrollToIndexReady={handleScrollToIndex}
          />
        </div>
      </main>

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

// Search result item component
function SearchResultItem({
  result,
  query,
  isActive,
  onClick,
}: {
  result: SearchResult
  query: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-colors
        ${isActive
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
        }
      `}
    >
      <div className="text-xs text-gray-400 mb-1">
        ¶{result.paragraph.position + 1}
        {result.matchCount > 1 && ` · ${result.matchCount} matches`}
      </div>
      <p className="text-sm text-gray-700 line-clamp-2">
        <Highlighter
          searchWords={[query]}
          autoEscape={true}
          textToHighlight={result.snippet}
          highlightClassName="bg-yellow-200 rounded px-0.5"
          caseSensitive={false}
        />
      </p>
    </button>
  )
}
