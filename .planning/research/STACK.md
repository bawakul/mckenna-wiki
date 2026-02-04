# Technology Stack

**Project:** McKenna Wiki - Transcript Annotation & Qualitative Analysis Tool
**Researched:** 2026-02-04
**Overall Confidence:** HIGH

## Executive Summary

The standard 2025 stack for a web-based transcript annotation tool centers on **Next.js 15 App Router + Supabase + TypeScript + Tailwind**, with careful library selection for annotation UI (critical decision point), visualization, and LLM integration.

**Key finding:** `@recogito/react-text-annotator` has moved out of release candidate status to stable 3.0.5+ (published within the last month), making it a viable choice. However, alternatives exist that may offer better DX and maintenance.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 15.x | Frontend framework | App Router architecture, React Server Components, Server Actions for mutations, excellent TypeScript support, built-in optimization |
| **React** | 18.x | UI library | Required by Next.js, standard for web apps in 2025 |
| **TypeScript** | 5.x | Type safety | Essential for maintainability, catches bugs at compile time, excellent IDE support |
| **Node.js** | 20.x LTS or 22.x | Runtime | Next.js requires Node.js, LTS recommended for stability |

**Confidence:** HIGH
**Rationale:** This is the de facto standard stack for modern web applications in 2025. Next.js 15 with App Router provides server-side rendering, streaming, and optimized data fetching. The App Router's file-based routing and Server Actions pattern eliminates the need for separate API route boilerplate for Supabase mutations.

### Backend & Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Supabase** | Latest | Backend-as-a-Service | Managed Postgres, real-time subscriptions, Row Level Security (RLS), auth, storage - all in one |
| **PostgreSQL** | 15+ (via Supabase) | Database | Proven relational model, JSONB for flexible annotation storage, powerful full-text search, pg_trgm for fuzzy matching |
| **@supabase/supabase-js** | 2.x | Supabase client | Official client library for Supabase API |
| **@supabase/ssr** | Latest | Server-side Supabase | Cookie-based auth for Next.js App Router, proper SSR support |

**Confidence:** HIGH
**Rationale:** Supabase provides everything needed for a single-user qualitative analysis tool:
- **JSONB columns** for storing W3C Web Annotation model or simplified annotation structures
- **Full-text search (tsvector/tsquery)** with GIN indexes for fast searching across 1.3M words
- **pg_trgm extension** for similarity/fuzzy search
- **Row Level Security** for future multi-user expansion (even single-user apps benefit from RLS)
- **Cookie-based auth** is 2025 best practice (HTTP-only cookies, server-side validation, no localStorage XSS vulnerability)

**Setup pattern:**
```
utils/supabase/
  ├── client.ts    # Browser client
  ├── server.ts    # Server Component client
  └── middleware.ts # Auth middleware
```

### Styling & UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS** | 4.x | Utility-first CSS | Zero-config in v4, excellent DX, pairs perfectly with Next.js, industry standard |
| **shadcn/ui** | Latest | Component library | Copy-paste approach (full code ownership), built on Radix UI, accessible, customizable |
| **Radix UI** | Latest | Headless UI primitives | Accessibility baked in (WAI-ARIA, keyboard navigation), unstyled (use with Tailwind), 28 components |

**Confidence:** HIGH
**Rationale:**
- **Tailwind v4** eliminates config file, moves configuration into CSS for faster compilation
- **shadcn/ui** is the top choice for Next.js in 2025 - you copy components into your project (not npm dependency), giving full control over styling and behavior
- **Radix UI** (underlying shadcn/ui) handles complex accessibility, focus management, portal rendering, ARIA attributes automatically
- Together they provide production-grade UI with minimal effort

**Installation:**
```bash
npm install tailwindcss @tailwindcss/postcss postcss
npx shadcn@latest init
```

### Text Annotation Library (CRITICAL DECISION)

