-- McKenna Corpus Search Functions
-- RPC functions for full-text search across transcripts and paragraphs

-- Search paragraphs by text content
-- Returns matching paragraphs with transcript metadata and relevance ranking
CREATE OR REPLACE FUNCTION search_paragraphs(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  transcript_id TEXT,
  transcript_title TEXT,
  transcript_date TEXT,
  paragraph_position INTEGER,
  speaker TEXT,
  paragraph_text TEXT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.transcript_id,
    t.title AS transcript_title,
    t.date AS transcript_date,
    p.position AS paragraph_position,
    p.speaker,
    p.text AS paragraph_text,
    ts_rank(p.search_vector, query) AS rank
  FROM
    transcript_paragraphs p
    INNER JOIN transcripts t ON p.transcript_id = t.id,
    websearch_to_tsquery('english', search_query) query
  WHERE
    p.search_vector @@ query
  ORDER BY
    rank DESC,
    t.date DESC NULLS LAST,
    p.position ASC
  LIMIT result_limit;
END;
$$;

-- Search transcripts by metadata (title, description, tags, authors)
-- Returns matching transcripts with relevance ranking
CREATE OR REPLACE FUNCTION search_transcripts(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  date TEXT,
  word_count INTEGER,
  topic_tags TEXT[],
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.date,
    t.word_count,
    t.topic_tags,
    ts_rank(t.search_vector, query) AS rank
  FROM
    transcripts t,
    websearch_to_tsquery('english', search_query) query
  WHERE
    t.search_vector @@ query
  ORDER BY
    rank DESC,
    t.date DESC NULLS LAST
  LIMIT result_limit;
END;
$$;
