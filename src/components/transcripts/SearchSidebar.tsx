'use client'

import { useRef, useEffect } from 'react'
import type { SearchResult } from './TranscriptSearch'
import Highlighter from 'react-highlight-words'

interface SearchSidebarProps {
  query: string
  onQueryChange: (query: string) => void
  results: SearchResult[]
  isOpen: boolean
  onClose: () => void
  onResultClick: (paragraphIndex: number) => void
  currentResultIndex?: number
}

export function SearchSidebar({
  query,
  onQueryChange,
  results,
  isOpen,
  onClose,
  onResultClick,
  currentResultIndex,
}: SearchSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0)

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Search in transcript</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search text..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        {query.length >= 2 && (
          <p className="mt-2 text-xs text-gray-500">
            {results.length === 0
              ? 'No matches found'
              : `${totalMatches} match${totalMatches === 1 ? '' : 'es'} in ${results.length} paragraph${results.length === 1 ? '' : 's'}`
            }
          </p>
        )}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-auto">
        {results.map((result, index) => (
          <button
            key={result.paragraph.id}
            onClick={() => onResultClick(result.paragraphIndex)}
            className={`
              w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors
              ${currentResultIndex === index ? 'bg-yellow-50' : ''}
            `}
          >
            <div className="text-xs text-gray-400 mb-1">
              Paragraph {result.paragraph.position + 1}
              {result.matchCount > 1 && ` (${result.matchCount} matches)`}
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">
              <Highlighter
                searchWords={[query]}
                autoEscape={true}
                textToHighlight={result.snippet}
                highlightClassName="bg-yellow-200 rounded"
                caseSensitive={false}
              />
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
