import Link from 'next/link'
import type { TranscriptListItem as TranscriptListItemType } from '@/lib/types/transcript'
import { formatTranscriptDate, formatWordCount } from '@/lib/types/transcript'

interface TranscriptListItemProps {
  transcript: TranscriptListItemType
}

export function TranscriptListItem({ transcript }: TranscriptListItemProps) {
  return (
    <Link
      href={`/transcripts/${transcript.id}`}
      className="block border-b border-gray-100 dark:border-zinc-700 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium text-gray-900 dark:text-zinc-100 truncate">
          {transcript.title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-zinc-400 whitespace-nowrap flex-shrink-0">
          {formatTranscriptDate(transcript.date)}
        </span>
      </div>
      {transcript.word_count && (
        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
          {formatWordCount(transcript.word_count)}
        </p>
      )}
    </Link>
  )
}
