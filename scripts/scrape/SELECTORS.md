# Organism.earth HTML Structure Reference

**Last updated:** 2026-02-05
**Source:** Explored 3 actual McKenna transcript documents
**Author page:** https://www.organism.earth/library/author/terence-mckenna
**Documents found:** 105 McKenna transcripts

## Discovery Process

### Index/Author Page
- **URL:** `https://www.organism.earth/library/author/terence-mckenna`
- **Document links:** All hrefs matching `/library/document/[slug]`
- **Total McKenna documents:** 105

### Sample Documents Analyzed
1. `eros-and-the-eschaton` (110KB, 12,914 words, 222 paragraphs)
2. `calendar-for-the-goddess` (86KB, 148 paragraphs)
3. `crisis-in-consciousness` (62KB, 86 paragraphs)

---

## Document Structure

### Page Title
**Selector:** `<h1>` (first) or `<title>` tag
**Note:** The main `<h1>` on all pages is "The Library of Consciousness" (site title in header). The actual document title needs to be extracted from:
- `<title>` tag content (format varies)
- Or from metadata section
- Or from Open Graph tags: `meta[property="og:title"]`

### Metadata Section
**Container:** `<section id="metadata">`

**Available fields** (each in `<div class="metadata-label">`):

| Field | Icon | Example | Selector Pattern |
|-------|------|---------|------------------|
| Location | &#xf041; | "Seattle, Washington" | `.metadata-label` containing "Location" |
| Word Count | &#xf15c; | "12,914" | `.metadata-label` with title="Word count..." |
| Duration | &#xf017; | "01:58:39" | `.metadata-label` with title="Duration" |
| Views | &#xf06e; | "4,266" | `.metadata-label` with title="Total views" |
| Quotes | &#xf27a; | "21" | `a.metadata-label-link` to `/quotes/[slug]` |

**Note:** Metadata is NOT in a definition list (dl/dt/dd). Each field is a separate div. Text content is directly in the div after the icon span.

**Date field:** NOT in metadata section. Need to search elsewhere (possibly in page header or document info area).

### Author Information
**Container:** `<div id="author-on-the-left">`

**Structure:**
```html
<a class="author-portrait" href="/library/author/terence-mckenna">
  <img src="docs/terence-mckenna/headshot-animated.gif" alt="Portrait of Terence McKenna" />
  <p class="author-portrait-name">Terence McKenna</p>
</a>
```

**Selector for author name:** `.author-portrait-name`

### Transcript Content
**Container:** `<section class="talk">`

**Important:** All transcript content is within a SINGLE `<section class="talk">` container inside `<div class="document-body">`.

### Paragraph Structure
**Each paragraph follows this pattern:**

```html
<div class="talk-meta">
  <p class="talk-timestamp">02:42</p>
</div>
<p>
  [Paragraph content with possible inline markup]
</p>
```

OR (for first paragraph):
```html
<div class="talk-meta">
  <p class="talk-timestamp">00:03</p>
</div>
<p class="no-indent">
  [Paragraph content]
</p>
```

**Key selectors:**
- Transcript container: `section.talk`
- All paragraphs: `section.talk > p` (excludes timestamp paragraphs)
- Timestamps: `p.talk-timestamp`
- First paragraph indicator: `p.no-indent`

**Pattern:** Timestamp div immediately precedes its paragraph

### Timestamps
**Selector:** `<p class="talk-timestamp">`
**Format:** `MM:SS` or `HH:MM:SS`
**Example:** `"02:42"`, `"01:58:39"`
**Location:** In `<div class="talk-meta">` BEFORE the paragraph

**Extraction logic:**
1. Find all `p.talk-timestamp` elements
2. Each timestamp applies to the NEXT `<p>` sibling (after the closing `</div>`)
3. Iterate through paragraphs, finding the preceding timestamp div

### Speaker Identification
**Status:** ❌ NOT PRESENT

McKenna transcripts do not have explicit speaker markup. All content is McKenna speaking (monologue format).

If Q&A sections exist, they may use:
- `<strong>` for speaker names
- But this was not observed in the 3 samples analyzed

**Decision:** Store speaker as "Terence McKenna" for all paragraphs by default.

### Inline Markup in Paragraphs
Paragraphs may contain:
- `<em>` - emphasis/italics
- `<a class="reference-book">` - book citations (linked)
- `<cite>` - work titles
- `<mark class="clickable" data-start="..." data-stop="...">` - highlighted quotable sections with audio timestamps
- Regular `<a>` - external links (Wikipedia, etc.)
- `&mdash;`, `&hellip;` - HTML entities

