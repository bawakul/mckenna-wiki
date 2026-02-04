# Domain Pitfalls: Text Annotation & Qualitative Analysis Tools

**Domain:** Transcript annotation and qualitative analysis web application
**Researched:** 2026-02-04
**Confidence:** MEDIUM (mix of verified patterns and domain-specific WebSearch findings)

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or project abandonment.

### Pitfall 1: The Tool vs. Analysis Trap

**What goes wrong:** Spending months building the perfect annotation tool while never actually analyzing the McKenna transcripts. The tool becomes the project instead of the means to the project.

**Why it happens:** Tool building provides immediate, measurable progress (features shipped, UI polished) while actual qualitative analysis is ambiguous, iterative, and hard. Research shows that confusing productive preparation with actual implementation is a common procrastination pattern—the system becomes a substitute for the work itself.

**Consequences:**
- 6 months later, beautiful annotation interface exists but zero insights about McKenna's work
- Lost momentum and interest in the original research question
- Tool complexity grows beyond the actual needs of the analysis
- The project never reaches its actual goal

**Prevention:**
1. **Time-box tool building:** Set hard deadline (e.g., 2 weeks for MVP)
2. **Start with minimal tooling:** Use existing tools (Hypothesis, Google Docs comments) for first 10 transcripts before building anything
3. **Measure analysis output, not features:** Track "themes identified" and "annotations created" not "components built"
4. **Build iteratively from actual needs:** Only add features when hitting a real limitation during analysis
5. **Set analysis milestones:** "Annotate 20 transcripts" comes before "build search feature"

**Detection warning signs:**
- Prioritizing UI polish over annotation creation
- Adding features you haven't needed yet "just in case"
- Spending more time in code than in transcripts
- Difficulty answering "what have you learned about McKenna?"
- Excitement about tech stack but vagueness about research questions

**Phase mapping:** This risk exists from Phase 1 onwards. Address by:
- **Phase 1:** Use external tools (Hypothesis) for initial analysis before building anything
- **Phase 2-3:** Build minimal MVP, immediately use for real analysis
- **Every phase:** Track analysis output metrics alongside technical progress

**Mitigation strategy:**
- Weekly retrospective: "Did I spend more time coding or analyzing?"
- Public commitment: Share analysis findings, not just tool progress
- Partner accountability: Show analysis results to someone interested in McKenna, not the tool

---

### Pitfall 2: Orphaned Annotations (Text Range Drift)

**What goes wrong:** Annotations become disconnected from their source text when document content changes, creating "orphaned" annotations that can't be reliably displayed or edited.

**Why it happens:**
- Character offset-based text positions are fragile—any edit upstream invalidates all downstream positions
- Quote-based selectors fail when exact text match no longer exists
- Transcript corrections, formatting changes, or re-scraping can subtly alter text
- DOM structure changes break CSS selector-based anchoring

**Consequences:**
- Research from Hypothesis shows ~27% of annotations become orphaned over time
- 61% of currently attached annotations are "at risk" if pages change
- Lost annotation context makes qualitative analysis unreliable
- Re-annotating costs significant time and loses original interpretations
- Cross-transcript pattern analysis breaks when some annotations are orphaned

**Prevention:**

**1. Use W3C Web Annotation Data Model with redundant selectors:**
```json
{
  "target": {
    "selector": [
      {
        "type": "TextQuoteSelector",
        "exact": "the mushroom said to me",
        "prefix": "And then ",
        "suffix": " that reality"
      },
      {
        "type": "TextPositionSelector",
        "start": 1247,
        "end": 1271
      }
    ]
  }
}
```
Store BOTH quote-based (with context) and position-based selectors. The W3C spec explicitly recommends this: "Multiple Selectors can be given to describe the same Segment in different ways in order to maximize the chances that it will be discoverable later."

**2. Implement robust re-anchoring algorithm:**
- First try: exact quote match at position
- Second try: exact quote match anywhere in document
- Third try: fuzzy match using prefix/suffix context
- Fourth try: mark as orphaned with crossed-out text preview

**3. Store document version metadata:**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  content TEXT,
  content_hash TEXT, -- SHA256 of content
  version INTEGER,
  scraped_at TIMESTAMP
);

CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  document_version INTEGER, -- version when annotation created
  -- selectors...
);
```

**4. Immutable transcript storage:**
- Store original scraped transcripts separately from working versions
- Track all edits with version history
- Allow annotations to reference specific versions
- Provide migration UI when document changes detected

**5. Regular orphan detection:**
```sql
-- Find annotations that can't be re-anchored
SELECT a.id, a.quote_text, d.title
FROM annotations a
JOIN documents d ON a.document_id = d.id
WHERE NOT can_anchor(a.selectors, d.content);
```

**Detection warning signs:**
- Annotations displaying in wrong location
- Highlights jumping around when document reloads
- Empty or broken annotation cards
- Users reporting "my annotation disappeared"

**Phase mapping:**
- **Phase 1-2 (MVP):** Use simple position-based selectors, accept fragility for speed
- **Phase 3 (Annotation stability):** Implement W3C dual-selector approach
- **Phase 4+:** Add version tracking and orphan recovery UI

**Query performance note:** With proper GIN indexes on `tsvector` columns, even 1.3M words can be searched in ~50ms. Store `quote_text` as indexed column for orphan detection.

---

### Pitfall 3: Long Document Rendering Performance Collapse

**What goes wrong:** Browser freezes or crashes when rendering transcripts with thousands of annotations, especially the longest ones (87K words = ~400KB text + potentially hundreds of highlight spans).

**Why it happens:**
- DOM manipulation is expensive; large DOM trees (>10,000 nodes) cause reflow/repaint bottlenecks
- Each annotation creates multiple DOM nodes (spans, highlight wrappers, tooltips)
- React re-rendering large lists without virtualization causes performance death spiral
- 87K words with 200 annotations = potentially 50,000+ DOM nodes
- Mobile devices with limited memory crash when maintaining 60fps becomes impossible

**Consequences:**
- Unusable interface on longest, most important transcripts
- Users abandon analysis of substantive talks
- Annotation lag creates frustrating UX
- Memory leaks on mobile devices
- Browser tab crashes and data loss

**Prevention:**

**1. Implement windowing/virtualization (CRITICAL):**
```jsx
import { FixedSizeList } from 'react-window';

// Only render visible paragraphs + small buffer
<FixedSizeList
  height={600}
  itemCount={paragraphs.length}
  itemSize={150}
  width="100%"
>
  {({ index, style }) => (
    <Paragraph style={style} annotations={annotationsForParagraph[index]}>
      {paragraphs[index]}
    </Paragraph>
  )}
</FixedSizeList>
```

Use `react-window` or `react-virtualized`. Research confirms: "List virtualization is the most advanced and efficient way to render large data in React, with only visible elements (plus a small buffer) rendered while the rest are virtual placeholders."

**2. Lazy load annotations:**
- Don't load all 1.3M words of annotations on page load
- Fetch annotations for visible sections via API
- Use intersection observer to prefetch nearby sections
- Store in normalized Redux/Zustand state

**3. Optimize annotation rendering:**
```jsx
// Bad: creates many nested spans
<span className="highlight">
  <span className="tooltip">...</span>
  <span className="content">{text}</span>
</span>

// Better: flat structure, CSS for styling
<mark data-annotation-id={id} className="highlight">
  {text}
