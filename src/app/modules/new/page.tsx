import { ModuleForm } from '@/components/modules/ModuleForm'
import Link from 'next/link'

export default function NewModulePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <Link
            href="/modules"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            &larr; Back to Modules
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            New Module
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Create a thematic category for tagging passages
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ModuleForm mode="create" />
        </div>
      </div>
    </div>
  )
}
