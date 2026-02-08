-- McKenna Corpus Database Schema
-- Creates transcript and paragraph tables with full-text search support

-- Transcripts table (lecture-level metadata)
CREATE TABLE transcripts (
  id TEXT PRIMARY KEY,  -- URL slug from organism.earth
  url TEXT NOT NULL,    -- Full source URL
  title TEXT NOT NULL,
  date TEXT,            -- Stored as-is from source (may be year only or full date)
  location TEXT,
  speakers TEXT[],      -- Array of speaker names
  duration_minutes INTEGER,
  word_count INTEGER,
  topic_tags TEXT[],    -- Array of topic/tag strings
  referenced_authors TEXT[],  -- Array of referenced author names
  description TEXT,     -- Transcript summary/description if available
  content_hash TEXT NOT NULL,  -- SHA-256 of normalized content for change detection
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- tsvector column for full-text search (populated by trigger)
  search_vector tsvector
);

-- Transcript paragraphs table (paragraph-level content)
CREATE TABLE transcript_paragraphs (
  id SERIAL PRIMARY KEY,
  transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,  -- Zero-indexed sequential order
  speaker TEXT,               -- NULL if not identified
  timestamp TEXT,             -- NULL if not available; stored as-is from source
  text TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- First 16 hex chars of SHA-256 for stable anchoring
  -- tsvector column for full-text search (populated by trigger)
  search_vector tsvector,
  UNIQUE(transcript_id, position)
);

-- Indexes for full-text search performance
CREATE INDEX idx_transcripts_search_vector ON transcripts USING gin(search_vector);
CREATE INDEX idx_transcript_paragraphs_search_vector ON transcript_paragraphs USING gin(search_vector);

-- Indexes for foreign key and query optimization
CREATE INDEX idx_transcript_paragraphs_transcript_id ON transcript_paragraphs(transcript_id);
CREATE INDEX idx_transcripts_date ON transcripts(date);

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to transcripts table
CREATE TRIGGER update_transcripts_updated_at
  BEFORE UPDATE ON transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to update transcripts search_vector
CREATE OR REPLACE FUNCTION update_transcripts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.topic_tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.referenced_authors, ' '), '')), 'C');
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach search vector trigger to transcripts
CREATE TRIGGER update_transcripts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_transcripts_search_vector();

-- Trigger function to update transcript_paragraphs search_vector
CREATE OR REPLACE FUNCTION update_paragraphs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.text, ''));
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach search vector trigger to paragraphs
CREATE TRIGGER update_paragraphs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON transcript_paragraphs
  FOR EACH ROW
  EXECUTE FUNCTION update_paragraphs_search_vector();