</mark>
```

**4. Pagination or section-based viewing:**
- Split 87K word transcripts into logical sections
- "Load more" pattern for sequential reading
- Jump to timestamp/section navigation

**5. Disable animations in dense annotation areas:**
- Hover effects on 200+ annotations = performance killer
- Use CSS `will-change` sparingly
- Debounce scroll handlers

**6. Performance budget:**
```
- Target: 60fps scroll on 4-year-old devices
- Max DOM nodes: 10,000 per view
- Max annotations visible: 100 simultaneously
- Initial load: <2s on 3G for 10K words
```

**Detection warning signs:**
- Scroll lag when moving through document
- "Script taking too long" browser warnings
- Increasing memory usage in DevTools
- Hot device when scrolling annotations
- Slow highlight creation (>500ms)

**Phase mapping:**
- **Phase 1-2:** Test with longest transcript (87K words) + 100 dummy annotations EARLY
- **Phase 3:** Implement windowing before real usage begins
- **Ongoing:** Performance regression testing with large documents

**Testing requirement:** Load McKenna's longest talk (find via organism.earth API) with 500 mock annotations during Phase 2. If scroll fps < 30, implement virtualization before continuing.

---

### Pitfall 4: LLM Hallucination in Pre-Tagging

**What goes wrong:** LLM confidently assigns thematic codes that are plausible-sounding but factually wrong, subtly distorting the qualitative analysis. Worse, you don't notice until deep into analysis.

**Why it happens:**
- LLMs pattern-match rather than truly understand—may code "psychedelic experience" when McKenna is actually discussing etymology
- Confirmation bias: pre-tags prime your own annotation choices
- Scale masks errors: with 1.3M words, spotting 5% hallucination rate (65K words of bad coding) is nearly impossible
- Prompt ambiguity: "themes" means different things to LLM vs. qualitative researcher
- Model inconsistency: same passage may get different codes on different runs

**Consequences:**
- Systematic bias in your analysis
- False patterns emerge from LLM artifacts, not McKenna's actual themes
- Can't trust automated coding, must manually review everything (defeating the purpose)
- Published analysis rests on unreliable foundation
- Expensive: 1.3M words × 2 (input + output) = significant API costs even with batch processing

**Prevention:**

**1. Human-in-the-loop validation workflow:**
```
1. LLM suggests themes (with confidence scores)
2. Human reviews 20% random sample
3. Calculate hallucination rate
4. If >5% error: revise prompts, re-run
5. Only after validation: apply to full corpus
```

**2. Use LLM for suggestion, not decision:**
```jsx
<AnnotationCard>
  <span className="llm-suggestion">
    Suggested themes: consciousness, time, language
    <button onClick={accept}>Accept</button>
    <button onClick={modify}>Modify</button>
    <button onClick={reject}>Reject</button>
  </span>
</AnnotationCard>
```

**3. Prompt engineering for consistency:**
```
AVOID: "What themes are present in this text?"
(Too open-ended, invites hallucination)

BETTER:
"Identify which of these specific themes appear in the passage:
1. Psychedelic experience
2. Language and reality
3. Nature and ecology
4. Technology critique
5. Shamanism and archaic revival

For each theme found, quote the exact phrases supporting it.
If none apply, respond 'NONE'."
```

**4. Cross-validation strategy:**
- Run 10% of corpus through multiple models (Claude, GPT-4, Llama)
- Compare results; investigate discrepancies
- High agreement = reliable pattern; disagreement = needs human review

**5. Ground truth calibration set:**
- Manually code 50 passages with high confidence
- Use as test set for LLM accuracy
- Measure precision/recall before scaling up

**6. Cost management for 1.3M words:**

With 2026 pricing:
- **OpenAI Batch API:** 50% discount, ~$13 for 1M tokens (assuming GPT-4 Turbo)
- **Anthropic Batch:** Similar 50% discount structure
- **Strategy:**
  - Use batch API (24hr turnaround acceptable for pre-tagging)
  - Prompt caching for repeated codebook (50% discount on cached portions)
  - Process in chunks, validate early chunks before continuing
  - Budget: ~$50-100 for full corpus with retries

**7. Quality metrics to track:**
```sql
CREATE TABLE llm_suggestions (
  id UUID PRIMARY KEY,
  annotation_id UUID,
  suggested_themes TEXT[],
  confidence FLOAT,
  accepted BOOLEAN,
  modified BOOLEAN,
  rejected BOOLEAN,
  human_themes TEXT[] -- what human actually chose
);

-- Track hallucination rate
SELECT
  COUNT(CASE WHEN rejected THEN 1 END) / COUNT(*) as rejection_rate,
  AVG(array_length(suggested_themes, 1)) as avg_suggestions
