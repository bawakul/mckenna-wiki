import * as cheerio from 'cheerio';
import { Transcript, Paragraph } from './types';
import { hashParagraph } from './hash-utils';

/**
 * Parse organism.earth author page to extract document URLs.
 *
 * @param html - HTML content of the author page
 * @returns Array of absolute document URLs
 */
export function parseTranscriptIndex(html: string): string[] {
  const $ = cheerio.load(html);
  const docUrls: string[] = [];

  // Extract all document links matching /library/document/[slug]
  $('a[href*="/library/document/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.endsWith('/library/document/')) {
      // Convert relative URLs to absolute
      const absoluteUrl = href.startsWith('http')
        ? href
        : 'https://www.organism.earth' + href;
      docUrls.push(absoluteUrl);
    }
  });

  return docUrls;
}

/**
 * Parse a single transcript document page.
 * Extracts all metadata, paragraphs with timestamps, and content hashes.
 *
 * @param html - HTML content of the transcript page
 * @param url - Source URL of the transcript
 * @returns Transcript object (without contentHash and scrapedAt - those are added by scraper)
 */
export function parseTranscriptPage(
  html: string,
  url: string
): Omit<Transcript, 'contentHash' | 'scrapedAt'> {
  const $ = cheerio.load(html);

  // Extract ID from URL slug
  // URL format: https://www.organism.earth/library/document/[slug]
  const id = url.split('/').pop() || url;

  // Extract title
  // Try Open Graph title first, then <title> tag
  let title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').text().trim() ||
    '';

  // Clean up title if it includes site name
  title = title.split('|')[0].trim();
  title = title.split('—')[0].trim();

  // Extract description
  const description =
    $('meta[name="description"]').attr('content')?.trim() || null;

  // Extract metadata from #metadata section
  const metadataSection = $('section#metadata');

  // Location
  let location: string | null = null;
  metadataSection.find('.metadata-label').each((_, el) => {
    const text = $(el).text();
    if (text.includes('Location')) {
      // Extract location text after the icon
      location = text.replace(/[^\w\s,.-]/g, '').trim();
      // Remove "Location" label if it's in the text
      location = location.replace(/^Location\s*/i, '').trim();
    }
  });

  // Word count
  let wordCount: number | null = null;
  const wordCountEl = metadataSection.find('.metadata-label[title*="Word count"]');
  if (wordCountEl.length > 0) {
    const text = wordCountEl.text().replace(/[^\d]/g, '');
    wordCount = text ? parseInt(text, 10) : null;
  }

  // Duration
  let durationMinutes: number | null = null;
  const durationEl = metadataSection.find('.metadata-label[title="Duration"]');
  if (durationEl.length > 0) {
    const durationStr = durationEl.text().trim();
    // Parse HH:MM:SS or MM:SS to minutes
    const parts = durationStr.split(':').map(p => parseInt(p.replace(/[^\d]/g, ''), 10));
    if (parts.length === 3) {
      // HH:MM:SS
      durationMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      // MM:SS
      durationMinutes = parts[0] + parts[1] / 60;
    }
  }

  // Author (should be "Terence McKenna" for all documents in this corpus)
  const authorName = $('.author-portrait-name').text().trim() || 'Terence McKenna';
  const speakers = [authorName];

  // Extract date from <h3> tag (appears after h1 title and h2 subtitle)
  // Format varies: "March 25, 1994", "June 1989", etc.
  // Store as-is per Phase 1 decision (no normalization)
  const dateElement = $('h3').first();
  const date: string | null = dateElement.length > 0
    ? dateElement.text().trim()
    : null;

  // Extract topic tags from topics section
  // Structure: <section id="topics"><a class="metadata-label metadata-label-link">Tag Name</a></section>
  const topicTags: string[] = [];
  $('section#topics a.metadata-label-link').each((_, el) => {
    const tag = $(el).text().trim();
    if (tag) {
      topicTags.push(tag);
    }
  });

  // Referenced authors: not required for Phase 1.1
  const referencedAuthors: string[] = [];

  // Extract paragraphs with timestamps
  const paragraphs: Paragraph[] = [];

  // Process ALL talk sections in document order (both primary and secondary speakers)
  // section.talk — McKenna's content
  // section.talk-secondary — Audience questions / other speakers
  const allTalkSections = $('section.talk, section.talk-secondary');

  allTalkSections.each((_, sectionEl) => {
    const $section = $(sectionEl);

    // Extract speaker from talk-name if present (for talk-secondary sections)
    // Structure: <div class="talk-meta"><p class="talk-name">Audience</p>...</div>
    let sectionSpeaker: string | null = null;
    const talkName = $section.find('.talk-meta .talk-name').text().trim();
    if (talkName) {
      sectionSpeaker = talkName;
    }

    // Process paragraphs in this section
    $section.children('p').each((_, pEl) => {
      const $p = $(pEl);

      // Skip timestamp paragraphs and talk-name paragraphs
      if ($p.hasClass('talk-timestamp') || $p.hasClass('talk-name')) return;

      // Extract paragraph text (preserving structure but removing inline markup)
      const text = $p.text().trim();

      // Skip empty paragraphs
      if (!text) return;

      // Find preceding timestamp
      // Pattern: <div class="talk-meta"><p class="talk-timestamp">MM:SS</p></div><p>...</p>
      let timestamp: string | null = null;
      const $prev = $p.prev();
      if ($prev.is('div.talk-meta')) {
        const timestampText = $prev.find('p.talk-timestamp').text().trim();
        timestamp = timestampText || null;
      }

      // Use section speaker if available, otherwise default to authorName
      const speaker = sectionSpeaker || authorName;

      // Compute content hash
      const contentHash = hashParagraph(text);

      paragraphs.push({
        position: paragraphs.length, // Zero-indexed sequential position
        speaker,
        timestamp,
        text,
        contentHash,
      });
    });
  });

  return {
    id,
    url,
    title,
    date,
    location,
    speakers,
    durationMinutes,
    wordCount,
    topicTags,
    referencedAuthors,
    description,
    paragraphs,
  };
}
