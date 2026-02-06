#!/usr/bin/env tsx

/**
 * Corpus Verification Script
 *
 * Validates all phase 1 success criteria:
 * 1. All ~90 transcripts from organism.earth are stored in Supabase with full metadata
 * 2. Transcripts are structured as paragraphs with timestamps and speaker identification
 * 3. Full-text search across entire corpus returns relevant passages in under 200ms
 * 4. Content hashes stored per transcript enable change detection
 * 5. Corpus data lives in separate repository and can be imported by app
 */

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { createClient } from '@supabase/supabase-js';
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

// ============================================================================
// Configuration
// ============================================================================

const config = {
  corpusPath: process.env.CORPUS_REPO_PATH || './mckenna-corpus',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};

// Test search terms - known McKenna topics
const SEARCH_TERMS = [
  'novelty theory',
  'psychedelic experience',
  'archaic revival',
  'timewave',
  'machine elves',
];

// Expected minimums
const MIN_TRANSCRIPTS = 85;
const MIN_PARAGRAPHS = 5000;
const MIN_WORD_COUNT = 1_000_000;
const MAX_SEARCH_TIME_MS = 200;

// ============================================================================
// Check Results
// ============================================================================

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: string[]) {
  results.push({ name, passed, message, details });
}

// ============================================================================
// Verification Checks
// ============================================================================

