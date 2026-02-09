import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TranscriptReader } from '@/components/transcripts/TranscriptReader'
import { getAnnotationsForTranscript } from '@/app/annotations/actions'
import type { TranscriptWithParagraphs } from '@/lib/types/transcript'

interface TranscriptPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TranscriptPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: transcript } = await supabase
    .from('transcripts')
    .select('title')
    .eq('id', id)
    .single()

  if (!transcript) {
    return { title: 'Transcript Not Found' }
  }

  return {
    title: transcript.title,
    description: `McKenna lecture transcript: ${transcript.title}`,
  }
}

export default async function TranscriptPage({ params }: TranscriptPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch transcript with all paragraphs
  const { data: transcript, error } = await supabase
    .from('transcripts')
    .select(`
      *,
      transcript_paragraphs (
        id,
        position,
        speaker,
        timestamp,
        text,
        content_hash
      )
    `)
    .eq('id', id)
    .single()

  if (error || !transcript) {
    notFound()
  }

  // Fetch annotations for server-side rendering
  const annotationsResult = await getAnnotationsForTranscript(id)
  const annotations = annotationsResult.success ? annotationsResult.data : []

  return (
    <TranscriptReader
      transcript={transcript as TranscriptWithParagraphs}
      initialAnnotations={annotations}
    />
  )
}
