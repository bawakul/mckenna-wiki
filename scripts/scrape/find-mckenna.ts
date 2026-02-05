/**
 * Find McKenna transcripts on organism.earth
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 - McKenna Corpus Educational Research';
const REQUEST_DELAY = 3000;
const SAMPLES_DIR = path.join(__dirname, 'samples');

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchUrl(url: string): Promise<string | null> {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
    });
    console.log(`✓ Success (${response.data.length} bytes)`);
    return response.data;
  } catch (error) {
    console.log(`✗ Failed`);
    return null;
  }
}

async function main() {
  console.log('Looking for Terence McKenna transcripts...\n');

  // Try McKenna author page
  const authorUrls = [
    'https://www.organism.earth/library/author/terence-mckenna',
    'https://organism.earth/library/author/terence-mckenna',
    'https://www.organism.earth/library/author/terence_mckenna',
    'https://www.organism.earth/library/author/terencemckenna',
  ];

  let mckennaPage: string | null = null;
  let mckennaUrl: string | null = null;

  for (const url of authorUrls) {
    const html = await fetchUrl(url);
    if (html) {
      mckennaPage = html;
      mckennaUrl = url;
      break;
    }
    await delay(REQUEST_DELAY);
  }

  if (mckennaPage && mckennaUrl) {
    console.log(`\n✓ Found McKenna author page: ${mckennaUrl}\n`);

    // Save it
    fs.writeFileSync(path.join(SAMPLES_DIR, 'mckenna-author.html'), mckennaPage);

    // Extract document links
    const $ = cheerio.load(mckennaPage);
    const documentLinks: string[] = [];

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/document/')) {
        const absoluteUrl = href.startsWith('http')
          ? href
          : new URL(href, mckennaUrl).toString();
        documentLinks.push(absoluteUrl);
      }
    });

    console.log(`Found ${documentLinks.length} document links\n`);

    // Fetch first 3 actual transcript documents
    const sampledocs = documentLinks.slice(0, 3);

    for (let i = 0; i < sampledocs.length; i++) {
      await delay(REQUEST_DELAY);

      const docUrl = sampledocs[i];
      const html = await fetchUrl(docUrl);

      if (html) {
        const filename = path.join(SAMPLES_DIR, `mckenna-doc-${i + 1}.html`);
        fs.writeFileSync(filename, html);
        console.log(`Saved to: ${filename}\n`);

        // Quick analysis
        const $ = cheerio.load(html);
        const title = $('h1').first().text().trim();
        const paragraphs = $('p').length;

        console.log(`Title: ${title}`);
        console.log(`Paragraphs: ${paragraphs}\n`);
      }
    }
  } else {
    console.log('\n✗ Could not find McKenna author page');
    console.log('Trying direct document URLs...\n');

    // Try some known McKenna lecture titles
    const possibleSlugs = [
      'psychedelics-in-the-age-of-intelligent-machines',
      'dreaming-awake-at-the-end-of-time',
      'timewave-zero',
      'archaic-revival',
      'culture-and-ideology-not-nature-and-reality',
    ];

    for (const slug of possibleSlugs) {
      await delay(REQUEST_DELAY);

      const url = `https://www.organism.earth/library/document/${slug}`;
      const html = await fetchUrl(url);

      if (html) {
        const filename = path.join(SAMPLES_DIR, `mckenna-${slug}.html`);
        fs.writeFileSync(filename, html);
        console.log(`✓ Found: ${slug}\n`);
      }
    }
  }
}

main().catch(console.error);
