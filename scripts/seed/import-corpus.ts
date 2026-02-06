#!/usr/bin/env tsx

/**
 * Corpus Import Script
 *
 * Imports McKenna transcript JSON files into Supabase database.
 * Uses content hashes for change detection - only updates when content changes.
 *
 * Usage:
 *   npm run seed                                  # Import from default path
 *   npm run seed -- --corpus-path ./path          # Import from specific path
 *   npm run seed:dry-run                          # Validate without writing to DB
 */

import { config as loadEnv } from 'dotenv';
// Load .env.local (Next.js convention) then fall back to .env
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// Types (independent from scraper types)
// ============================================================================

interface TranscriptJSON {
  id: string;
  url: string;
  title: string;
  date?: string;
  location?: string;
  speakers?: string[];
  durationMinutes?: number;
  wordCount?: number;
  topicTags?: string[];
  referencedAuthors?: string[];
  description?: string;
  contentHash: string;
  scrapedAt: string;
  paragraphs: ParagraphJSON[];
}

interface ParagraphJSON {
  position: number;
  speaker?: string;
  timestamp?: string;
  text: string;
  contentHash: string;
}

interface ImportStats {
  totalFiles: number;
  newImports: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

// ============================================================================
// Configuration
// ============================================================================

const config = {
  corpusPath: process.env.CORPUS_REPO_PATH || './mckenna-corpus',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  batchSize: 50, // Chunk paragraph inserts to avoid payload size limits
  dryRun: false,
};

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--corpus-path' && args[i + 1]) {
      config.corpusPath = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      config.dryRun = true;
    }
  }
}

// ============================================================================
// Main Import Logic
// ============================================================================

async function main() {
  parseArgs();

  console.log('McKenna Corpus Import');
  console.log('=====================\n');
  console.log(`Corpus path: ${config.corpusPath}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (no database writes)' : 'LIVE IMPORT'}\n`);

  // Validate environment variables
  if (!config.dryRun) {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      console.error('ERROR: Missing required environment variables\n');
      console.error('Required variables:');
      console.error('  SUPABASE_URL           - Your Supabase project URL');
      console.error('  SUPABASE_SERVICE_KEY   - Service role key (admin access)\n');
      console.error('Get these from: Supabase Dashboard -> Project Settings -> API\n');
      process.exit(1);
    }
  }

  // Initialize Supabase client (service role for admin access)
  const supabase = config.dryRun
    ? null
    : createClient(config.supabaseUrl!, config.supabaseServiceKey!);

  // Find all transcript JSON files
  const transcriptsDir = join(config.corpusPath, 'transcripts');
  let files: string[];

  try {
    files = await readdir(transcriptsDir);
    files = files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error(`ERROR: Could not read transcripts directory: ${transcriptsDir}`);
    console.error(error);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No JSON files found in transcripts directory');
    process.exit(0);
  }

  console.log(`Found ${files.length} transcript files\n`);

  // Import statistics
  const stats: ImportStats = {
    totalFiles: files.length,
    newImports: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Process each transcript file
  for (const file of files) {
    const filePath = join(transcriptsDir, file);

    try {
      // Parse JSON
      const content = await readFile(filePath, 'utf-8');
      const transcript: TranscriptJSON = JSON.parse(content);

      // Validate required fields
      if (!transcript.id || !transcript.title || !transcript.contentHash || !transcript.paragraphs) {
        throw new Error('Missing required fields (id, title, contentHash, or paragraphs)');
      }

      console.log(`Processing: ${transcript.title} (${transcript.id})`);

      if (config.dryRun) {
        console.log(`  ✓ Valid (${transcript.paragraphs.length} paragraphs)`);
        stats.skipped++;
        continue;
      }

      // Check if transcript exists with same content hash
      const { data: existing } = await supabase!
        .from('transcripts')
        .select('content_hash')
        .eq('id', transcript.id)
        .single();

      if (existing && existing.content_hash === transcript.contentHash) {
        console.log(`  → Unchanged, skipping`);
        stats.skipped++;
        continue;
      }

      const isNew = !existing;

      // Upsert transcript metadata
      const { error: transcriptError } = await supabase!
        .from('transcripts')
        .upsert({
          id: transcript.id,
          url: transcript.url,
          title: transcript.title,
          date: transcript.date || null,
          location: transcript.location || null,
          speakers: transcript.speakers || [],
          duration_minutes: transcript.durationMinutes ? Math.round(transcript.durationMinutes) : null,
          word_count: transcript.wordCount || null,
          topic_tags: transcript.topicTags || [],
          referenced_authors: transcript.referencedAuthors || [],
          description: transcript.description || null,
          content_hash: transcript.contentHash,
          scraped_at: transcript.scrapedAt,
        });

      if (transcriptError) {
        throw transcriptError;
      }

      // Delete existing paragraphs (if updating)
      if (!isNew) {
        const { error: deleteError } = await supabase!
          .from('transcript_paragraphs')
          .delete()
          .eq('transcript_id', transcript.id);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Insert paragraphs in batches
      const paragraphs = transcript.paragraphs.map(p => ({
        transcript_id: transcript.id,
        position: p.position,
        speaker: p.speaker || null,
        timestamp: p.timestamp || null,
        text: p.text,
        content_hash: p.contentHash,
      }));

      for (let i = 0; i < paragraphs.length; i += config.batchSize) {
        const batch = paragraphs.slice(i, i + config.batchSize);
        const { error: insertError } = await supabase!
          .from('transcript_paragraphs')
          .insert(batch);

        if (insertError) {
          throw insertError;
        }
      }

      if (isNew) {
        console.log(`  ✓ Imported (${paragraphs.length} paragraphs)`);
        stats.newImports++;
      } else {
        console.log(`  ✓ Updated (${paragraphs.length} paragraphs)`);
        stats.updated++;
      }

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { message?: string })?.message || JSON.stringify(error);
      console.error(`  ✗ Failed: ${errorMessage}`);
      stats.failed++;
      stats.errors.push({
        file,
        error: errorMessage,
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));
  console.log(`Total files:    ${stats.totalFiles}`);
  console.log(`New imports:    ${stats.newImports}`);
  console.log(`Updated:        ${stats.updated}`);
  console.log(`Skipped:        ${stats.skipped}`);
  console.log(`Failed:         ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }

  console.log('');
  process.exit(stats.failed > 0 ? 1 : 0);
}

// ============================================================================
// Execute
// ============================================================================

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
