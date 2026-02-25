-- Migration 007: Enable Row Level Security (RLS) on all tables
-- Applied via Supabase dashboard SQL editor (consistent with migrations 001-006)
-- This is a personal tool — permissive anon policies are sufficient for v1
--
-- The anon role covers unauthenticated Supabase client access (default client mode).
-- The module_traces view inherits RLS from its underlying tables automatically.

-- Enable RLS on all four tables
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- Permissive policies: allow all operations for anon role
-- USING (true)       — allows all SELECT/DELETE operations (row filter)
-- WITH CHECK (true)  — allows all INSERT/UPDATE operations (write filter)

CREATE POLICY "Allow all access" ON transcripts
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access" ON transcript_paragraphs
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access" ON modules
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access" ON annotations
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
