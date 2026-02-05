/**
 * Exploratory scraping script for organism.earth
 *
 * Purpose: Discover HTML structure of transcript pages to inform scraper design
 *
 * This script:
 * 1. Fetches the transcript index page
 * 2. Discovers transcript URLs
 * 3. Fetches 3-5 sample transcript pages
 * 4. Logs structure analysis for each page
 * 5. Saves raw HTML samples for offline analysis
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Polite scraping configuration
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 - McKenna Corpus Educational Research';
const REQUEST_DELAY = 3000; // 3 seconds between requests

// Possible index URLs to try
const INDEX_URLS = [
  'https://www.organism.earth/library',
  'https://organism.earth/library',
  'https://www.organism.earth/library/document',
  'https://organism.earth/library/document',
  'https://www.organism.earth/',
  'https://organism.earth/',
];

const SAMPLES_DIR = path.join(__dirname, 'samples');

// Ensure samples directory exists
if (!fs.existsSync(SAMPLES_DIR)) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

/**
 * Polite delay between requests
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with proper headers
 */
async function fetchUrl(url: string): Promise<string | null> {
  try {
    console.log(`\nFetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      timeout: 15000,
      validateStatus: (status) => status < 500, // Accept 404 as valid response
    });

    if (response.status === 200) {
      console.log(`✓ Success (${response.data.length} bytes)`);
      return response.data;
    } else {
      console.log(`✗ Status ${response.status}`);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`✗ Error: ${error.message}`);
    } else {
      console.log(`✗ Unexpected error:`, error);
    }
    return null;
  }
}

/**
 * Discover transcript URLs from index page
 */
async function discoverTranscriptUrls(): Promise<string[]> {
  console.log('=== DISCOVERING TRANSCRIPT URLS ===\n');

  for (const indexUrl of INDEX_URLS) {
    const html = await fetchUrl(indexUrl);
    if (!html) {
      await delay(REQUEST_DELAY);
      continue;
    }

    const $ = cheerio.load(html);

    // Try different possible link patterns
    const links: string[] = [];

    // Look for links containing "transcript", "document", "library"
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().toLowerCase();

      if (href && (
        href.includes('transcript') ||
        href.includes('document') ||
        href.includes('library') ||
        text.includes('mckenna') ||
        text.includes('terence')
      )) {
        // Resolve relative URLs
        const absoluteUrl = href.startsWith('http')
          ? href
          : new URL(href, indexUrl).toString();
        links.push(absoluteUrl);
      }
    });

    if (links.length > 0) {
      console.log(`\n✓ Found ${links.length} potential transcript URLs from ${indexUrl}`);
      console.log('Sample URLs:');
      links.slice(0, 5).forEach(url => console.log(`  - ${url}`));

      // Save index page HTML
      const indexFilename = path.join(SAMPLES_DIR, 'index.html');
      fs.writeFileSync(indexFilename, html);
      console.log(`\nSaved index page to: ${indexFilename}`);

      return links;
    }

    await delay(REQUEST_DELAY);
  }

  console.log('\n✗ Could not find transcript index page');
  console.log('Will try direct transcript URLs as fallback...\n');
  return [];
}

/**
 * Analyze structure of a transcript page
 */
function analyzeTranscriptPage(html: string, url: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(`ANALYZING: ${url}`);
  console.log('='.repeat(80));

  const $ = cheerio.load(html);

  // Title
  console.log('\n--- TITLE ---');
  const title = $('h1').first().text().trim() ||
                $('title').text().trim() ||
                $('head > meta[property="og:title"]').attr('content') ||
                'NOT FOUND';
  console.log(`Text: "${title}"`);
  console.log(`Selector: h1:first-child (or title tag)`);

  // Date
  console.log('\n--- DATE ---');
  const dateSelectors = [
    'time',
    '[datetime]',
    '.date',
    '[class*="date"]',
    '[id*="date"]',
  ];
  let dateFound = false;
  for (const selector of dateSelectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      console.log(`Selector: ${selector}`);
      console.log(`Text: "${el.text().trim()}"`);
      console.log(`Datetime attr: "${el.attr('datetime') || 'none'}"`);
      dateFound = true;
      break;
    }
  }
  if (!dateFound) {
    console.log('NOT FOUND - will need to search in metadata area');
  }

  // Metadata (location, speakers, duration, etc.)
  console.log('\n--- METADATA FIELDS ---');
  const metadataSelectors = [
    '.metadata',
    '[class*="meta"]',
    '[class*="info"]',
    'dl', // Definition list
    '[class*="detail"]',
  ];
  let metadataFound = false;
  for (const selector of metadataSelectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      console.log(`Metadata container: ${selector}`);
      console.log(`Content sample: "${el.text().trim().substring(0, 200)}..."`);

      // Look for key-value pairs
      const dts = el.find('dt');
      const dds = el.find('dd');
      if (dts.length > 0) {
        console.log('\nKey-value pairs found:');
        dts.each((i, dt) => {
          const key = $(dt).text().trim();
          const value = $(dds[i]).text().trim();
          console.log(`  ${key}: ${value}`);
        });
      }

      metadataFound = true;
      break;
    }
  }
  if (!metadataFound) {
    console.log('No structured metadata container found');
  }

  // Paragraphs
  console.log('\n--- PARAGRAPH STRUCTURE ---');
  const paragraphSelectors = [
    'article p',
    '.transcript p',
    '[class*="content"] p',
    'main p',
    'p',
  ];
  let paragraphsFound = false;
  for (const selector of paragraphSelectors) {
    const paragraphs = $(selector);
    if (paragraphs.length > 5) { // Assuming transcript has many paragraphs
      console.log(`Selector: ${selector}`);
      console.log(`Count: ${paragraphs.length}`);

      // Check first paragraph for structure
      const firstP = paragraphs.first();
      console.log(`\nFirst paragraph sample:`);
      console.log(`  HTML: ${$.html(firstP).substring(0, 200)}...`);
      console.log(`  Text: "${firstP.text().trim().substring(0, 150)}..."`);

      // Check for data attributes
      const firstPElement = firstP[0];
      const attrs = (firstPElement && 'attribs' in firstPElement) ? firstPElement.attribs : {};
      if (Object.keys(attrs).length > 0) {
        console.log(`  Attributes: ${JSON.stringify(attrs)}`);
      }

      paragraphsFound = true;
      break;
    }
  }
  if (!paragraphsFound) {
    console.log('Could not identify paragraph structure');
  }

  // Timestamps
  console.log('\n--- TIMESTAMPS ---');
  const timestampSelectors = [
    '[data-timestamp]',
    '[data-time]',
    '.timestamp',
    '[class*="time"]',
    'time[datetime]',
  ];
  let timestampFound = false;
  for (const selector of timestampSelectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      console.log(`Selector: ${selector}`);
      console.log(`Sample: "${el.text().trim()}"`);
      const dataAttr = el.attr('data-timestamp') || el.attr('data-time') || el.attr('datetime');
      if (dataAttr) {
        console.log(`Data attribute: ${dataAttr}`);
      }
      timestampFound = true;
      break;
    }
  }
  if (!timestampFound) {
    console.log('No timestamps found - may not be available on this page');
  }

  // Speaker identification
  console.log('\n--- SPEAKER IDENTIFICATION ---');
  const speakerSelectors = [
    '[data-speaker]',
    '.speaker',
    '[class*="speaker"]',
    'strong', // Sometimes speakers are in bold
    'em', // Or italic
  ];
  let speakerFound = false;
  for (const selector of speakerSelectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      console.log(`Potential selector: ${selector}`);
      console.log(`Sample: "${el.text().trim()}"`);
      const dataAttr = el.attr('data-speaker');
      if (dataAttr) {
        console.log(`Data attribute: ${dataAttr}`);
      }
      speakerFound = true;
      // Don't break - show multiple potential patterns
    }
  }
  if (!speakerFound) {
    console.log('No explicit speaker identification found');
  }

  // Summary/Description
  console.log('\n--- SUMMARY/DESCRIPTION ---');
  const summarySelectors = [
    '[class*="summary"]',
    '[class*="description"]',
    '[class*="abstract"]',
    'meta[name="description"]',
  ];
  for (const selector of summarySelectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      console.log(`Selector: ${selector}`);
      if (selector.startsWith('meta')) {
        console.log(`Content: "${el.attr('content')}"`);
      } else {
        console.log(`Content: "${el.text().trim().substring(0, 200)}..."`);
      }
      break;
    }
  }

  // Overall structure insights
  console.log('\n--- OVERALL STRUCTURE ---');
  console.log(`Total links: ${$('a').length}`);
  console.log(`Total paragraphs: ${$('p').length}`);
  console.log(`Total headings: ${$('h1, h2, h3, h4, h5, h6').length}`);
  console.log(`Has article tag: ${$('article').length > 0}`);
  console.log(`Has main tag: ${$('main').length > 0}`);

  // Check for common class patterns
  const bodyClasses = $('body').attr('class') || '';
  const bodyId = $('body').attr('id') || '';
  if (bodyClasses) {
    console.log(`Body classes: ${bodyClasses}`);
  }
  if (bodyId) {
    console.log(`Body id: ${bodyId}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Organism.earth Structure Explorer                           ║');
  console.log('║  Purpose: Discover HTML structure for scraper design         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Discover transcript URLs
  let transcriptUrls = await discoverTranscriptUrls();

  // If no URLs found, try some known direct URLs as fallback
  if (transcriptUrls.length === 0) {
    console.log('\nTrying direct transcript URLs as fallback...');
    transcriptUrls = [
      'https://organism.earth/library/document/language-technology-and-culture',
      'https://organism.earth/library/document/dream-theory',
      'https://organism.earth/library/document/alchemy-and-the-hermetic-tradition',
    ];
  }

  // Step 2: Sample 3-5 transcripts
  const samplesToAnalyze = transcriptUrls.slice(0, 5);
  console.log(`\n\nWill analyze ${samplesToAnalyze.length} sample transcripts...\n`);

  let successCount = 0;

  for (const url of samplesToAnalyze) {
    await delay(REQUEST_DELAY);

    const html = await fetchUrl(url);
    if (!html) {
      console.log('Skipping due to fetch failure\n');
      continue;
    }

    // Save sample
    const filename = path.join(
      SAMPLES_DIR,
      `transcript-${successCount + 1}.html`
    );
    fs.writeFileSync(filename, html);
    console.log(`Saved to: ${filename}`);

    // Analyze
    analyzeTranscriptPage(html, url);

    successCount++;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('EXPLORATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nSuccessfully analyzed: ${successCount} transcripts`);
  console.log(`Samples saved to: ${SAMPLES_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Review output above for selector patterns');
  console.log('2. Examine saved HTML files in samples/ directory');
  console.log('3. Document findings in scripts/scrape/SELECTORS.md');
  console.log('4. Use documented selectors to build scraper\n');

  if (successCount === 0) {
    console.log('\n⚠️  WARNING: No transcripts were successfully analyzed');
    console.log('Possible issues:');
    console.log('  - Site may be blocking requests (check User-Agent)');
    console.log('  - URLs may have changed');
    console.log('  - Network connectivity issues');
    console.log('  - robots.txt may disallow scraping');
    console.log('\nRecommendations:');
    console.log('  - Check robots.txt at organism.earth/robots.txt');
    console.log('  - Try accessing URLs in a browser');
    console.log('  - Consider reaching out to organism.earth for API access\n');
  }
}

main().catch(console.error);