FROM llm_suggestions;
```

**Detection warning signs:**
- Themes that sound McKenna-like but you can't remember him saying
- Inconsistent coding across similar passages
- Themes appearing in suspiciously perfect distribution
- Difficulty finding quotes to support LLM-suggested themes
- Community pushback: "That's not what he meant"

**Phase mapping:**
- **Phase 1-2:** Manual annotation only, establish ground truth
- **Phase 3:** Experiment with LLM suggestions on small subset (100 passages)
- **Phase 4:** Scale up only if Phase 3 validation shows <5% hallucination rate
- **Phase 5+:** Continuous monitoring and human review workflow

**Research finding:** Recent studies on LLM-assisted qualitative coding achieved Cohen's Kappa ≥ 0.75 (strong inter-rater reliability) using careful prompt engineering and human validation. Factual incorrectness (H1) accounts for 38% of user-reported hallucinations, making validation essential.

---

### Pitfall 5: Web Scraping Fragility & Data Drift

**What goes wrong:** Your annotation database references text that no longer matches the source. organism.earth changes HTML structure, adds/removes content, or fixes typos—breaking your annotation anchors and creating data integrity nightmare.

**Why it happens:**
- HTML structure changes (class names, wrapper divs, ad insertion)
- Content updates: typos fixed, formatting improved, timestamps adjusted
- Rate limiting: aggressive scraping gets IP blocked
- Legal uncertainty: unclear if scraping violates ToS
- One-time scrape becomes stale: new talks added, existing ones updated

**Consequences:**
- Annotations point to wrong text after re-scrape
- Can't update corpus without breaking existing annotations
- Legal notice or IP ban disrupts project
- Missing latest McKenna content
- Data inconsistency undermines research validity

**Prevention:**

**1. Scrape defensively with rate limiting:**
```python
import time
import random
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests

# Conservative approach: 2-5 concurrent requests, 2-5 second delays
def scrape_organism_earth():
    base_delay = 3  # seconds
    jitter = 2  # random variance

    for url in transcript_urls:
        response = requests.get(url, headers={
            'User-Agent': 'Academic Research Project (contact@example.com)'
        })

        # Respect rate limit headers if present
        if 'RateLimit-Remaining' in response.headers:
            remaining = int(response.headers['RateLimit-Remaining'])
            if remaining < 5:
                sleep_time = 60  # back off

        process_transcript(response)
        time.sleep(base_delay + random.uniform(0, jitter))
```

Best practices from research:
- Respect `robots.txt` (check https://organism.earth/robots.txt)
- Identify yourself in User-Agent with contact email
- Conservative rate: 2-5 second delays between requests
- Monitor for 429 (Too Many Requests) responses
- Implement exponential backoff on errors
- Scrape during off-peak hours

**2. Store immutable versions with checksums:**
```sql
CREATE TABLE transcript_versions (
  id UUID PRIMARY KEY,
  transcript_id UUID REFERENCES transcripts(id),
  version INTEGER,
  content TEXT,
  content_hash TEXT, -- SHA256
  html_structure JSONB, -- store original HTML for re-parsing
  scraped_at TIMESTAMP,
  source_url TEXT,
  scrape_headers JSONB -- capture ETags, Last-Modified for change detection
);

-- Annotations reference specific version
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  transcript_version_id UUID REFERENCES transcript_versions(id),
  -- ensures annotations always point to exact text they were created against
);
```

**3. Detect changes before updating:**
```python
def check_for_updates():
    """Use HTTP HEAD requests to check if content changed"""
    for transcript in transcripts:
        response = requests.head(transcript.source_url)
        etag = response.headers.get('ETag')
        last_modified = response.headers.get('Last-Modified')

        if etag != transcript.last_etag:
            # Content changed, fetch and create new version
            fetch_new_version(transcript)
```

**4. Legal/ethical considerations:**
```
✓ DO:
- Check organism.earth Terms of Service
- Email maintainer explaining academic/personal use
- Credit source in any public outputs
- Respect rate limits
- Cache locally, minimize re-scraping

✗ DON'T:
- Republish full transcripts elsewhere
- Scrape for commercial purposes without permission
- Ignore robots.txt
- Overwhelm server with requests
- Claim content as your own
```

**5. Fallback strategy:**
- Keep local archive of all versions
- Export annotations with full text context (not just references)
- Document data provenance in research notes
- If organism.earth goes offline, you still have working copy

**6. Change detection pipeline:**
```python
def migration_check():
    """Before updating UI, check if annotations need migration"""
    old_version = get_version(transcript_id, version=3)
    new_version = get_version(transcript_id, version=4)

    affected_annotations = find_annotations(
        transcript_version_id=old_version.id
    )

    for ann in affected_annotations:
        try:
            new_anchor = re_anchor(ann, new_version.content)
            if not new_anchor:
                flag_for_human_review(ann)
        except Exception:
            flag_for_human_review(ann)
