'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteModule, getModuleWithUsageCount } from '@/app/modules/actions'

interface DeleteModuleDialogProps {
  moduleId: string
  moduleName: string
}

export function DeleteModuleDialog({ moduleId, moduleName }: DeleteModuleDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [highlightCount, setHighlightCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenDialog() {
    setIsLoading(true)
    setError(null)

    const result = await getModuleWithUsageCount(moduleId)
    if (!result.success) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setHighlightCount(result.data.highlight_count)
    setIsOpen(true)
    setIsLoading(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    const result = await deleteModule(moduleId)
    if (!result.success) {
      setError(result.error)
      setIsDeleting(false)
      return
    }

    router.push('/modules')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={handleOpenDialog}
        disabled={isLoading}
        className="
          rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700
          hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed
          dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50
        "
      >
        {isLoading ? 'Loading...' : 'Delete Module'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete &quot;{moduleName}&quot;?
            </h3>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {highlightCount === 0 ? (
                'This module has no tagged highlights and can be safely deleted.'
              ) : (
                <>
                  This will affect <strong className="text-zinc-900 dark:text-zinc-100">{highlightCount}</strong> highlight{highlightCount === 1 ? '' : 's'}.
                  {' '}Those highlights will become untagged but won&apos;t be deleted.
                </>
              )}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="
                  rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700
                  hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="
                  rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
                  hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isDeleting ? 'Deleting...' : 'Delete Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
