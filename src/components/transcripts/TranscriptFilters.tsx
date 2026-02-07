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
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search transcripts..."
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