```

**Detection warning signs:**
- 404 errors on source URLs
- HTML parsing errors (structure changed)
- Annotations displaying incorrectly after update
- IP blocked (403/429 responses)
- Mismatched character counts between stored and scraped text

**Phase mapping:**
- **Phase 1:** One-time careful scrape with rate limiting, store locally
- **Phase 2:** Build version tracking into schema from start
- **Phase 3:** Implement change detection (optional)
- **Phase 4+:** Periodic update checks (monthly), manual review before applying

**Specific to organism.earth:**
- The site appears to be educational/archival (terencetranscribed.com is similar)
- Likely tolerates careful academic scraping
- Still: add contact info to User-Agent, scrape respectfully
- Alternative: ask maintainer for bulk export or API access

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt but are fixable.

### Pitfall 6: Overlapping Annotations UX Nightmare

**What goes wrong:** Users create overlapping highlights (e.g., highlighting "psychedelic experience" and "experience of novelty" where "experience" overlaps) and the interface becomes visually confusing or breaks.

**Why it happens:** HTML/DOM doesn't support overlapping tags—spans can't overlap in tree structure. Naive implementations either prevent overlapping (frustrating) or allow it but render incorrectly (confusing).

**Prevention:**
- **Split overlapping spans:** If annotation A covers chars 200-400 and annotation B covers 300-600, split into three spans: 200-299 (A only), 300-400 (both), 401-600 (B only)
- **Visual clarity:** Use opacity or borders to show overlap depth
  ```css
  .highlight { background: rgba(255, 255, 0, 0.3); }
  .highlight.overlap-2 { background: rgba(255, 255, 0, 0.5); }
  .highlight.overlap-3 { background: rgba(255, 255, 0, 0.7); }
  ```
- **Hover to separate:** Show which annotations are present in overlapped region
- **Document as feature:** In annotation tools, seeing overlap is valuable—shows related themes

**Phase mapping:** Address in Phase 2 (annotation UI) since Recogito may handle this already. Test with intentionally overlapping annotations early.

---

### Pitfall 7: Cross-Paragraph Selection Fragility

**What goes wrong:** Users try to highlight a passage spanning multiple paragraphs, but the selection breaks, creates weird artifacts, or only captures first paragraph.

**Why it happens:** DOM structure with paragraph breaks (`<p>` tags) makes range selection complex. Some libraries don't handle cross-element selections well.

**Prevention:**
- **Test with Recogito:** The library may support this; verify in Phase 2
- **If not supported:** Document as known limitation, provide "add note" alternative for long passages
- **Paragraph-aware selection:** Normalize selections to include full paragraph boundaries
- **Alternative UX:** "Extend selection" button to add adjacent paragraphs

**Phase mapping:** Discover in Phase 2 user testing. If Recogito doesn't support, defer to Phase 4+ unless it's blocking actual analysis.

---

### Pitfall 8: Annotation Query Performance at Scale

**What goes wrong:** Once you have 10,000+ annotations across 90 transcripts, queries like "show all annotations with theme X" or "find overlapping themes" become slow (>5 seconds), breaking UX.

**Why it happens:** Unindexed JSONB queries, full-text search without GIN indexes, or N+1 query patterns in React components.

**Prevention:**

**1. Index everything searchable:**
```sql
-- GIN index for full-text search on annotation content
CREATE INDEX idx_annotation_fts ON annotations
USING GIN (to_tsvector('english', note_text));

-- GIN index for theme arrays
CREATE INDEX idx_annotation_themes ON annotations
USING GIN (themes);

-- Composite index for common queries
CREATE INDEX idx_annotations_by_transcript_theme
ON annotations(transcript_id, themes)
WHERE deleted_at IS NULL;
```

**2. Denormalize for read performance:**
```sql
-- Materialized view for cross-transcript theme analysis
CREATE MATERIALIZED VIEW theme_summary AS
SELECT
  theme,
  COUNT(*) as annotation_count,
  array_agg(DISTINCT transcript_id) as transcript_ids,
  array_agg(DISTINCT user_id) as users
