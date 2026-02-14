import Link from 'next/link'
import type { Module } from '@/lib/types/module'

interface ModuleCardProps {
  module: Module
  passageCount?: number  // Optional for backward compatibility
}

export function ModuleCard({ module, passageCount }: ModuleCardProps) {
  return (
    <div className="group rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div
          className="mt-1 h-4 w-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: module.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {module.name}
          </h3>
          {module.notes && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {module.notes}
            </p>
          )}

          {/* Actions row */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <Link
              href={`/modules/${module.id}/edit`}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Edit
            </Link>
            <Link
              href={`/analysis/modules/${module.id}`}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              View traces
              {passageCount !== undefined && passageCount > 0 && (
                <span className="ml-1 text-zinc-400">({passageCount})</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
