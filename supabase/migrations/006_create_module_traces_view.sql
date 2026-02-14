-- Module Traces View
-- Creates a denormalized view joining annotations with transcript and module metadata
-- Used by module tracing feature to display all passages for a given module across corpus

-- Module traces view for cross-corpus analysis
CREATE VIEW module_traces AS
SELECT
  -- Annotation fields
  a.id,
  a.module_id,
  a.highlighted_text,
  a.selector,
  a.start_paragraph_id,
  a.end_paragraph_id,
  a.created_at as annotation_created_at,

  -- Transcript metadata (for display and sorting)
  t.id as transcript_id,
  t.title as transcript_title,
  t.date as transcript_date,

  -- Module metadata (for display)
  m.name as module_name,
  m.color as module_color

FROM annotations a
INNER JOIN transcripts t ON a.transcript_id = t.id
LEFT JOIN modules m ON a.module_id = m.id

-- Default chronological order (oldest lectures first, nulls last)
ORDER BY t.date ASC NULLS LAST, a.created_at ASC;

-- Table comment explaining purpose
COMMENT ON VIEW module_traces IS
  'Denormalized view of annotations with transcript and module metadata.
   Used by module tracing feature to display all passages for a given module
   across the entire corpus, sorted chronologically by lecture date.

   Uses INNER JOIN with transcripts (filters orphaned annotations)
   and LEFT JOIN with modules (supports untagged highlights).

   Existing indexes (idx_annotations_module, idx_annotations_transcript)
   accelerate queries. No materialization needed for 1000-row scale.';