FROM annotations, unnest(themes) as theme
GROUP BY theme;

-- Refresh periodically (not on every annotation)
REFRESH MATERIALIZED VIEW theme_summary;
```

**3. Pagination and limits:**
```typescript
// Always limit queries
const annotations = await supabase
  .from('annotations')
  .select('*')
  .eq('transcript_id', transcriptId)
  .order('created_at', { ascending: false })
  .range(0, 99); // Only fetch 100 at a time
```

**4. Lazy loading patterns:**
- Load annotation metadata first (themes, timestamp, ID)
- Load full note text on demand (when card expands)
- Virtualize long lists of annotation cards

**Detection warning signs:**
- Query times >1s in Supabase logs
- "Loading..." states lasting multiple seconds
- Database CPU spikes during searches
- Users complaining about search slowness

**Phase mapping:**
- **Phase 2:** Add basic indexes during schema creation
- **Phase 3:** Test with 1000 mock annotations, measure query times
- **Phase 4+:** Add materialized views if needed

**Performance target:** <200ms for "find all annotations with theme X" across 10,000 annotations. PostgreSQL with proper GIN indexes can achieve ~50ms for full-text search on large corpora.

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

### Pitfall 9: Annotation Editor UX Friction

**What goes wrong:** Creating an annotation requires too many clicks or fields, disrupting flow state during analysis.

**Prevention:**
- **Minimal required fields:** Just highlighted text + note, themes optional
- **Keyboard shortcuts:** Enter to save, Esc to cancel
- **Quick actions:** Pre-defined theme buttons for common codes
- **Auto-save drafts:** Don't lose work if browser crashes

**Phase mapping:** Address in Phase 2 during initial UX design.

---

### Pitfall 10: No Undo for Annotations

**What goes wrong:** User accidentally deletes annotation or overwrites important note. No way to recover.

**Prevention:**
```sql
-- Soft delete with audit trail
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  -- other fields...
  deleted_at TIMESTAMP,
  deleted_by UUID,
  updated_at TIMESTAMP,
  updated_by UUID
);

