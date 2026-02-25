#!/usr/bin/env tsx
/**
 * Spot-check script: Fetch a sample of transcripts and check for audience content
 * using the updated parser that processes section.talk-secondary elements.
 *
 * Run: npx tsx scripts/scrape/spot-check.ts
 */

import axios from 'axios';
import { parseTranscriptPage } from './parser';

// Sample of Q&A-likely transcripts to spot-check
// Mix of seminar/workshop talks (likely Q&A) and lecture formats
const spotCheckUrls = [
  'https://www.organism.earth/library/document/eros-and-the-eschaton',
  'https://www.organism.earth/library/document/virtual-reality-interview',
  'https://www.organism.earth/library/document/man-and-woman-at-the-end-of-history',
  'https://www.organism.earth/library/document/new-and-old-maps-of-hyperspace',
  'https://www.organism.earth/library/document/trialogues-metamorphosis',
  'https://www.organism.earth/library/document/shamanism-alchemy-millennium',
  'https://www.organism.earth/library/document/the-evolutionary-mind',
  'https://www.organism.earth/library/document/rap-dancing-into-the-third-millennium',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkTranscript(url: string): Promise<void> {
  const id = url.split('/').pop() || url;
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 - McKenna Corpus Educational Research' },
      timeout: 30000,
    });
    const parsed = parseTranscriptPage(response.data, url);
    const speakers = new Set(parsed.paragraphs.map(p => p.speaker));
    const nonMcKenna = parsed.paragraphs.filter(p => p.speaker !== 'Terence McKenna' && p.speaker !== 'McKenna');

    const hasAudience = nonMcKenna.length > 0;
    const flag = hasAudience ? '*** HAS AUDIENCE CONTENT ***' : 'monologue only';

    console.log(id);
    console.log(`  Total paragraphs: ${parsed.paragraphs.length}`);
    console.log(`  Secondary speaker paragraphs: ${nonMcKenna.length}`);
    console.log(`  All speakers: ${[...speakers].join(', ')}`);
    console.log(`  Status: ${flag}`);
    if (hasAudience) {
      const first = nonMcKenna[0];
      if (first) {
        console.log(`  First audience para: [${first.position}] (${first.speaker}): ${first.text.slice(0, 80)}...`);
      }
    }
    console.log();
  } catch (e: any) {
    console.log(`ERROR fetching ${id}: ${e.message}`);
    console.log();
  }
}

async function main() {
  console.log(`Spot-checking ${spotCheckUrls.length} transcripts for audience content...\n`);
  console.log('(Using updated parser that processes section.talk-secondary)\n');

  for (const url of spotCheckUrls) {
    await checkTranscript(url);
    await delay(2000);
  }

  console.log('Spot-check complete.');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