| Option | Status | Recommendation |
|--------|--------|----------------|
| **@recogito/react-text-annotator** | 3.0.5 (stable, published ~1 month ago) | ⚠️ USE WITH CAUTION |
| **Custom implementation** | N/A | ✅ RECOMMENDED |
| **Hypothesis/Annotator.js** | Deprecated (recogito-js marked deprecated) | ❌ AVOID |

**Confidence:** MEDIUM (needs validation testing)

**Detailed Analysis:**

**Option 1: @recogito/react-text-annotator (3.0.5)**
- **Status:** Out of release candidate, now stable 3.0.x series
- **Pros:**
  - W3C Web Annotation Data Model support
  - React wrapper available
  - Handles text range selection with character offsets
  - Recently maintained (last publish ~1 month ago)
- **Cons:**
  - Still relatively low adoption (web search shows limited production usage examples)
  - RC phase lasted a long time (indicates potential instability)
  - Documentation is sparse
  - Ecosystem is small (few tutorials, Stack Overflow answers)
- **Use if:** You need W3C standard compliance and don't mind potential rough edges

**Option 2: Custom Implementation (RECOMMENDED)**
Build a lightweight custom solution using browser Selection API + simple data model:

```typescript
// Simplified annotation storage (not full W3C model)
interface Annotation {
  id: string;
  transcript_id: string;
  start_offset: number;  // Character position in text
  end_offset: number;
  selected_text: string;
  modules: string[];     // Your thematic tags
  created_at: timestamp;
}
```

**Why custom:**
- Single-user tool = simpler requirements than collaborative annotation
- No need for full W3C model complexity
- Full control over UX (highlight colors, tag UI, keyboard shortcuts)
- Browser Selection API is stable and well-documented
- Annotation persistence is just Supabase insert/update
- Easier to integrate with your specific "module" tagging workflow

**Implementation approach:**
1. Use `window.getSelection()` to capture user text selection
2. Calculate character offsets relative to paragraph/document
3. Store in Supabase JSONB column or relational table
4. Render highlights using `<mark>` elements or CSS pseudo-elements
5. Handle click events to show/edit annotation metadata

**Libraries to support custom implementation:**
- **RoughNotation** (1kb) - Hand-drawn style highlights, if desired aesthetic
- **Selection.js API** (built-in browser) - Text selection handling
- **Rangy** (if needing IE support, which you don't) - Skip this

**Option 3: Text Annotator.js Alternatives**
- **ProseMirror + Tiptap:** Powerful but overkill (designed for rich text editing, not read-only annotation)
- **Hypothesis:** Collaborative annotation platform, too heavyweight for personal tool
- **NowComment, Perusall:** SaaS platforms, not embeddable libraries

**Recommendation:**
Start with **custom implementation** using Selection API. If complexity grows (collaborative features, version history, complex selection types), revisit `@recogito/react-text-annotator` or explore ProseMirror-based solution.

### Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Recharts** | 2.x | Chart library | Most reliable React chart library, simple API, responsive, composable components |
| **Victory** | Latest | Alternative charting | Modular, accessible (ARIA labels), good for custom visualizations |
| **Nivo** | Latest | Advanced viz | Widest component selection, D3.js under hood, SSR support, beautiful defaults |

**Confidence:** HIGH
**Rationale:**
- **Recharts** is the professional first choice for "module frequency over time" timeline visualizations
- Supports line charts, bar charts, scatter plots out of the box
- React-friendly declarative API
- For 90 lectures, performance is not a concern (use Visx or TanStack Charts for millions of data points)

**Example use case:**
```tsx
// Module frequency timeline
<LineChart data={moduleFrequencyByLecture}>
  <XAxis dataKey="lecture_number" />
  <YAxis />
  <Line dataKey="hero_journey" stroke="#8884d8" />
  <Line dataKey="timewave_zero" stroke="#82ca9d" />
</LineChart>
```

### LLM Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@anthropic-ai/sdk** | Latest | Claude API client | Official TypeScript SDK, supports streaming, tool use, modern models (Claude Sonnet 4.5) |
| **openai** | Latest | OpenAI API client | Official SDK if using GPT models |
| **Vercel AI SDK** | 5.x | Alternative unified API | Optional: abstracts over multiple providers (Anthropic, OpenAI), streaming primitives |

**Confidence:** HIGH
**Rationale:**
- **@anthropic-ai/sdk** is actively maintained, type-safe, supports latest Claude models
- For pre-tagging transcripts with thematic modules, use Server Actions to call Claude API
- **Do NOT call LLM APIs from client** - expensive, exposes API keys, rate limit issues
- Use Next.js Route Handlers or Server Actions for LLM calls

**Pattern:**
```typescript
// app/actions/tag-transcript.ts
'use server'

import Anthropic from '@anthropic-ai/sdk';

export async function generateModuleTags(transcriptText: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // Server-side only
  });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze this McKenna lecture excerpt and identify thematic modules: ${transcriptText}`
    }],
  });

  // Parse response, return tags
}
```

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zustand** | 5.x | Client state | Minimal API (~1kb), hooks-based, no boilerplate, perfect for annotation UI state |
| **TanStack Query** | 5.x | Server state | Cache Supabase queries, handle loading/error states, optimistic updates |

**Confidence:** HIGH
**Rationale:**
- **Zustand** for UI state (selected annotation, sidebar open/closed, current module filter)
- **TanStack Query** for server data (transcripts, annotations) - pairs perfectly with Supabase
- 2025 best practice: Zustand (client) + React Query (server) together
- Avoid Redux (too much boilerplate for this use case)
- React Context is fine for very simple cases, but Zustand is just as easy

**Zustand example:**
```typescript
// stores/annotation-store.ts
import { create } from 'zustand';

