import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TranscriptListItem } from '@/components/transcripts/TranscriptListItem'
import { TranscriptFilters } from '@/components/transcripts/TranscriptFilters'
import { EmptyState } from '@/components/transcripts/EmptyState'
import type { TranscriptListItem as TranscriptListItemType } from '@/lib/types/transcript'

interface TranscriptsPageProps {
  searchParams: Promise<{ q?: string; tag?: string }>
}

async function getAvailableTags(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string[]> {
  // Get all unique topic tags across transcripts
  const { data } = await supabase
    .from('transcripts')
    .select('topic_tags')

  if (!data) return []

  const tagSet = new Set<string>()
  data.forEach(t => {
    t.topic_tags?.forEach((tag: string) => tagSet.add(tag))
  })

  return Array.from(tagSet).sort()
}

async function getTranscripts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query?: string,
  tag?: string
): Promise<TranscriptListItemType[]> {
  // If searching, use full-text search
  if (query && query.trim()) {
    const { data } = await supabase
      .from('transcripts')
      .select('id, title, date, word_count, topic_tags')
      .textSearch('search_vector', query, { type: 'websearch' })
      .order('date', { ascending: true })

    // Apply tag filter post-query if needed
    if (tag && data) {
      return data.filter(t => t.topic_tags?.includes(tag))
    }

    return data ?? []
  }

  // Otherwise, build filter query
  let queryBuilder = supabase
    .from('transcripts')
    .select('id, title, date, word_count, topic_tags')
    .order('date', { ascending: true })

  if (tag) {
    queryBuilder = queryBuilder.contains('topic_tags', [tag])
  }

  const { data } = await queryBuilder
  return data ?? []
}

export default async function TranscriptsPage({ searchParams }: TranscriptsPageProps) {
  const params = await searchParams
  const query = params.q ?? null
  const tag = params.tag ?? null

  const supabase = await createClient()

  const [transcripts, availableTags] = await Promise.all([
    getTranscripts(supabase, query ?? undefined, tag ?? undefined),
    getAvailableTags(supabase),
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a2e]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#e8e8f0]">Transcripts</h1>
          <p className="mt-2 text-gray-600 dark:text-[#9090b0]">
            Browse {transcripts.length > 0 ? `${transcripts.length} ` : ''}McKenna lectures chronologically
          </p>
        </div>

        <Suspense fallback={<div className="animate-pulse h-20 bg-gray-100 dark:bg-[#2d2d4a] rounded-lg" />}>
          <TranscriptFilters
            availableTags={availableTags}
            currentTag={tag}
            currentQuery={query}
          />
        </Suspense>

        <div className="mt-8">
          {transcripts.length === 0 ? (
            <EmptyState
              type={!query && !tag ? 'no-transcripts' : 'no-results'}
              query={query}
              tag={tag}
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#2d2d4a]">
              {transcripts.map((transcript) => (
                <TranscriptListItem key={transcript.id} transcript={transcript} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
