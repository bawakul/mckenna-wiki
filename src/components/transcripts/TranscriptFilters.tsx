'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

interface TranscriptFiltersProps {
  availableTags: string[]
  currentTag: string | null
  currentQuery: string | null
}

export function TranscriptFilters({
  availableTags,
  currentTag,
  currentQuery,
}: TranscriptFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentQuery ?? '')

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    router.push(`/transcripts${queryString ? `?${queryString}` : ''}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput || null })
  }

  const handleTagClick = (tag: string) => {
    if (currentTag === tag) {
      updateParams({ tag: null })
    } else {
      updateParams({ tag })
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    router.push('/transcripts')
  }

  const hasFilters = currentTag || currentQuery

  return (
    <div className="space-y-4">
      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search transcripts..."
            className="w-full rounded-lg border border-gray-200 dark:border-[#3d3d5a] bg-white dark:bg-[#16213e] text-gray-900 dark:text-[#e8e8f0] placeholder-gray-400 dark:placeholder-[#6a6a8a] px-4 py-2 pr-10 text-sm focus:border-gray-400 dark:focus:border-[#6a6a8a] focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-[#2d2d4a]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                updateParams({ q: null })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6a6a8a] hover:text-gray-600 dark:hover:text-[#9090b0]"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 dark:bg-[#2d2d4a] px-4 py-2 text-sm font-medium text-white dark:text-[#e8e8f0] hover:bg-gray-800 dark:hover:bg-[#3d3d5a]"
        >
          Search
        </button>
      </form>

      {/* Topic tags */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`
                rounded-full px-3 py-1 text-xs font-medium transition-colors
                ${currentTag === tag
                  ? 'bg-gray-900 dark:bg-[#2d2d4a] text-white dark:text-[#e8e8f0]'
                  : 'bg-gray-100 dark:bg-[#16213e] text-gray-700 dark:text-[#c0c0d0] hover:bg-gray-200 dark:hover:bg-[#2d2d4a]'
                }
              `}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 dark:text-[#9090b0] underline hover:text-gray-700 dark:hover:text-[#c0c0d0]"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
