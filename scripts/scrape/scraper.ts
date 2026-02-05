#!/usr/bin/env tsx

import axios from 'axios';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import pLimit from 'p-limit';
import { parseTranscriptIndex, parseTranscriptPage } from './parser';
import { hashTranscriptContent } from './hash-utils';
import { TranscriptSchema, Transcript } from './types';

/**
 * Configuration
 */
interface Config {
  /** Maximum number of transcripts to scrape (0 = all) */
  limit: number;
  /** Output directory for JSON files */
  outputDir: string;
  /** Delay between requests in milliseconds */
  delayMs: number;
  /** Maximum retry attempts */
  maxRetries: number;
}

/**
 * Scraping statistics
 */
interface Stats {
  totalFound: number;
  totalScraped: number;
  totalFailed: number;
  totalParagraphs: number;
  totalWords: number;
  failedUrls: Array<{ url: string; error: string }>;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): Partial<Config> {
  const args = process.argv.slice(2);
  const config: Partial<Config> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      config.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      config.outputDir = args[i + 1];
      i++;
    }
  }

  return config;
}

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch HTML with retry logic
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number,
  attempt = 1
): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 - McKenna Corpus Educational Research',
      },
      responseEncoding: 'utf8',
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const isRetryable = status === 429 || (status >= 500 && status < 600);

    if (isRetryable && attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(
        `  ⚠️  Request failed (${status}), retrying in ${backoffMs / 1000}s... (attempt ${attempt + 1}/${maxRetries})`
      );
      await delay(backoffMs);
      return fetchWithRetry(url, maxRetries, attempt + 1);
    }

    throw error;
  }
}

/**
 * Scrape a single transcript
 */
async function scrapeTranscript(
  url: string,
  config: Config
): Promise<Transcript> {
  // Fetch page HTML
  const html = await fetchWithRetry(url, config.maxRetries);

  // Parse transcript
  const parsed = parseTranscriptPage(html, url);

  // Add content hash
  const contentHash = hashTranscriptContent(parsed.title, parsed.paragraphs);

  // Add scraped timestamp
  const scrapedAt = new Date().toISOString();

  const transcript: Transcript = {
    ...parsed,
    contentHash,
    scrapedAt,
  };

  // Validate against schema
  TranscriptSchema.parse(transcript);

  return transcript;
}

/**
 * Main scraper orchestrator
 */
async function main() {
  console.log('🕷️  McKenna Transcript Scraper\n');

  // Parse CLI arguments
  const argConfig = parseArgs();

  // Default configuration
  const config: Config = {
    limit: argConfig.limit || 0, // 0 = all
    outputDir:
      argConfig.outputDir ||
      process.env.CORPUS_REPO_PATH ||
      './corpus/transcripts',
    delayMs: 2500, // 2.5 seconds between requests
    maxRetries: 3,
  };

  console.log('Configuration:');
  console.log(`  Output directory: ${config.outputDir}`);
  console.log(`  Limit: ${config.limit || 'none (scrape all)'}`);
  console.log(`  Delay: ${config.delayMs}ms between requests`);
  console.log(`  Max retries: ${config.maxRetries}\n`);

  // Create output directory
  await mkdir(config.outputDir, { recursive: true });
  console.log(`✅ Output directory ready: ${config.outputDir}\n`);

  // Stats tracking
  const stats: Stats = {
    totalFound: 0,
    totalScraped: 0,
    totalFailed: 0,
    totalParagraphs: 0,
    totalWords: 0,
    failedUrls: [],
  };

  try {
    // Step 1: Fetch transcript index
    console.log('📋 Fetching transcript index from organism.earth...');
    const indexUrl = 'https://www.organism.earth/library/author/terence-mckenna';
    const indexHtml = await fetchWithRetry(indexUrl, config.maxRetries);

    // Step 2: Extract transcript URLs
    const allUrls = parseTranscriptIndex(indexHtml);
    stats.totalFound = allUrls.length;
    console.log(`✅ Found ${stats.totalFound} McKenna transcripts\n`);

    // Apply limit
    const urlsToScrape = config.limit > 0 ? allUrls.slice(0, config.limit) : allUrls;
    console.log(`📥 Scraping ${urlsToScrape.length} transcripts...\n`);

    // Step 3: Scrape each transcript with rate limiting
    const limit = pLimit(1); // One at a time (sequential)

    const scrapePromises = urlsToScrape.map((url, index) =>
      limit(async () => {
        const transcriptNum = index + 1;
        const id = url.split('/').pop() || url;

        try {
          console.log(`[${transcriptNum}/${urlsToScrape.length}] Scraping: ${id}`);

          // Scrape transcript
          const transcript = await scrapeTranscript(url, config);

          // Write to file
          const outputPath = join(config.outputDir, `${transcript.id}.json`);
          await writeFile(outputPath, JSON.stringify(transcript, null, 2), 'utf8');

          // Update stats
          stats.totalScraped++;
          stats.totalParagraphs += transcript.paragraphs.length;
          stats.totalWords += transcript.wordCount || 0;

          console.log(
            `  ✅ ${transcript.title} (${transcript.paragraphs.length} paragraphs, ${transcript.wordCount?.toLocaleString() || '?'} words)`
          );

          // Polite delay before next request (except for last item)
          if (index < urlsToScrape.length - 1) {
            await delay(config.delayMs);
          }
        } catch (error: any) {
          stats.totalFailed++;
          const errorMsg = error.message || 'Unknown error';
          stats.failedUrls.push({ url, error: errorMsg });

          console.error(`  ❌ Failed: ${errorMsg}`);
        }
      })
    );

    await Promise.all(scrapePromises);

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Scraping Summary');
    console.log('='.repeat(60));
    console.log(`Total found:      ${stats.totalFound}`);
    console.log(`Total scraped:    ${stats.totalScraped} ✅`);
    console.log(`Total failed:     ${stats.totalFailed} ❌`);
    console.log(`Total paragraphs: ${stats.totalParagraphs.toLocaleString()}`);
    console.log(`Total words:      ${stats.totalWords.toLocaleString()}`);

    if (stats.failedUrls.length > 0) {
      console.log('\nFailed URLs:');
      stats.failedUrls.forEach(({ url, error }) => {
        console.log(`  - ${url}`);
        console.log(`    Error: ${error}`);
      });
    }

    console.log('\n✨ Done!\n');
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
