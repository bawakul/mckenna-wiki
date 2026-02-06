-- Verification Helper Functions
-- These support the verify-corpus.ts script for validating phase 1 success criteria

-- Check for orphaned paragraphs (paragraphs without valid transcript)
CREATE OR REPLACE FUNCTION check_orphan_paragraphs()
RETURNS TABLE (paragraph_id INTEGER, transcript_id TEXT)
LANGUAGE SQL
AS $$
  SELECT p.id, p.transcript_id
  FROM transcript_paragraphs p
  LEFT JOIN transcripts t ON p.transcript_id = t.id
  WHERE t.id IS NULL
  LIMIT 10;
$$;

-- Count transcripts that have no paragraphs
CREATE OR REPLACE FUNCTION count_transcripts_without_paragraphs()
RETURNS INTEGER
LANGUAGE SQL
AS $$
  SELECT COUNT(*)::INTEGER
  FROM transcripts t
  LEFT JOIN transcript_paragraphs p ON t.id = p.transcript_id
  WHERE p.id IS NULL;
$$;

-- Count duplicate content hashes in transcripts
CREATE OR REPLACE FUNCTION count_duplicate_hashes()
RETURNS INTEGER
LANGUAGE SQL
AS $$
  SELECT COALESCE(SUM(dup_count - 1), 0)::INTEGER
  FROM (
    SELECT content_hash, COUNT(*) as dup_count
    FROM transcripts
    GROUP BY content_hash
    HAVING COUNT(*) > 1
  ) duplicates;
$$;
