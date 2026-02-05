# User Setup Required: Supabase Configuration

**Status:** ⏳ Incomplete

This plan requires manual setup of external services before execution can proceed.

## Service: Supabase

**Why needed:** Database for transcript storage and full-text search

**Estimated setup time:** 10 minutes

---

## Step 1: Create Supabase Project

1. Go to: https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization (or create one)
4. Project settings:
   - **Name:** `mckenna-wiki` (or your preferred name)
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is sufficient for v1 (25GB database, 500MB file storage)
5. Click "Create new project"
6. Wait 2-3 minutes for project provisioning

---

## Step 2: Get API Credentials

1. In your new project, go to: **Project Settings** (gear icon in sidebar)
2. Navigate to: **API** section
3. Copy the following values:

### Environment Variables Required

Add these to `.env.local` in project root:

| Variable | Source | Description |
|----------|--------|-------------|
| `SUPABASE_URL` | Project Settings → API → Project URL | Your project's API endpoint (e.g., `https://abc123.supabase.co`) |
| `SUPABASE_ANON_KEY` | Project Settings → API → Project API keys → `anon` `public` | Public/anonymous key (safe for client-side use) |
| `SUPABASE_SERVICE_KEY` | Project Settings → API → Project API keys → `service_role` `secret` | Service role key (admin access, **keep secret**) |

**Example `.env.local`:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security note:** The `SUPABASE_SERVICE_KEY` has admin-level access. Never commit it to git or expose it to the client.

---

## Step 3: Apply Database Migrations

The SQL migration files are ready in `supabase/migrations/`. You need to run them manually in Supabase.

### Option A: SQL Editor (Recommended for beginners)

1. In Supabase Dashboard, go to: **SQL Editor** (in sidebar)
2. Click: **New Query**
3. Copy contents of `supabase/migrations/001_create_corpus_tables.sql`
4. Paste into query editor
5. Click: **Run** (or press Cmd+Enter)
6. Verify: "Success. No rows returned" message
7. Repeat for `supabase/migrations/002_create_search_function.sql`

### Option B: Supabase CLI (For advanced users)

If you have [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

---

## Step 4: Verify Setup

Run these commands to verify everything works:

### Test seed script error handling (should show missing env vars error):
```bash
npm run seed
```

**Expected output:**
```
ERROR: Missing required environment variables

Required variables:
  SUPABASE_URL           - Your Supabase project URL
  SUPABASE_SERVICE_KEY   - Service role key (admin access)
```

### After adding env vars, test dry-run mode:
```bash
npm run seed:dry-run
```

**Expected output:**
```
ERROR: Could not read transcripts directory: mckenna-corpus/transcripts
```
(This is correct - corpus doesn't exist yet, that's for plan 01-04)

### Verify database connection:

Create a test file `test-connection.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function test() {
  const { data, error } = await supabase.from('transcripts').select('count');
  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connected to Supabase successfully!');
    console.log('Transcripts table exists and is empty');
  }
}

test();
```

Run: `npx tsx test-connection.ts`

**Expected output:**
```
✅ Connected to Supabase successfully!
Transcripts table exists and is empty
```

---

## Troubleshooting

### "Missing required environment variables"
- Check that `.env.local` exists in project root
- Verify variable names match exactly (no typos)
- Restart your terminal/editor to reload environment

### "relation 'transcripts' does not exist"
- SQL migrations not applied yet
- Go back to Step 3 and run migrations in SQL Editor

### "Invalid API key"
- Check that you copied the full key (they're long!)
- Verify you're using `SUPABASE_SERVICE_KEY` (not `SUPABASE_ANON_KEY`) for seed script
- Keys are visible in Project Settings → API

### "Network error" or connection timeout
- Check your internet connection
- Verify `SUPABASE_URL` is correct (should start with `https://`)
- Make sure Supabase project is fully provisioned (wait a few minutes after creation)

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (verify: `git check-ignore .env.local` returns `.env.local`)
- [ ] Never commit `SUPABASE_SERVICE_KEY` to git
- [ ] Don't expose service key to client-side code (use `SUPABASE_ANON_KEY` in browser)
- [ ] Keep database password secure (stored in password manager)

---

## Next Steps

Once setup is complete:
1. Mark this file's status as: `**Status:** ✅ Complete`
2. Proceed to plan 01-04 (Scraper and Corpus Generation)
3. The seed script will be ready to import corpus data

---

**Setup completed?** Update status at top of this file to: `**Status:** ✅ Complete`
