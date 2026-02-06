import { createClient } from '@/lib/supabase/server'
import { ModuleForm } from '@/components/modules/ModuleForm'
import { DeleteModuleDialog } from '@/components/modules/DeleteModuleDialog'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface EditModulePageProps {
  params: Promise<{ id: string }>
}

export default async function EditModulePage({ params }: EditModulePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: module, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !module) {
    notFound()
  }

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
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: module.color }}
            />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Edit Module
            </h1>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ModuleForm module={module} mode="edit" />
        </div>

        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="text-lg font-medium text-red-900 dark:text-red-100">
            Danger Zone
          </h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Deleting this module will remove it permanently. Highlights tagged with this module will become untagged.
          </p>
          <div className="mt-4">
            <DeleteModuleDialog moduleId={module.id} moduleName={module.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
