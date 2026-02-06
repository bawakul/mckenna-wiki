'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModuleColorPicker } from './ModuleColorPicker'
import { createModule, updateModule } from '@/app/modules/actions'
import { PRESET_COLORS, MODULE_NAME_SOFT_LIMIT, isNameOverSoftLimit } from '@/lib/types/module'
import type { Module } from '@/lib/types/module'

interface ModuleFormProps {
  module?: Module
  mode: 'create' | 'edit'
}

export function ModuleForm({ module, mode }: ModuleFormProps) {
  const router = useRouter()
  const [name, setName] = useState(module?.name ?? '')
  const [notes, setNotes] = useState(module?.notes ?? '')
  const [color, setColor] = useState(module?.color ?? PRESET_COLORS[0].value)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = mode === 'create'
        ? await createModule(formData)
        : await updateModule(module!.id, formData)

      if (!result.success) {
        setError(result.error)
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
        return
      }

      router.push('/modules')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const nameOverLimit = isNameOverSoftLimit(name)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && !Object.keys(fieldErrors).length && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`
            w-full rounded-lg border px-4 py-2 text-zinc-900 dark:text-zinc-100
            bg-white dark:bg-zinc-950
            ${fieldErrors.name
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-2
          `}
          placeholder="e.g., Novelty Theory"
          maxLength={100}
          required
        />
        <div className="mt-1 flex justify-between text-sm">
          {fieldErrors.name ? (
            <span className="text-red-600 dark:text-red-400">{fieldErrors.name[0]}</span>
          ) : nameOverLimit ? (
            <span className="text-amber-600 dark:text-amber-400">
              Consider a shorter name for better readability
            </span>
          ) : (
            <span />
          )}
          <span className={`${nameOverLimit ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
            {name.length}/{MODULE_NAME_SOFT_LIMIT}
          </span>
        </div>
      </div>

      <ModuleColorPicker value={color} onChange={setColor} />

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Notes
          <span className="ml-2 text-zinc-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="
            w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2
            text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950
            focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2
          "
          placeholder="Capture your insights and understanding about this theme..."
        />
        <p className="mt-1 text-sm text-zinc-500">
          Use this space to write about the module's themes, patterns you've noticed, and evolving insights.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white
            hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
            dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200
          "
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Module' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/modules')}
          className="
            rounded-lg border border-zinc-300 dark:border-zinc-700 px-6 py-2
            text-sm font-medium text-zinc-700 dark:text-zinc-300
            hover:bg-zinc-50 dark:hover:bg-zinc-800
          "
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