export const useAnnotationStore = create((set) => ({
  selectedAnnotationId: null,
  setSelected: (id) => set({ selectedAnnotationId: id }),
}));
```

### Search & Text Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL Full-Text Search** | Built-in | Keyword search | Native tsvector/tsquery, GIN indexes, fast for 1.3M words |
| **pg_trgm** | Built-in extension | Fuzzy search | Trigram similarity matching, typo tolerance |
| **pg_jsonschema** | Supabase extension | JSON validation | Enforce structure on JSONB annotation data |

**Confidence:** HIGH
**Rationale:**
- For 1.3M words across 90 lectures, Postgres full-text search is MORE than sufficient
- No need for Elasticsearch, Meilisearch, or other external search engines
- **Setup:**
  1. Create generated column: `search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED`
  2. Create GIN index: `CREATE INDEX idx_transcript_search ON transcripts USING GIN(search_vector)`
  3. Query: `SELECT * FROM transcripts WHERE search_vector @@ plainto_tsquery('english', 'timewave zero')`
- **pg_trgm** for "did you mean?" fuzzy matching: `SELECT similarity('timewave', 'timwave')`

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | Latest | Schema validation | Validate form inputs, API responses, env vars |
| **date-fns** | Latest | Date manipulation | Format timestamps, calculate durations |
| **clsx** | Latest | Conditional classes | Combine Tailwind classes conditionally |
| **react-hook-form** | Latest | Form handling | Annotation tagging forms, search forms |

**Confidence:** HIGH

## Project Structure (Next.js 15 Conventions)

```
mckenna-wiki/
├── app/                          # App Router
│   ├── (auth)/                   # Route group: auth
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Route group: main app
│   │   ├── transcripts/
│   │   │   └── [id]/            # Dynamic route
│   │   ├── modules/
│   │   └── analytics/
│   ├── api/                      # API routes (if needed)
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Tailwind imports
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── annotation/              # Annotation-specific
│   ├── transcript/              # Transcript display
│   └── visualization/           # Charts
├── lib/                         # Utilities
│   ├── supabase/               # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── utils.ts                # Helpers
│   └── types.ts                # TypeScript types
├── stores/                      # Zustand stores
├── actions/                     # Server Actions
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Key conventions:**
- Use `src/` directory (optional but recommended for cleaner root)
- Route groups `(name)` for organization without affecting URL structure
- `components/ui/` for shadcn/ui (CLI generates here)
- `lib/` for utilities, not `utils/` (Next.js convention)
- PascalCase for components, camelCase for utils, snake_case for CSS classes

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Framework** | Next.js 15 | Remix, Astro, SvelteKit | Next.js has best Supabase integration, largest ecosystem, Vercel deployment |
| **Backend** | Supabase | Firebase, PocketBase, Raw Postgres | Supabase = Postgres + auth + storage + realtime in one, better DX than raw Postgres |
| **Database** | PostgreSQL (via Supabase) | MongoDB, MySQL | Need relational model for transcripts ↔ annotations, Postgres JSONB gives flexibility |
| **Styling** | Tailwind v4 | CSS Modules, Styled Components, Emotion | Tailwind is 2025 standard, v4 has zero config, utility-first is fastest for iteration |
| **UI Library** | shadcn/ui + Radix | Material UI, Ant Design, Chakra UI | shadcn gives code ownership (copy-paste), not npm bloat, fully customizable |
| **Annotation** | Custom implementation | @recogito/react-text-annotator, Hypothesis | Custom = simpler, faster iteration, no W3C overhead for single-user tool |
| **Charts** | Recharts | D3.js, Chart.js, Visx | Recharts = best DX for declarative charts, D3 too low-level, Visx better for massive datasets |
| **State** | Zustand + React Query | Redux Toolkit, Jotai, Recoil | Zustand has minimal API, no boilerplate, React Query is 2025 standard for server state |
| **Auth** | Supabase Auth | NextAuth, Clerk, Auth0 | Supabase Auth integrates with Supabase DB, cookie-based is secure, no extra service |