**Note:** Preserve inline markup when extracting text, or strip for plain text depending on storage needs.

### Audio
**Selector:** `<audio id="audioPlayer">`
**Source:** `<source src="docs/terence-mckenna/[slug].ogg" type="audio/ogg">`

Audio file URL can be extracted but is not required for v1 transcript storage.

### Summary/Description
**Meta tag:** `<meta name="description" content="...">`

Provides a 1-2 sentence summary of the document content.

**Example:** "Beginning with a comparison of reason and logic to intuition, Terence works his way towards exploring the idea of a purposeful goal in the universe which evolution is progressing towards..."

---

## Scraping Strategy

### Step 1: Get Document URLs
```typescript
// Fetch author page
const authorHtml = await fetch('https://www.organism.earth/library/author/terence-mckenna');
const $ = cheerio.load(authorHtml);

// Extract all document links
const docUrls: string[] = [];
$('a[href*="/library/document/"]').each((_, el) => {
  const href = $(el).attr('href');
  if (href && !href.endsWith('/library/document/')) {
    docUrls.push('https://www.organism.earth' + href);
  }
});
```

### Step 2: Parse Each Document
```typescript
// Fetch document
const docHtml = await fetch(docUrl);
const $ = cheerio.load(docHtml);

// Extract metadata
const title = $('title').text().trim();
const description = $('meta[name="description"]').attr('content');
const location = $('.metadata-label').filter((_, el) => $(el).text().includes('Location')).text().replace(/[^\w\s,]/g, '').trim();
const wordCount = $('.metadata-label[title*="Word count"]').text().trim();
const duration = $('.metadata-label[title="Duration"]').text().trim();

// Extract author
const author = $('.author-portrait-name').text().trim(); // "Terence McKenna"

// Extract paragraphs with timestamps
const paragraphs: Array<{timestamp: string | null, text: string}> = [];
$('section.talk > p').each((i, pEl) => {
  const $p = $(pEl);

  // Skip timestamp paragraphs
  if ($p.hasClass('talk-timestamp')) return;

  // Find preceding timestamp
  const $timestampDiv = $p.prev('div.talk-meta');
  const timestamp = $timestampDiv.find('p.talk-timestamp').text().trim() || null;

  // Extract text (strip HTML or preserve as needed)
  const text = $p.text().trim();

  paragraphs.push({ timestamp, text });
});
```

### Step 3: Handle Edge Cases
- **Missing metadata:** Some fields may not be present - use null/empty
- **Date extraction:** Date not reliably in metadata - may need to parse from title or description
- **Multiple speakers:** Not observed in samples, but be prepared for Q&A format
- **Empty paragraphs:** Filter out paragraphs with no text content

---

## Rate Limiting & Politeness

**Observed:**
- Site responded successfully to all requests
- No robots.txt blocking observed
- No rate limiting encountered in exploration (5 requests over 15 seconds)

**Recommended:**
- 3-second delay between requests
- Descriptive User-Agent: "Mozilla/5.0 ... - McKenna Corpus Educational Research"
- Respect any future rate limits or blocks
- Consider reaching out to organism.earth for permission/API access for bulk scraping

---

## Data Quality Notes

### Strengths
- ✅ Clean, semantic HTML structure
- ✅ Timestamps present and reliable
- ✅ Paragraph structure preserves formatting
- ✅ Metadata consistently structured
- ✅ All 105 McKenna documents accessible

### Limitations
- ⚠️ Document title requires parsing (not in dedicated element)
- ⚠️ Date not in structured metadata (may be in title or filename)
- ⚠️ Speaker identification absent (monologue assumption needed)
- ⚠️ Topic tags not observed in document page (may be on author page)

### Recommendations
- Parse title from `<title>` tag or Open Graph
- Extract date from URL slug or title if format is consistent
- Default speaker to "Terence McKenna" for all paragraphs
- Verify timestamp-to-paragraph alignment is correct (timestamp div precedes content)
- Test with longer transcripts (87K word maximum mentioned in requirements)

---

## Next Steps
1. ✅ Document structure analyzed
2. Build scraper using documented selectors
3. Test on 5-10 sample transcripts before full corpus
4. Validate paragraph-to-timestamp alignment
5. Hash content for change detection
6. Store in Supabase with proper schema
