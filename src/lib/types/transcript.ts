/**
 * Transcript metadata as stored in database
 */
export interface Transcript {
  id: string               // URL slug from organism.earth
  url: string              // Full source URL
  title: string
  date: string | null      // May be year only or full date
  location: string | null
  speakers: string[]       // Array of speaker names
  duration_minutes: number | null
  word_count: number | null
  topic_tags: string[]     // Array of topic/tag strings
  referenced_authors: string[]
  description: string | null
  content_hash: string
  scraped_at: string
  created_at: string
  updated_at: string
}

/**
 * Paragraph within a transcript
 */
export interface TranscriptParagraph {
  id: number
  transcript_id: string
  position: number         // Zero-indexed sequential order
  speaker: string | null   // NULL if not identified
  timestamp: string | null // NULL if not available
  text: string
  content_hash: string     // For stable anchoring
}

/**
 * Transcript with all its paragraphs loaded
 */
export interface TranscriptWithParagraphs extends Transcript {
  transcript_paragraphs: TranscriptParagraph[]
}

/**
 * Minimal transcript data for list display
 */
export interface TranscriptListItem {
  id: string
  title: string
  date: string | null
  word_count: number | null
  topic_tags: string[]
}

/**
 * Format transcript date for display
 * Handles both full dates and year-only formats
 */
export function formatTranscriptDate(date: string | null): string {
  if (!date) return 'Date unknown'

  // Check if it's just a year (4 digits)
  if (/^\d{4}$/.test(date)) {
    return date
  }

  // Try to parse as full date
  try {
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  } catch {
    // Fall through to return raw date
  }

  return date
}

/**
 * Format word count for display
 */
export function formatWordCount(count: number | null): string {
  if (!count) return ''
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k words`
  }
  return `${count} words`
}
