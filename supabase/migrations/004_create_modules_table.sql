-- Module System Database Schema
-- Creates modules table for thematic categorization of transcript passages

-- Enable citext extension for case-insensitive text (if not already enabled)
-- This allows unique constraint on name to be case-insensitive
CREATE EXTENSION IF NOT EXISTS citext;

-- Modules table (thematic categories for annotations)
-- Each module represents a recurring theme/concept across McKenna's transcripts
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE,  -- Case-insensitive unique name
  notes TEXT,                   -- Optional markdown content for module description
  color TEXT NOT NULL,          -- Hex color for UI display (e.g., '#e9d5ff')
  last_used_at TIMESTAMPTZ,     -- Nullable, for "recently used" sorting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on last_used_at for efficient sorting by recency
-- NULLS LAST ensures modules never used appear at the end when sorting DESC
CREATE INDEX idx_modules_last_used_at ON modules(last_used_at DESC NULLS LAST);

-- Attach updated_at trigger (function defined in 001_create_corpus_tables.sql)
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table comment explaining purpose
COMMENT ON TABLE modules IS 'Thematic modules for categorizing transcript passages. Each module represents a recurring theme or concept in McKenna''s work (e.g., "Time Wave", "Psychedelics", "Archaic Revival").';
COMMENT ON COLUMN modules.name IS 'Case-insensitive unique name for the module';
COMMENT ON COLUMN modules.notes IS 'Optional markdown description of the module theme';
COMMENT ON COLUMN modules.color IS 'Hex color code for UI display (e.g., #e9d5ff)';
COMMENT ON COLUMN modules.last_used_at IS 'Timestamp of last annotation using this module, for recency sorting';
