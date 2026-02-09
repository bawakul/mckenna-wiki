-- Annotations Database Schema
-- Creates annotations table for text highlighting with W3C-compliant selector storage

-- Annotations table (text highlights with optional module tagging)
-- Each annotation represents a highlighted passage in a transcript
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,  -- Optional, nullable

  -- W3C selector stored as JSONB for flexibility
  -- Contains TextQuoteSelector, TextPositionSelector, and ParagraphAnchor for robust re-anchoring
  selector JSONB NOT NULL,

  -- Denormalized fields for fast queries
  highlighted_text TEXT NOT NULL,
  start_paragraph_id INTEGER REFERENCES transcript_paragraphs(id) ON DELETE CASCADE,
  end_paragraph_id INTEGER REFERENCES transcript_paragraphs(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by transcript (most common query)
CREATE INDEX idx_annotations_transcript ON annotations(transcript_id);

-- Index for module trace queries (find all annotations with a specific module)
CREATE INDEX idx_annotations_module ON annotations(module_id);

-- Index for viewport queries (find annotations visible in paragraph range)
CREATE INDEX idx_annotations_paragraphs ON annotations(start_paragraph_id, end_paragraph_id);

-- GIN index on selector JSONB for flexible querying during re-anchoring
CREATE INDEX idx_annotations_selector ON annotations USING GIN(selector);

-- Attach updated_at trigger (function defined in 001_create_corpus_tables.sql)
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table and column comments explaining design decisions
COMMENT ON TABLE annotations IS 'Text highlights in transcripts with optional module tagging. Uses W3C Web Annotation selectors for robust text anchoring.';
COMMENT ON COLUMN annotations.module_id IS 'Optional module tag. NULL means untagged highlight. ON DELETE SET NULL keeps highlight if module is deleted.';
COMMENT ON COLUMN annotations.selector IS 'W3C-compliant hybrid selector (TextQuoteSelector + TextPositionSelector + ParagraphAnchor) stored as JSONB for robust re-anchoring.';
COMMENT ON COLUMN annotations.highlighted_text IS 'Denormalized copy of selected text for display without parsing selector.';
COMMENT ON COLUMN annotations.start_paragraph_id IS 'First paragraph containing highlight. ON DELETE CASCADE removes highlight if paragraph is deleted.';
COMMENT ON COLUMN annotations.end_paragraph_id IS 'Last paragraph containing highlight (same as start for single-paragraph highlights).';
