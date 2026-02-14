import { createClient } from '@/lib/supabase/server'
import { getModuleTraces, getModuleWithCount } from '@/lib/queries/module-traces'
import { TraceList } from '@/components/analysis/TraceList'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModuleTracePage({ params }: PageProps) {
  const { id } = await params

  // Parallel fetch (no waterfall)
  const [moduleWithCount, traces] = await Promise.all([
    getModuleWithCount(id),
    getModuleTraces(id)
  ])

  if (!moduleWithCount) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header with back link */}
        <div className="mb-8">
          <Link
            href="/modules"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            ← Back to modules
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {moduleWithCount.name}
            <span className="ml-3 text-zinc-500 text-lg font-normal">
              ({traces.length} {traces.length === 1 ? 'passage' : 'passages'})
            </span>
          </h1>
          {moduleWithCount.notes && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {moduleWithCount.notes}
            </p>
          )}
        </div>

        {traces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-600 dark:text-zinc-400">
              No passages tagged with this module yet.
            </p>
            <Link
              href="/transcripts"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
            >
              Browse transcripts to start tagging
            </Link>
          </div>
        ) : (
          <TraceList traces={traces} moduleColor={moduleWithCount.color} />
        )}
      </div>
    </div>
  )
}