## Installation

### Step 1: Initialize Next.js Project
```bash
npx create-next-app@latest mckenna-wiki \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Step 2: Install Core Dependencies
```bash
cd mckenna-wiki
npm install @supabase/supabase-js @supabase/ssr
npm install zustand @tanstack/react-query
npm install zod react-hook-form @hookform/resolvers
npm install date-fns clsx
```

### Step 3: Install Visualization
```bash
npm install recharts
```

### Step 4: Install LLM SDK (choose one or both)
```bash
npm install @anthropic-ai/sdk
# OR
npm install openai
```

### Step 5: Setup shadcn/ui
```bash
npx shadcn@latest init
# Follow prompts, select:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate (or your preference)
# - CSS variables: Yes
```

### Step 6: Add shadcn components as needed
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add select
# etc.
```

### Step 7: Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # DO NOT expose to client
ANTHROPIC_API_KEY=your_anthropic_key              # Server-side only
```

**CRITICAL:** Never put `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` variables - only use server-side.

## Database Schema Recommendations

### Transcripts Table
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  date DATE,
  location TEXT,
  content TEXT NOT NULL,  -- Full transcript
  word_count INTEGER,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || content)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transcript_search ON transcripts USING GIN(search_vector);
CREATE INDEX idx_lecture_number ON transcripts(lecture_number);
```

### Annotations Table (Simplified Model)
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  paragraph_index INTEGER,  -- Which paragraph in transcript
  start_offset INTEGER NOT NULL,  -- Character offset from paragraph start
  end_offset INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  modules TEXT[] NOT NULL DEFAULT '{}',  -- Array of module tags
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_annotations_transcript ON annotations(transcript_id);
CREATE INDEX idx_annotations_modules ON annotations USING GIN(modules);
```

### Modules Table (Your Thematic Tags)
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,  -- Hex color for highlights
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Alternative: W3C Web Annotation Model in JSONB**
```sql
CREATE TABLE annotations_w3c (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id),
  annotation JSONB NOT NULL,  -- Full W3C model
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Use pg_jsonschema to validate structure
CREATE TRIGGER validate_annotation
  BEFORE INSERT OR UPDATE ON annotations_w3c
  FOR EACH ROW
  EXECUTE FUNCTION validate_annotation_schema();
