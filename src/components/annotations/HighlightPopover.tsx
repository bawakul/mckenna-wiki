'use client'

import { useState, useRef, useEffect } from 'react'
import {
  useFloating,
  useDismiss,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'
import { ModuleSelector } from '@/components/modules/ModuleSelector'
import { updateAnnotationModule, deleteAnnotation } from '@/app/annotations/actions'
import type { AnnotationWithModule } from '@/lib/types/annotation'

interface HighlightPopoverProps {
  /** The annotation to display */
  annotation: AnnotationWithModule
  /** Anchor element to position the popover relative to */
  anchorElement: HTMLElement | null
  /** Whether the popover is open */
  isOpen: boolean
  /** Called when popover should close */
  onClose: () => void
  /** Called after annotation is updated or deleted */
  onUpdated: () => void
}

/**
 * Popover for viewing and editing highlight details
 * Shows highlighted text preview, module tag, and actions
 */
export function HighlightPopover({
  annotation,
  anchorElement,
  isOpen,
  onClose,
  onUpdated,
}: HighlightPopoverProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Virtual reference for Floating UI
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) {
        onClose()
      }
    },
    placement: 'bottom-start',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Set the anchor element as reference
  useEffect(() => {
    if (anchorElement) {
      refs.setReference(anchorElement)
    }
  }, [anchorElement, refs])

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
  })
  const { getFloatingProps } = useInteractions([dismiss])

  // Reset state when popover closes
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false)
      setShowModuleSelector(false)
    }
  }, [isOpen])

  // Truncate highlighted text for preview
  const previewText = annotation.highlighted_text.length > 100
    ? annotation.highlighted_text.slice(0, 100) + '...'
    : annotation.highlighted_text

  async function handleModuleSelect(moduleId: string) {
    setIsUpdating(true)
    const result = await updateAnnotationModule(annotation.id, moduleId)
    setIsUpdating(false)

    if (result.success) {
      setShowModuleSelector(false)
      onUpdated()
      onClose()
    }
  }

  async function handleRemoveModule() {
    setIsUpdating(true)
    const result = await updateAnnotationModule(annotation.id, null)
    setIsUpdating(false)

    if (result.success) {
      onUpdated()
      onClose()
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteAnnotation(annotation.id, annotation.transcript_id)
    setIsDeleting(false)

    if (result.success) {
      onUpdated()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      {...getFloatingProps()}
      className="
        z-50 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg
        dark:border-zinc-700 dark:bg-zinc-900
      "
    >
      {/* Text preview */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
          "{previewText}"
        </p>
      </div>

      {/* Current module tag */}
      {annotation.module && (
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: annotation.module.color }}
          />
          <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {annotation.module.name}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="p-2 space-y-1">
        {/* Module selector or toggle button */}
        {showModuleSelector ? (
          <div className="pb-2">
            <ModuleSelector
              open={true}
              onOpenChange={(open) => !open && setShowModuleSelector(false)}
              onSelect={handleModuleSelect}
              onDismiss={() => setShowModuleSelector(false)}
              placement="bottom-start"
              trigger={<span />}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowModuleSelector(true)}
            disabled={isUpdating}
            className="
              w-full text-left px-2 py-1.5 text-sm rounded
              text-zinc-700 dark:text-zinc-300
              hover:bg-zinc-100 dark:hover:bg-zinc-800
              disabled:opacity-50
            "
          >
            {annotation.module ? 'Change Module' : 'Tag with Module'}
          </button>
        )}

        {/* Remove module (only if tagged) */}
        {annotation.module && !showModuleSelector && (
          <button
            type="button"
            onClick={handleRemoveModule}
            disabled={isUpdating}
            className="
              w-full text-left px-2 py-1.5 text-sm rounded
              text-zinc-700 dark:text-zinc-300
              hover:bg-zinc-100 dark:hover:bg-zinc-800
              disabled:opacity-50
            "
          >
            Remove Module
          </button>
        )}

        {/* Delete highlight */}
        {showDeleteConfirm ? (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                flex-1 px-2 py-1.5 text-sm rounded
                bg-red-600 text-white
                hover:bg-red-700
                disabled:opacity-50
              "
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="
                flex-1 px-2 py-1.5 text-sm rounded
                text-zinc-700 dark:text-zinc-300
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                disabled:opacity-50
              "
            >
              Cancel
            </button>
          </div>
        ) : (
          !showModuleSelector && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="
                w-full text-left px-2 py-1.5 text-sm rounded
                text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
              "
            >
              Delete Highlight
            </button>
          )
        )}
      </div>
    </div>
  )
}
