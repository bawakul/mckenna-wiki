import { createHash } from 'crypto';

/**
 * Normalize text for hashing: trim and collapse whitespace
 */
function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Generate SHA-256 hash of paragraph text.
 * Returns first 16 hex characters for compactness.
 *
 * @param text - Paragraph text content
 * @returns 16-character hex hash
 */
export function hashParagraph(text: string): string {
  const normalized = normalizeText(text);
  const hash = createHash('sha256').update(normalized, 'utf8').digest('hex');
  return hash.substring(0, 16);
}

/**
 * Generate SHA-256 hash of entire transcript content.
 * Hashes the combination of title and all paragraph texts to detect
 * any changes to the transcript content.
 *
 * @param title - Transcript title
 * @param paragraphs - Array of paragraphs with text property
 * @returns 64-character hex hash (full SHA-256)
 */
export function hashTranscriptContent(
  title: string,
  paragraphs: Array<{ text: string }>
): string {
  const contentObject = {
    title: title.trim(),
    paragraphs: paragraphs.map(p => p.text.trim()),
  };

  const contentString = JSON.stringify(contentObject);
  const hash = createHash('sha256').update(contentString, 'utf8').digest('hex');
  return hash;
}
