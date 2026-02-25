---
created: 2026-02-25T13:59:40.583Z
title: Password gate for write operations
area: auth
files:
  - src/app/layout.tsx
  - src/middleware.ts
---

## Problem

The deployed app (mckenna-wiki.vercel.app) has no authentication. Anyone with the URL can create, edit, and delete modules and highlights. RLS policies are permissive (`USING(true)`) and the Supabase anon key is public. Need a simple lock on write operations.

## Solution

Password gate (Option A from discussion):

1. Add `AUTH_PASSWORD` env var (Vercel + local)
2. Create `/login` page with single password field
3. On correct password, set a secure httpOnly cookie
4. Add Next.js middleware (`src/middleware.ts`) that checks cookie on mutation routes
5. Transcript reads stay public (no cookie needed)
6. ~30 min to build, zero ongoing maintenance