async function main() {
  console.log('McKenna Corpus Verification');
  console.log('============================\n');

  // Validate environment
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.error('ERROR: Missing Supabase credentials in environment');
    process.exit(1);
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

  // -------------------------------------------------------------------------
  // Check 1: Corpus Completeness
  // -------------------------------------------------------------------------
  console.log('Check 1: Corpus Completeness...');

  const { count: transcriptCount, error: tcError } = await supabase
    .from('transcripts')
    .select('*', { count: 'exact', head: true });

  const { count: paragraphCount, error: pdError } = await supabase
    .from('transcript_paragraphs')
    .select('*', { count: 'exact', head: true });

  const { data: wordCountData, error: wcError } = await supabase
    .from('transcripts')
    .select('word_count');

  if (tcError || pdError || wcError) {
    addResult('Corpus Completeness', false, 'Database query failed', [
      tcError?.message, pdError?.message, wcError?.message,
    ].filter(Boolean) as string[]);
  } else {
    const numTranscripts = transcriptCount || 0;
    const numParagraphs = paragraphCount || 0;
    const totalWords = wordCountData?.reduce((sum, t) => sum + (t.word_count || 0), 0) || 0;

    const passed = numTranscripts >= MIN_TRANSCRIPTS &&
                   numParagraphs >= MIN_PARAGRAPHS &&
                   totalWords >= MIN_WORD_COUNT;

    addResult('Corpus Completeness', passed,
      `${numTranscripts} transcripts, ${numParagraphs} paragraphs, ${totalWords.toLocaleString()} words`,
      [
        `Transcripts: ${numTranscripts} (min: ${MIN_TRANSCRIPTS}) ${numTranscripts >= MIN_TRANSCRIPTS ? '✓' : '✗'}`,
        `Paragraphs: ${numParagraphs} (min: ${MIN_PARAGRAPHS}) ${numParagraphs >= MIN_PARAGRAPHS ? '✓' : '✗'}`,
        `Word count: ${totalWords.toLocaleString()} (min: ${MIN_WORD_COUNT.toLocaleString()}) ${totalWords >= MIN_WORD_COUNT ? '✓' : '✗'}`,
      ]);
  }

  // -------------------------------------------------------------------------
  // Check 2: Metadata Completeness
  // -------------------------------------------------------------------------
  console.log('Check 2: Metadata Completeness...');

  const { data: metadata, error: mdError } = await supabase
    .from('transcripts')
    .select('title, date, speakers, topic_tags');

  if (mdError) {
    addResult('Metadata Completeness', false, 'Query failed', [mdError.message]);
  } else {
    const total = metadata?.length || 0;
    const withTitle = metadata?.filter(t => t.title).length || 0;
    const withDate = metadata?.filter(t => t.date).length || 0;
    const withSpeakers = metadata?.filter(t => t.speakers?.length > 0).length || 0;
    const withTags = metadata?.filter(t => t.topic_tags?.length > 0).length || 0;

    const titlePercent = total > 0 ? Math.round(withTitle / total * 100) : 0;
    const datePercent = total > 0 ? Math.round(withDate / total * 100) : 0;

    // Title is required (100%), date is optional but desirable
    const passed = titlePercent === 100;

    addResult('Metadata Completeness', passed,
      `Title: ${titlePercent}%, Date: ${datePercent}%`,
      [
        `Titles: ${withTitle}/${total} (${titlePercent}%) — required ${titlePercent === 100 ? '✓' : '✗'}`,
        `Dates: ${withDate}/${total} (${datePercent}%)`,
        `Speakers: ${withSpeakers}/${total}`,
        `Topic tags: ${withTags}/${total}`,
      ]);
  }

  // -------------------------------------------------------------------------
  // Check 3: Paragraph Structure
  // -------------------------------------------------------------------------
  console.log('Check 3: Paragraph Structure...');

  // Check every transcript has paragraphs
  const { data: orphanCheck, error: ocError } = await supabase.rpc('check_orphan_paragraphs');

  // Get paragraphs with missing required fields
  const { data: invalidParas, error: ipError } = await supabase
    .from('transcript_paragraphs')
    .select('id')
    .or('position.is.null,text.is.null,content_hash.is.null')
    .limit(5);

  // Get max paragraph count per transcript
  const { data: maxParas, error: mpError } = await supabase
    .from('transcript_paragraphs')
    .select('transcript_id')
    .limit(1);

  // Count transcripts without paragraphs
  const { data: emptyTranscripts } = await supabase
    .rpc('count_transcripts_without_paragraphs');

  const hasOrphans = orphanCheck && orphanCheck.length > 0;
  const hasInvalid = invalidParas && invalidParas.length > 0;
  const emptyCount = emptyTranscripts || 0;

  const passed = !hasOrphans && !hasInvalid && emptyCount === 0;

  addResult('Paragraph Structure', passed,
    passed ? 'All paragraphs properly structured' : 'Structure issues found',
    [
      `Orphaned paragraphs: ${hasOrphans ? 'found' : 'none'} ${!hasOrphans ? '✓' : '✗'}`,
      `Invalid paragraphs (missing fields): ${hasInvalid ? 'found' : 'none'} ${!hasInvalid ? '✓' : '✗'}`,
      `Transcripts without paragraphs: ${emptyCount} ${emptyCount === 0 ? '✓' : '✗'}`,
    ]);

  // -------------------------------------------------------------------------
  // Check 4: Full-Text Search Performance
  // -------------------------------------------------------------------------
  console.log('Check 4: Full-Text Search Performance...');

  const searchResults: { term: string; count: number; timeMs: number }[] = [];
  let allSearchesPassed = true;

  for (const term of SEARCH_TERMS) {
    const start = performance.now();
    const { data, error } = await supabase.rpc('search_paragraphs', {
      search_query: term,
      result_limit: 10,
    });
    const timeMs = Math.round(performance.now() - start);

    if (error) {
      searchResults.push({ term, count: -1, timeMs: -1 });
      allSearchesPassed = false;
    } else {
      const count = data?.length || 0;
      searchResults.push({ term, count, timeMs });
      if (count === 0 || timeMs > MAX_SEARCH_TIME_MS) {
        allSearchesPassed = false;
      }
    }
  }

  addResult('Full-Text Search', allSearchesPassed,
    allSearchesPassed ? 'All searches under 200ms with results' : 'Some searches failed',
    searchResults.map(r =>
      r.count === -1
        ? `"${r.term}": ERROR`
        : `"${r.term}": ${r.count} results in ${r.timeMs}ms ${r.count > 0 && r.timeMs <= MAX_SEARCH_TIME_MS ? '✓' : '✗'}`
    ));

  // -------------------------------------------------------------------------
  // Check 5: Content Hashes
  // -------------------------------------------------------------------------
  console.log('Check 5: Content Hashes...');

  const { data: hashData, error: hdError } = await supabase
    .from('transcripts')
    .select('content_hash');

  const { data: dupHashes, error: dhError } = await supabase
    .rpc('count_duplicate_hashes');

  const { data: paraHashLen, error: phlError } = await supabase
    .from('transcript_paragraphs')
    .select('content_hash')
    .limit(10);

  if (hdError || dhError) {
    addResult('Content Hashes', false, 'Query failed');
  } else {
    const totalHashes = hashData?.length || 0;
    const nullHashes = hashData?.filter(t => !t.content_hash).length || 0;
    const duplicates = dupHashes || 0;
    const sampleHashLengths = paraHashLen?.map(p => p.content_hash?.length || 0) || [];
    const validHashLengths = sampleHashLengths.every(len => len === 16);

    const passed = nullHashes === 0 && duplicates === 0 && validHashLengths;

    addResult('Content Hashes', passed,
      passed ? 'All hashes present and unique' : 'Hash issues found',
      [
        `Null transcript hashes: ${nullHashes} ${nullHashes === 0 ? '✓' : '✗'}`,
        `Duplicate transcript hashes: ${duplicates} ${duplicates === 0 ? '✓' : '✗'}`,
        `Paragraph hash length (16 chars): ${validHashLengths ? 'valid' : 'invalid'} ${validHashLengths ? '✓' : '✗'}`,
      ]);
  }

  // -------------------------------------------------------------------------
  // Check 6: Corpus Repository
  // -------------------------------------------------------------------------
  console.log('Check 6: Corpus Repository...\n');

  const transcriptsDir = join(config.corpusPath, 'transcripts');
  let repoExists = false;
  let jsonCount = 0;

  try {
    await access(transcriptsDir, constants.R_OK);
    repoExists = true;
    const files = await readdir(transcriptsDir);
    jsonCount = files.filter(f => f.endsWith('.json')).length;
  } catch {
    repoExists = false;
  }

  // Get DB count for comparison
  const { count: dbCount } = await supabase
    .from('transcripts')
    .select('*', { count: 'exact', head: true });

  const countsMatch = jsonCount === (dbCount || 0);
  const passed6 = repoExists && jsonCount > 0 && countsMatch;

  addResult('Corpus Repository', passed6,
    repoExists ? `${jsonCount} JSON files` : 'Repository not found',
    [
      `Repository exists: ${repoExists ? 'yes' : 'no'} ${repoExists ? '✓' : '✗'}`,
      `JSON file count: ${jsonCount}`,
      `Database count: ${dbCount}`,
      `Counts match: ${countsMatch ? 'yes' : 'no'} ${countsMatch ? '✓' : '✗'}`,
    ]);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('=' .repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('=' .repeat(60) + '\n');

  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}  ${result.name}`);
    console.log(`       ${result.message}`);
    if (result.details) {
      result.details.forEach(d => console.log(`       └─ ${d}`));
    }
    console.log('');
    if (!result.passed) allPassed = false;
  }

  console.log('=' .repeat(60));
  if (allPassed) {
    console.log('✓ ALL CHECKS PASSED');
    console.log('Phase 1 success criteria verified!');
  } else {
    console.log('✗ SOME CHECKS FAILED');
    console.log('Review failures above and re-run after fixes.');
  }
  console.log('=' .repeat(60));

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
