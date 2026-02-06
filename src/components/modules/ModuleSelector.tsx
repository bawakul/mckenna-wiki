'use client'

import { useState, useEffect } from 'react'
import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'
import { getModulesSortedByRecent, touchModuleLastUsed } from '@/app/modules/actions'
import { InlineModuleCreator } from './InlineModuleCreator'
import type { Module } from '@/lib/types/module'

interface ModuleSelectorProps {
  /** Called when user selects a module */
  onSelect: (moduleId: string) => void
  /** Called when selector is dismissed without selection */
  onDismiss?: () => void
  /** Custom trigger element (optional - uses default button if not provided) */
  trigger?: React.ReactNode
  /** Control open state externally (for programmatic triggering) */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Position relative to reference */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
}

export function ModuleSelector({
  onSelect,
  onDismiss,
  trigger,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom-start',
}: ModuleSelectorProps) {
  // Controlled vs uncontrolled open state
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const setIsOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setUncontrolledOpen(newOpen)
    }
    if (!newOpen && onDismiss) {
      onDismiss()
    }
  }

  // Module data
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showInlineCreator, setShowInlineCreator] = useState(false)

  // Floating UI setup
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  // Load modules when opening
  useEffect(() => {
    if (isOpen) {
      loadModules()
    }
  }, [isOpen])

  async function loadModules() {
    setIsLoading(true)
    const result = await getModulesSortedByRecent()
    if (result.success) {
      setModules(result.data)
    }
    setIsLoading(false)
  }

  async function handleSelect(moduleId: string) {
    // Update last_used_at for the selected module
    await touchModuleLastUsed(moduleId)
    onSelect(moduleId)
    setIsOpen(false)
    setShowInlineCreator(false)
  }

  function handleInlineCreated(moduleId: string) {
    // Immediately select the newly created module
    handleSelect(moduleId)
  }

  return (
    <>
      {/* Reference element (trigger) */}
      <div ref={refs.setReference} {...getReferenceProps()}>
        {trigger || (
          <button
            type="button"
            className="
              rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700
              hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700
            "
          >
            Tag with Module
          </button>
        )}
      </div>

      {/* Floating dropdown */}
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="
            z-50 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg
            dark:border-zinc-700 dark:bg-zinc-900
            max-h-80 overflow-hidden flex flex-col
          "
        >
          {/* Module list */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                Loading modules...
              </div>
            ) : modules.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                No modules yet
              </div>
            ) : (
              <ul className="py-1">
                {modules.map((module) => (
                  <li key={module.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(module.id)}
                      className="
                        w-full text-left px-3 py-2 flex items-center gap-2
                        hover:bg-zinc-100 dark:hover:bg-zinc-800
                        text-zinc-900 dark:text-zinc-100
                      "
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: module.color }}
                      />
                      <span className="truncate text-sm">{module.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Create new option */}
          {showInlineCreator ? (
            <InlineModuleCreator
              onCreated={handleInlineCreated}
              onCancel={() => setShowInlineCreator(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowInlineCreator(true)}
              className="
                w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400
                hover:bg-zinc-50 dark:hover:bg-zinc-800
                border-t border-zinc-200 dark:border-zinc-700
                flex items-center gap-2
              "
            >
              <span className="w-3 h-3 flex items-center justify-center text-zinc-400">+</span>
              Create new module
            </button>
          )}
        </div>
      )}
    </>
  )
}
