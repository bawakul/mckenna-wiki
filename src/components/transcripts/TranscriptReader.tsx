'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { TranscriptWithParagraphs } from '@/lib/types/transcript'
import type { AnnotationWithModule } from '@/lib/types/annotation'
import { formatTranscriptDate, formatWordCount } from '@/lib/types/transcript'
import { VirtualizedReader } from './VirtualizedReader'
import { ResumePrompt } from './ResumePrompt'
import { useTranscriptSearch, type SearchResult } from './TranscriptSearch'
import { useReadingPosition } from '@/hooks/useReadingPosition'
import { AnnotationSidebar, scrollToAnnotation, useVisibleAnnotations } from '@/components/annotations/AnnotationSidebar'
import { HighlightPopover } from '@/components/annotations/HighlightPopover'
import { getAnnotationsForTranscript } from '@/app/annotations/actions'
import Highlighter from 'react-highlight-words'

interface TranscriptReaderProps {
  transcript: TranscriptWithParagraphs
  initialAnnotations?: AnnotationWithModule[]
}

export function TranscriptReader({ transcript, initialAnnotations = [] }: TranscriptReaderProps) {
  const [currentSearchResult, setCurrentSearchResult] = useState<number | undefined>()
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Annotations state (can be refreshed after mutations)
  const [annotations, setAnnotations] = useState<AnnotationWithModule[]>(initialAnnotations)

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Popover state
  const [selectedAnnotation, setSelectedAnnotation] = useState<{
    annotation: AnnotationWithModule
    anchorElement: HTMLElement
  } | null>(null)

  // Track visible annotations for sidebar highlighting
  const visibleAnnotationIds = useVisibleAnnotations(annotations, isSidebarOpen)

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

  // Refresh annotations after create/update/delete
  const refreshAnnotations = useCallback(async () => {
    const result = await getAnnotationsForTranscript(transcript.id)
    if (result.success) {
      setAnnotations(result.data)
    }
  }, [transcript.id])

  // Handle highlight click (show popover)
  const handleHighlightClick = useCallback((annotationId: string, element: HTMLElement) => {
    const annotation = annotations.find((a) => a.id === annotationId)
    if (annotation) {
      setSelectedAnnotation({ annotation, anchorElement: element })
    }
  }, [annotations])

  // Handle sidebar annotation click (scroll to it and open popover)
  const handleSidebarAnnotationClick = useCallback((annotation: AnnotationWithModule) => {
    // Find the paragraph index for this annotation
    const paragraphIndex = paragraphs.findIndex(
      (p) => p.id === annotation.start_paragraph_id
    )

    if (paragraphIndex >= 0 && scrollToIndexRef.current) {
      // Scroll the virtualizer to the paragraph first
      scrollToIndexRef.current(paragraphIndex)

      // After scrolling, find the mark element and open the popover
      // Use a timeout to allow the virtualizer to render the paragraph
      setTimeout(() => {
        const mark = document.querySelector(
          `[data-annotation-id="${annotation.id}"]`
        ) as HTMLElement | null

        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Open the popover anchored to this mark
          setSelectedAnnotation({ annotation, anchorElement: mark })
        }
      }, 150)
    }
  }, [paragraphs])

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
    <div className="min-h-screen bg-white dark:bg-[#1a1a2e] flex">
      {/* Left Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-gray-100 dark:border-[#2d2d4a] h-screen overflow-y-auto sticky top-0">
        <div className="p-6">
          {/* Back link */}
          <Link
            href="/transcripts"
            className="text-sm text-gray-500 dark:text-[#9090b0] hover:text-gray-700 dark:hover:text-[#c0c0d0] inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to transcripts
          </Link>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#e8e8f0] mt-4 leading-tight">
            {transcript.title}
          </h1>

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-[#9090b0]">
            <span>{formatTranscriptDate(transcript.date)}</span>
            {transcript.word_count && (
              <>
                <span className="text-gray-300 dark:text-[#3d3d5a]">·</span>
                <span>{formatWordCount(transcript.word_count)}</span>
              </>
            )}
          </div>

          {transcript.location && (
            <p className="mt-1 text-sm text-gray-500 dark:text-[#9090b0]">{transcript.location}</p>
          )}

          {/* Description */}
          {transcript.description && (
            <p className="mt-4 text-sm text-gray-600 dark:text-[#9090b0] leading-relaxed">
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
                  className="rounded-full bg-gray-100 dark:bg-[#16213e] px-2.5 py-0.5 text-xs text-gray-600 dark:text-[#9090b0] hover:bg-gray-200 dark:hover:bg-[#2d2d4a]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-[#2d2d4a] my-6" />

          {/* Search section */}
          <div>
            <label htmlFor="transcript-search" className="block text-sm font-medium text-gray-700 dark:text-[#c0c0d0] mb-2">
              Search in transcript
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                id="transcript-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search text..."
                className="w-full rounded-lg border border-gray-200 dark:border-[#3d3d5a] bg-white dark:bg-[#16213e] text-gray-900 dark:text-[#e8e8f0] placeholder-gray-400 dark:placeholder-[#6a6a8a] px-3 py-2 pr-9 text-sm focus:border-gray-400 dark:focus:border-[#6a6a8a] focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-[#2d2d4a]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    clearSearch()
                    setCurrentSearchResult(undefined)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6a6a8a] hover:text-gray-600 dark:hover:text-[#9090b0]"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-[#6a6a8a]">
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
      <main className={`flex-1 min-w-0 transition-all duration-200 ${isSidebarOpen ? 'mr-80' : ''}`}>
        <div className="h-screen">
          <VirtualizedReader
            paragraphs={paragraphs}
            transcriptId={transcript.id}
            searchQuery={query}
            hasTimestamps={hasTimestamps}
            currentSearchParagraphIndex={
              currentSearchResult !== undefined
                ? results[currentSearchResult]?.paragraphIndex
                : undefined
            }
            onVisibleRangeChange={handleVisibleRangeChange}
            onScrollToIndexReady={handleScrollToIndex}
            annotations={annotations}
            onAnnotationCreated={refreshAnnotations}
            onHighlightClick={handleHighlightClick}
          />
        </div>
      </main>

      {/* Annotation sidebar */}
      <AnnotationSidebar
        annotations={annotations}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAnnotationClick={handleSidebarAnnotationClick}
        visibleAnnotationIds={visibleAnnotationIds}
      />

      {/* Highlight popover */}
      {selectedAnnotation && (
        <HighlightPopover
          annotation={selectedAnnotation.annotation}
          anchorElement={selectedAnnotation.anchorElement}
          isOpen={true}
          onClose={() => setSelectedAnnotation(null)}
          onUpdated={refreshAnnotations}
        />
      )}

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
          ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700/50'
          : 'border-gray-100 dark:border-[#2d2d4a] hover:border-gray-200 dark:hover:border-[#3d3d5a] hover:bg-gray-50 dark:hover:bg-[#16213e]'
        }
      `}
    >
      <div className="text-xs text-gray-400 dark:text-[#6a6a8a] mb-1">
        ¶{result.paragraph.position + 1}
        {result.matchCount > 1 && ` · ${result.matchCount} matches`}
      </div>
      <p className="text-sm text-gray-700 dark:text-[#c0c0d0] line-clamp-2">
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
