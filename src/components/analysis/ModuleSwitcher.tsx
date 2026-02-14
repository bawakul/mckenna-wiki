'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Module } from '@/lib/types/module'

interface ModuleSwitcherProps {
  currentModuleId: string
  modules: Pick<Module, 'id' | 'name' | 'color'>[]
}

export function ModuleSwitcher({ currentModuleId, modules }: ModuleSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const currentModule = modules.find(m => m.id === currentModuleId)

  function handleSelect(moduleId: string) {
    setIsOpen(false)
    if (moduleId !== currentModuleId) {
      router.push(`/analysis/modules/${moduleId}`)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {currentModule && (
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: currentModule.color }}
          />
        )}
        <span>Switch module</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {modules.map(module => (
              <button
                key={module.id}
                onClick={() => handleSelect(module.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                  module.id === currentModuleId
                    ? 'bg-zinc-100 dark:bg-zinc-700'
                    : ''
                }`}
              >
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: module.color }}
                />
                <span className="truncate text-zinc-900 dark:text-zinc-100">
                  {module.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
