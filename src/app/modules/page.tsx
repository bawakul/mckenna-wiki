import { createClient } from '@/lib/supabase/server'
import { ModuleCard } from '@/components/modules/ModuleCard'
import { BulkExportButton } from '@/components/export/BulkExportButton'
import Link from 'next/link'
import type { Module } from '@/lib/types/module'

export default async function ModulesPage() {
  const supabase = await createClient()

  // Fetch modules and annotation counts
  const [modulesResult, countsResult] = await Promise.all([
    supabase.from('modules').select('*').order('created_at', { ascending: false }),
    supabase.from('annotations').select('module_id').not('module_id', 'is', null)
  ])

  const modules = modulesResult.data || []

  // Count passages per module
  const passageCounts: Record<string, number> = {}
  for (const ann of countsResult.data || []) {
    if (ann.module_id) {
      passageCounts[ann.module_id] = (passageCounts[ann.module_id] || 0) + 1
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Modules
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Thematic categories for tagging passages in McKenna lectures
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BulkExportButton modules={modules} format="markdown" />
            <BulkExportButton modules={modules} format="csv" />
            <Link
              href="/modules/new"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              New Module
            </Link>
          </div>
        </div>

        {modules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map((module: Module) => (
              <ModuleCard
                key={module.id}
                module={module}
                passageCount={passageCounts[module.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-600 dark:text-zinc-400">
              No modules yet. Create your first module to start tagging passages.
            </p>
            <Link
              href="/modules/new"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
            >
              Create your first module
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
