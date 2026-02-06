'use client'

import { useState } from 'react'
import { createModule } from '@/app/modules/actions'
import { PRESET_COLORS } from '@/lib/types/module'

interface InlineModuleCreatorProps {
  onCreated: (moduleId: string) => void
  onCancel: () => void
}

export function InlineModuleCreator({ onCreated, onCancel }: InlineModuleCreatorProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    // Auto-assign first available color
    const formData = new FormData()
    formData.set('name', name.trim())
    formData.set('color', PRESET_COLORS[0].value)
    formData.set('notes', '')

    const result = await createModule(formData)

    if (!result.success) {
      setError(result.fieldErrors?.name?.[0] || result.error)
      setIsSubmitting(false)
      return
    }

    onCreated(result.data.id)
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New module name"
          className="
            flex-1 rounded-md border border-zinc-300 dark:border-zinc-600
            px-2 py-1.5 text-sm bg-white dark:bg-zinc-800
            text-zinc-900 dark:text-zinc-100
            placeholder:text-zinc-400
            focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500
          "
          autoFocus
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="
            rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white
            hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
            dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200
          "
        >
          {isSubmitting ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-md border border-zinc-300 dark:border-zinc-600
            px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400
            hover:bg-zinc-50 dark:hover:bg-zinc-800
          "
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  )
}
