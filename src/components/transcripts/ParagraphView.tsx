import Highlighter from 'react-highlight-words'
import type { TranscriptParagraph } from '@/lib/types/transcript'

interface ParagraphViewProps {
  paragraph: TranscriptParagraph
  showSpeaker: boolean
  searchQuery?: string
  isCurrentMatch?: boolean // Highlight the current search result
  hasTimestamps?: boolean // Whether any paragraph in transcript has timestamps
}

/**
 * Format timestamp for display (e.g., "1:23:45" or "0:05:30")
 */
function formatTimestamp(timestamp: string | null): string | null {
  if (!timestamp) return null
  // Return as-is if it's already formatted, or parse if needed
  return timestamp
}

export function ParagraphView({
  paragraph,
  showSpeaker,
  searchQuery,
  isCurrentMatch = false,
  hasTimestamps = false,
}: ParagraphViewProps) {
  const formattedTimestamp = formatTimestamp(paragraph.timestamp)

  return (
    <div
      className={`
        relative py-2 ${hasTimestamps ? 'pl-20' : ''} transition-colors duration-200
        ${isCurrentMatch ? 'bg-yellow-50' : ''}
      `}
      data-paragraph-id={paragraph.id}
      data-paragraph-position={paragraph.position}
    >
      {/* Timestamp in left gutter */}
      {formattedTimestamp && (
        <span className="absolute left-0 top-2 w-16 text-right text-xs text-gray-400 font-mono select-none">
          {formattedTimestamp}
        </span>
      )}

      {/* Speaker label (conditional) */}
      {showSpeaker && paragraph.speaker && (
        <div className="mb-1 text-sm font-semibold text-gray-700">
          {paragraph.speaker}
        </div>
      )}

      {/* Paragraph text with optional highlighting */}
      <p className="text-base leading-relaxed text-gray-900">
        {searchQuery ? (
          <Highlighter
            searchWords={[searchQuery]}
            autoEscape={true}
            textToHighlight={paragraph.text}
            highlightClassName="bg-yellow-200 rounded px-0.5"
            caseSensitive={false}
          />
        ) : (
          paragraph.text
        )}
      </p>
    </div>
  )
}

/**
 * Determine if speaker label should be shown for this paragraph
 */
export function shouldShowSpeaker(
  current: TranscriptParagraph,
  previous?: TranscriptParagraph
): boolean {
  if (!current.speaker) return false
  if (!previous) return true // First paragraph
  return current.speaker !== previous.speaker
}

/**
 * Check if paragraph contains search query
 */
export function paragraphMatchesSearch(
  paragraph: TranscriptParagraph,
  query: string
): boolean {
  if (!query || query.length < 2) return false
  return paragraph.text.toLowerCase().includes(query.toLowerCase())
}
