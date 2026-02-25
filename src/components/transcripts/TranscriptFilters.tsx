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
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-4 py-2 pr-10 text-sm focus:border-gray-400 dark:focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-zinc-700"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                updateParams({ q: null })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400"
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
          className="rounded-lg bg-gray-900 dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-white dark:text-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-600"
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
                  ? 'bg-gray-900 dark:bg-zinc-700 text-white dark:text-zinc-100'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
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
          className="text-sm text-gray-500 dark:text-zinc-400 underline hover:text-gray-700 dark:hover:text-zinc-300"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