```

**Recommendation:** Start with simplified model (first example). It's easier to query and update. Only use W3C model if you need interoperability with other annotation tools.

## Key Architecture Decisions

### 1. Server Actions for Mutations
Use Next.js Server Actions instead of API routes for Supabase mutations:
```typescript
'use server'

export async function createAnnotation(data: AnnotationInput) {
  const supabase = createServerClient();
  const { data: annotation, error } = await supabase
    .from('annotations')
    .insert(data)
    .select()
    .single();

  revalidatePath('/transcripts/[id]');
  return annotation;
}
```

### 2. Row Level Security (RLS)
Even for single-user app, enable RLS for security:
```sql
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can do anything
CREATE POLICY "Enable all for authenticated users"
  ON transcripts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 3. Optimistic Updates
Use React Query's optimistic updates for instant UI feedback:
```typescript
const mutation = useMutation({
  mutationFn: createAnnotation,
  onMutate: async (newAnnotation) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['annotations'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['annotations']);

    // Optimistically update
    queryClient.setQueryData(['annotations'], (old) => [...old, newAnnotation]);

    return { previous };
  },
  onError: (err, newAnnotation, context) => {
    // Rollback on error
    queryClient.setQueryData(['annotations'], context.previous);
  },
});
```

### 4. Paragraph-Level Structure
Store transcripts with paragraph-level granularity for better annotation targeting:
```typescript
interface Transcript {
  id: string;
  lecture_number: number;
  paragraphs: {
    index: number;
    text: string;
    speaker?: string;  // If transcripts have Q&A sections
  }[];
}
```

Store as JSONB or normalize into separate `paragraphs` table if you need to query individual paragraphs.

## Performance Considerations

| Concern | Approach | Why |
|---------|----------|-----|
| **Large transcript loading** | Stream with React Suspense | Don't block UI waiting for 50KB transcript text |
| **Full-text search speed** | GIN indexes + limit results | 1.3M words is small for Postgres, but always paginate |
| **Annotation rendering** | Virtual scrolling if >1000 highlights | Use `react-window` if transcripts have dense annotations |
| **LLM API latency** | Background jobs + loading states | Don't make users wait for Claude to tag transcripts |

**Not concerns for this project:**
- Horizontal scaling (single user)
- CDN caching (dynamic per-user data)
- Edge deployment (desktop-first, not latency-sensitive)

## Development Workflow

1. **Local Supabase:** Use Supabase CLI for local development
   ```bash
   npx supabase init
   npx supabase start
   ```

2. **Type Generation:** Generate TypeScript types from Supabase schema
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
   ```

3. **Migrations:** Version control schema changes
   ```bash
   npx supabase migration new create_annotations_table
   # Edit migration file
   npx supabase db push
   ```

## Deployment

**Recommended:** Vercel (Next.js creators)
- Zero-config Next.js deployment
- Automatic previews for git branches
- Edge functions for API routes
- Free tier suitable for personal projects

**Alternative:** Self-hosted
- Docker container with `npm run build && npm start`
- Need to handle SSL, CDN, monitoring yourself

## Version Locking

Lock these versions in `package.json` after initial install:
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

Use `npm ci` in production for reproducible builds.

## Critical Warnings

### 1. NEVER Expose Service Role Key
```typescript
// ❌ WRONG - exposes service role to browser
const supabase = createClient(url, process.env.NEXT_PUBLIC_SERVICE_ROLE);

// ✅ CORRECT - use anon key for client
const supabase = createClient(url, process.env.NEXT_PUBLIC_ANON_KEY);

