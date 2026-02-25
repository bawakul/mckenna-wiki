import Highlighter from 'react-highlight-words'
import type { TranscriptParagraph } from '@/lib/types/transcript'
import type { ParagraphHighlight } from '@/lib/types/annotation'
import { renderTextWithHighlights } from '@/components/annotations/HighlightRenderer'

interface ParagraphViewProps {
  paragraph: TranscriptParagraph
  showSpeaker: boolean
  searchQuery?: string
  isCurrentMatch?: boolean // Highlight the current search result
  hasTimestamps?: boolean // Whether any paragraph in transcript has timestamps
  highlights?: ParagraphHighlight[] // Annotation highlights for this paragraph
  onHighlightClick?: (annotationId: string) => void // Called when a highlight is clicked
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
  highlights = [],
  onHighlightClick,
}: ParagraphViewProps) {
  const formattedTimestamp = formatTimestamp(paragraph.timestamp)

  return (
    <div
      className={`
        relative py-3 ${hasTimestamps ? 'pl-20' : ''} transition-colors duration-200
        ${isCurrentMatch ? 'bg-yellow-50 dark:bg-yellow-900/30 -mx-4 px-4 rounded-lg' : ''}
      `}
      data-paragraph-id={paragraph.id}
      data-paragraph-position={paragraph.position}
    >
      {/* Timestamp in left gutter */}
      {formattedTimestamp && (
        <span className="absolute left-0 top-2 w-16 text-right text-xs text-gray-400 dark:text-zinc-500 font-mono select-none">
          {formattedTimestamp}
        </span>
      )}

      {/* Speaker label (conditional) */}
      {showSpeaker && paragraph.speaker && (
        <div className="mb-1 text-sm font-semibold text-gray-700 dark:text-zinc-300">
          {paragraph.speaker}
        </div>
      )}

      {/* Paragraph text with optional highlighting */}
      {/* Priority: 1. Search highlighting (temporary navigation mode) */}
      {/*           2. Annotation highlights (persistent markup) */}
      {/*           3. Plain text */}
      <p className="text-base leading-relaxed text-gray-900 dark:text-zinc-100">
        {searchQuery ? (
          <Highlighter
            searchWords={[searchQuery]}
            autoEscape={true}
            textToHighlight={paragraph.text}
            highlightClassName="bg-yellow-200 dark:bg-yellow-700/50 rounded px-0.5"
            caseSensitive={false}
          />
        ) : highlights.length > 0 ? (
          renderTextWithHighlights(paragraph.text, highlights, onHighlightClick)
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
