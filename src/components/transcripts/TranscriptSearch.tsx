'use client'

import { useState, useMemo, useCallback } from 'react'
import type { TranscriptParagraph } from '@/lib/types/transcript'

export interface SearchResult {
  paragraphIndex: number
  paragraph: TranscriptParagraph
  snippet: string
  matchCount: number
}

interface UseTranscriptSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: SearchResult[]
  isSearching: boolean
  clearSearch: () => void
}

/**
 * Extract a snippet around the first match
 */
function extractSnippet(text: string, query: string, contextLength: number = 50): string {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerText.indexOf(lowerQuery)

  if (matchIndex === -1) return text.slice(0, contextLength * 2)

  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(text.length, matchIndex + query.length + contextLength)

  let snippet = text.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'

  return snippet
}

/**
 * Count occurrences of query in text (case-insensitive)
 */
function countMatches(text: string, query: string): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let count = 0
  let pos = 0

  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    count++
    pos += lowerQuery.length
  }

  return count
}

export function useTranscriptSearch(paragraphs: TranscriptParagraph[]): UseTranscriptSearchReturn {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query || query.length < 2) return []

    const searchResults: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    paragraphs.forEach((paragraph, index) => {
      if (paragraph.text.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          paragraphIndex: index,
          paragraph,
          snippet: extractSnippet(paragraph.text, query),
          matchCount: countMatches(paragraph.text, query),
        })
      }
    })

    return searchResults
  }, [paragraphs, query])

  const clearSearch = useCallback(() => {
    setQuery('')
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearching: query.length >= 2,
    clearSearch,
  }
}