// ✅ CORRECT - service role only in server actions
'use server'
const supabase = createClient(url, process.env.SERVICE_ROLE_KEY);
```

### 2. Don't Call LLM APIs from Client
Always use Server Actions or API routes to proxy LLM calls.

### 3. Enable RLS Before Deploying
Supabase locks everything by default. Create policies or your data won't be accessible.

### 4. Test Annotation Persistence Early
Character offsets can break if transcript HTML structure changes. Test edge cases:
- Multi-line selections
- Selections across paragraph boundaries
- Special characters (quotes, apostrophes)
- Non-English characters (if McKenna quotes other languages)

## Next Steps After Stack Setup

1. **Validate annotation library:** Build simple prototype with custom Selection API implementation. If it's too complex, revisit `@recogito/react-text-annotator`.

2. **Design annotation data model:** Decide between simplified relational model vs. W3C JSONB model based on actual annotation workflow.

3. **Setup Supabase full-text search:** Create test transcripts and validate search performance with realistic queries.

4. **LLM pre-tagging experiment:** Run Claude on sample transcript paragraphs to validate that your "module" taxonomy is detectable by LLM.

5. **Visualization mockup:** Sketch what "module frequency over time" visualization looks like with real data.

## Sources

**Annotation Libraries:**
- [@recogito/react-text-annotator - npm](https://www.npmjs.com/package/@recogito/react-text-annotator)
- [GitHub - recogito/text-annotator-js](https://github.com/recogito/text-annotator-js)
- [Text Annotation Libraries - jQuery Script](https://www.jqueryscript.net/blog/best-text-highlighting.html)
- [W3C Web Annotation Model - GitHub](https://github.com/goodmansasha/annotation-model)

**Next.js + Supabase:**
- [Supabase + Next.js Guide - Medium](https://medium.com/@iamqitmeeer/supabase-next-js-guide-the-real-way-01a7f2bd140c)
- [Use Supabase with Next.js - Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js + Supabase Project Structure - DEV](https://dev.to/pipipi-dev/nextjs-supabase-project-structure-for-indie-development-36od)
- [Setting up Server-Side Auth for Next.js - Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)

**Full-Text Search:**
- [Full Text Search - Supabase Docs](https://supabase.com/docs/guides/database/full-text-search)
- [Postgres Full Text Search vs the rest - Supabase Blog](https://supabase.com/blog/postgres-full-text-search-vs-the-rest)
- [PostgreSQL pg_trgm Documentation](https://www.postgresql.org/docs/current/pgtrgm.html)

**Component Libraries:**
- [shadcn/ui - Next.js Installation](https://ui.shadcn.com/docs/installation/next)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/guides/nextjs)
- [Next.js Project Structure Best Practices - DEV](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)

**Visualization:**
- [8 Best React Chart Libraries - Embeddable](https://embeddable.com/blog/react-chart-libraries)
- [Top 10 React Chart Libraries 2025 - OpenReplay](https://blog.openreplay.com/react-chart-libraries-2025/)

**State Management:**
- [Zustand - GitHub](https://github.com/pmndrs/zustand)
- [React State Management 2025 - Makers' Den](https://makersden.io/blog/react-state-management-in-2025)

**LLM Integration:**
- [Anthropic SDK TypeScript - GitHub](https://github.com/anthropics/anthropic-sdk-typescript)
- [Building AI Applications with Anthropic's SDK and Next.js](https://mehd.ir/posts/building-ai-applications-with-anthropics-sdk-and-nextjs)
- [Modern AI Integration: OpenAI API in Next.js - Medium](https://adhithiravi.medium.com/modern-ai-integration-openai-api-in-your-next-js-app-f3a3ce2decf0)

**Qualitative Analysis Context:**
- [Top 19 Free Qualitative Data Analysis Software 2025 - Decide](https://decidesoftware.com/top-free-qualitative-data-analysis-software/)
- [ATLAS.ti - The #1 Software for Qualitative Data Analysis](https://atlasti.com/)
