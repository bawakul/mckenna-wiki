import { z } from 'zod';

/**
 * Paragraph within a transcript.
 * Each paragraph has a position index, optional speaker/timestamp,
 * the text content, and a content hash for deduplication.
 */
export interface Paragraph {
  /** Zero-indexed position in the transcript */
  position: number;
  /** Speaker name (null for monologue format) */
  speaker: string | null;
  /** Timestamp in MM:SS or HH:MM:SS format (null if not available) */
  timestamp: string | null;
  /** Paragraph text content */
  text: string;
  /** SHA-256 hash of normalized text (first 16 hex chars) */
  contentHash: string;
}

/**
 * Complete transcript document from organism.earth.
 * Includes all metadata, paragraphs, and content hash for deduplication.
 */
export interface Transcript {
  /** Unique ID derived from URL slug */
  id: string;
  /** Source URL */
  url: string;
  /** Document title */
  title: string;
  /** Date (parsed from title/URL, may be partial, null if unavailable) */
  date: string | null;
  /** Location of talk/recording (null if unavailable) */
  location: string | null;
  /** List of speakers (for McKenna corpus: ["Terence McKenna"]) */
  speakers: string[];
  /** Duration in minutes (null if unavailable) */
  durationMinutes: number | null;
  /** Word count (null if unavailable) */
  wordCount: number | null;
  /** Topic tags extracted from metadata (empty array if none) */
  topicTags: string[];
  /** Referenced authors mentioned in metadata (empty array if none) */
  referencedAuthors: string[];
  /** Description/summary (null if unavailable) */
  description: string | null;
  /** Array of paragraphs in order */
  paragraphs: Paragraph[];
  /** SHA-256 hash of transcript content (title + paragraph texts) */
  contentHash: string;
  /** ISO timestamp when scraped */
  scrapedAt: string;
}

/**
 * Zod schema for Paragraph validation
 */
export const ParagraphSchema = z.object({
  position: z.number().int().min(0),
  speaker: z.string().nullable(),
  timestamp: z.string().nullable(),
  text: z.string().min(1),
  contentHash: z.string().length(16).regex(/^[0-9a-f]+$/),
});

/**
 * Zod schema for Transcript validation
 */
export const TranscriptSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  date: z.string().nullable(),
  location: z.string().nullable(),
  speakers: z.array(z.string()),
  durationMinutes: z.number().positive().nullable(),
  wordCount: z.number().int().positive().nullable(),
  topicTags: z.array(z.string()),
  referencedAuthors: z.array(z.string()),
  description: z.string().nullable(),
  paragraphs: z.array(ParagraphSchema).min(1),
  contentHash: z.string().length(64).regex(/^[0-9a-f]+$/),
  scrapedAt: z.string().datetime(),
});

/**
 * Type guard for Paragraph
 */
export function isParagraph(obj: unknown): obj is Paragraph {
  return ParagraphSchema.safeParse(obj).success;
}

/**
 * Type guard for Transcript
 */
export function isTranscript(obj: unknown): obj is Transcript {
  return TranscriptSchema.safeParse(obj).success;
}