-- Keep edit history
CREATE TABLE annotation_history (
  id UUID PRIMARY KEY,
  annotation_id UUID REFERENCES annotations(id),
  note_text TEXT,
  themes TEXT[],
  changed_at TIMESTAMP,
  changed_by UUID
);
```

**Phase mapping:** Implement soft delete in Phase 2 schema. Full history can wait until Phase 4+ if needed.

---

### Pitfall 11: Mobile Annotation UX Ignored

**What goes wrong:** Annotation works great on desktop but is unusable on mobile (can't select text, editor obscures content, etc.).

**Why it matters:** You might want to annotate while listening to McKenna talks on the go.

**Prevention:**
- Test on mobile early (Phase 2)
- Consider read-only mobile view with annotation viewing but not creation
- Or: simplified mobile annotation flow (tap paragraph → add note)
- Floating action button for mobile annotation editor

**Phase mapping:**
- **Phase 2:** Test mobile usability
- **Phase 3:** Decide if mobile annotation is in scope
- If not, clearly document desktop-only in MVP

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Setup & scraping | Blocked by organism.earth rate limiting | Start with 5-10 transcripts, test scraping pattern before scaling |
| Phase 2: Annotation MVP | Recogito limitations with long documents | Load longest transcript (87K words) in Phase 2, measure render time |
| Phase 2: Database schema | Annotation anchoring not version-aware | Implement `transcript_versions` table from start, not retrofit |
| Phase 3: LLM integration | Hallucinated themes distort analysis | Manual-only annotation in Phase 1-2 establishes ground truth first |
| Phase 3: Performance | 87K word transcript crashes browser | Implement virtualization (react-window) before real usage |
| Phase 4: Cross-transcript search | Slow queries kill UX | Add GIN indexes immediately, test with 1000+ annotations |
| Phase 5: Analysis workflow | Tool building never ends, analysis never starts | Set milestone: "10 transcripts fully analyzed" before adding features |

---

## Recogito-Specific Considerations

**Current status:** `recogito-js` is deprecated; `@recogito/text-annotator-js` is the maintained successor with React wrapper `@recogito/react-text-annotator`.

**Known issues from GitHub:**
- Preventing overlapping annotations (check if this is feature or bug for your use case)
- Zero-width span creation bugs (fixed in recent versions)
- Cross-paragraph selections may need testing

**Validation needed:**
1. Test with 87K word document in Phase 2
2. Verify W3C annotation model support (TextQuoteSelector + TextPositionSelector)
3. Check if it handles overlapping annotations gracefully
4. Measure initial render time with 500 dummy annotations

**Alternative libraries if Recogito doesn't fit:**
- Build on W3C Web Annotation Data Model standard directly
- hypothesis/client (open source web annotation tool)
- Apache Annotator
- Custom solution using `window.getSelection()` + Range API

---

## Research Confidence Notes

| Finding | Confidence | Source |
|---------|-----------|---------|
| Orphaned annotation rates (27%) | HIGH | [Peer-reviewed research on Hypothesis](https://www.cs.odu.edu/~mln/pubs/tpdl-2015/tpdl-2015-annotations.pdf) |
| W3C Web Annotation Data Model | HIGH | [Official W3C specification](https://www.w3.org/TR/annotation-model/) |
| React virtualization for performance | HIGH | [Official React docs](https://legacy.reactjs.org/docs/optimizing-performance.html), [LogRocket article](https://blog.logrocket.com/render-large-lists-react-5-methods-examples/) |
| LLM hallucination in qualitative coding | MEDIUM | [Recent research paper](https://www.nature.com/articles/s41598-025-15416-8), 38% factual incorrectness rate |
| PostgreSQL FTS performance | HIGH | [Official PostgreSQL docs](https://www.postgresql.org/docs/current/textsearch.html), [performance articles](https://www.lateral.io/resources-blog/full-text-search-in-milliseconds-with-postgresql) |
| Web scraping best practices | MEDIUM | [Multiple 2026 articles](https://scrape.do/blog/web-scraping-rate-limit/) on rate limiting and ethics |
| Tool-building procrastination trap | LOW | [General productivity articles](https://twspace.substack.com/p/when-more-research-becomes-procrastination), not domain-specific research |
| Overlapping highlights UX | MEDIUM | [CodeMirror discussions](https://discuss.codemirror.net/t/overlapping-text-annotations/2462), [Elm forum](https://discourse.elm-lang.org/t/how-best-to-approach-text-annotation-overlapping-highlights-of-text/8295) |
| Recogito limitations | MEDIUM | [GitHub repository review](https://github.com/recogito/text-annotator-js), recent as of Jan 2026 |
| LLM batch API pricing | HIGH | [OpenAI/Anthropic official pricing 2026](https://www.cloudidr.com/blog/llm-pricing-comparison-2026) |

---

## Sources

**Text Annotation and UX:**
- [Things that Can go Wrong During Annotation](https://kili-technology.com/data-labeling/things-that-can-go-wrong-during-annotation-and-how-to-avoid-them)
- [Exploring the UX of Web Annotations](https://tomcritchlow.com/2019/02/12/annotations/)
- [Overlapping Text Annotations - CodeMirror](https://discuss.codemirror.net/t/overlapping-text-annotations/2462)
- [How Best to Approach Text Annotation (Overlapping Highlights)](https://discourse.elm-lang.org/t/how-best-to-approach-text-annotation-overlapping-highlights-of-text/8295)

**Orphaned Annotations and Anchoring:**
- [What are Annotation "Orphans"? - Hypothesis](https://web.hypothes.is/help/what-are-orphans-and-where-are-they/)
- [Quantifying Orphaned Annotations in Hypothesis (Research Paper)](https://www.cs.odu.edu/~mln/pubs/tpdl-2015/tpdl-2015-annotations.pdf)
- [Annotations Can Fail to Anchor - GitHub Issue](https://github.com/hypothesis/product-backlog/issues/954)
- [Robust Annotation Positioning in Digital Documents - Microsoft Research](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-2000-95.pdf)

**W3C Web Annotation Standard:**
- [Web Annotation Data Model - W3C Official Spec](https://www.w3.org/TR/annotation-model/)
- [Annotation Is Now a Web Standard - Hypothesis Blog](https://web.hypothes.is/blog/annotation-is-now-a-web-standard/)

**Web Scraping Best Practices:**
- [Rate Limit in Web Scraping - Scrape.do](https://scrape.do/blog/web-scraping-rate-limit/)
- [DOs and DON'Ts of Web Scraping 2026](https://medium.com/@datajournal/dos-and-donts-of-web-scraping-in-2025-e4f9b2a49431)
- [What Is Rate Limiting & How to Avoid It - Oxylabs](https://oxylabs.io/blog/rate-limiting)
- [Web Scraping Without Getting Blocked - ScrapingBee](https://www.scrapingbee.com/blog/web-scraping-without-getting-blocked/)
- [Is Web Scraping Legal in 2025?](https://www.browserless.io/blog/is-web-scraping-legal)

**React Performance and Large Documents:**
- [Optimizing Performance - React Official Docs](https://legacy.reactjs.org/docs/optimizing-performance.html)
- [How To Render Large Datasets In React - Syncfusion](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react)
- [Rendering Large Lists in React: 5 Methods with Examples - LogRocket](https://blog.logrocket.com/render-large-lists-react-5-methods-examples/)
- [Top 3 Ways to Efficiently Render Large Datasets in React](https://palify.io/articles/view-article/top-3-ways-to-efficiently-render-large-datasets-in-react-without-crashing-the-browser)

**LLM Hallucinations in Qualitative Analysis:**
- ["My AI is Lying to Me": User-reported LLM Hallucinations - Nature Scientific Reports](https://www.nature.com/articles/s41598-025-15416-8)
- [LLM Hallucinations in Code Generation - ACM](https://dl.acm.org/doi/10.1145/3728894)
- [Survey and Analysis of Hallucinations in LLMs](https://pmc.ncbi.nlm.nih.gov/articles/PMC12518350/)

**LLM Cost Management:**
- [Complete LLM Pricing Comparison 2026](https://www.cloudidr.com/blog/llm-pricing-comparison-2026)
- [LLM API Cost Comparison 2026](https://zenvanriel.nl/ai-engineer-blog/llm-api-cost-comparison-2026/)
- [Batch Processing for LLM Cost Savings](https://www.prompts.ai/blog/batch-processing-for-llm-cost-savings)
- [LLM Cost Management - Infracost](https://www.infracost.io/glossary/llm-cost-management/)

**PostgreSQL Performance:**
- [Implementing High-Performance Full Text Search in Postgres - RisingWave](https://risingwave.com/blog/implementing-high-performance-full-text-search-in-postgres/)
- [PostgreSQL Full Text Search Official Docs](https://www.postgresql.org/docs/current/textsearch.html)
- [Full Text Search in Milliseconds with PostgreSQL](https://www.lateral.io/resources-blog/full-text-search-in-milliseconds-with-postgresql)
- [PostgreSQL: Preferred Index Types for Text Search](https://www.postgresql.org/docs/current/textsearch-indexes.html)

**Tool Building vs. Analysis Trap:**
- [When 'More Research' Becomes Procrastination](https://twspace.substack.com/p/when-more-research-becomes-procrastination)
- [The PKM Trap: When Productivity Becomes Procrastination](https://medium.com/@paralloid/the-pkm-trap-when-productivity-becomes-procrastination-669e03de9c11)
- [Writers-Stop Using "Research" to Procrastinate](https://medium.com/@spattanaik.winwork/writers-stop-using-research-to-procrastinate-and-learn-how-to-break-this-habit-e6957f28972d)

**Recogito Library:**
- [Recogito Text Annotator - GitHub](https://github.com/recogito/text-annotator-js)
- [Recogito React Text Annotator - npm](https://www.npmjs.com/package/@recogito/react-text-annotator/v/3.0.0-rc.26)
- [Recogito Issues - GitHub](https://github.com/recogito/recogito-js/issues)

**Terence McKenna Transcripts:**
- [organism.earth - McKenna Library](https://www.organism.earth/library/document/world-wide-web-and-millennium)
- [Transcribed Terence McKenna Talks](https://www.terencetranscribed.com/)
