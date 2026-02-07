import Link from 'next/link'
import type { Transcript } from '@/lib/types/transcript'
import { formatTranscriptDate, formatWordCount } from '@/lib/types/transcript'

interface TranscriptHeaderProps {
  transcript: Transcript
}

export function TranscriptHeader({ transcript }: TranscriptHeaderProps) {
  return (
    <header className="border-b border-gray-100 pb-8 mb-8">
      <Link
        href="/transcripts"
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Back to transcripts
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mt-2">
        {transcript.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span>{formatTranscriptDate(transcript.date)}</span>

        {transcript.location && (
          <>
            <span className="text-gray-300">|</span>
            <span>{transcript.location}</span>
          </>
        )}

        {transcript.word_count && (
          <>
            <span className="text-gray-300">|</span>
            <span>{formatWordCount(transcript.word_count)}</span>
          </>
        )}

        {transcript.duration_minutes && (
          <>
            <span className="text-gray-300">|</span>
            <span>{Math.floor(transcript.duration_minutes / 60)}h {transcript.duration_minutes % 60}m</span>
          </>
        )}
      </div>

      {transcript.description && (
        <p className="mt-4 text-gray-600 leading-relaxed">
          {transcript.description}
        </p>
      )}

      {transcript.topic_tags && transcript.topic_tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {transcript.topic_tags.map((tag) => (
            <Link
              key={tag}
              href={`/transcripts?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
