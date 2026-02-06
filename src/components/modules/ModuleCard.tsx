import Link from 'next/link'
import type { Module } from '@/lib/types/module'

interface ModuleCardProps {
  module: Module
}

export function ModuleCard({ module }: ModuleCardProps) {
  return (
    <Link
      href={`/modules/${module.id}/edit`}
      className="group block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-1 h-4 w-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: module.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
            {module.name}
          </h3>
          {module.notes && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {module.notes}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
