interface EmptyStateProps {
  type: 'no-results' | 'no-transcripts'
  query?: string | null
  tag?: string | null
}

export function EmptyState({ type, query, tag }: EmptyStateProps) {
  if (type === 'no-transcripts') {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No transcripts found in the database.</p>
        <p className="mt-2 text-sm text-gray-500">
          Run the seed script to import the corpus.
        </p>
      </div>
    )
  }

  // no-results
  return (
    <div className="py-12 text-center">
      <p className="text-gray-600">
        No transcripts match your {query && tag ? 'search and filter' : query ? 'search' : 'filter'}.
      </p>
      {query && (
        <p className="mt-2 text-sm text-gray-500">
          Try a different search term or clear filters.
        </p>
      )}
    </div>
  )
}
