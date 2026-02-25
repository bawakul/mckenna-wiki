'use client'

import { useEffect, useMemo } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'
import { MAX_HIGHLIGHT_PARAGRAPHS } from './useTextSelection'

interface SelectionToolbarProps {
  /** Bounding rect of the selection */
  selectionRect: DOMRect | null
  /** Called when user clicks Highlight button */
  onHighlight: () => void
  /** Whether to show the toolbar */
  isVisible: boolean
  /** Whether the selection exceeds the paragraph limit */
  exceedsLimit?: boolean
  /** Called to clear the exceedsLimit state (after auto-dismiss) */
  onClearExceedsLimit?: () => void
}

export function SelectionToolbar({
  selectionRect,
  onHighlight,
  isVisible,
  exceedsLimit = false,
  onClearExceedsLimit,
}: SelectionToolbarProps) {
  // Create virtual element from selection rect
  const virtualElement = useMemo(() => ({
    getBoundingClientRect: () => selectionRect || new DOMRect(),
  }), [selectionRect])

  const { refs, floatingStyles } = useFloating({
    open: isVisible,
    placement: 'top',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['bottom', 'top-start', 'bottom-start'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Update reference when selection changes
  useEffect(() => {
    if (isVisible && selectionRect) {
      refs.setPositionReference(virtualElement)
    }
  }, [isVisible, selectionRect, virtualElement, refs])

  // Auto-dismiss the exceeds-limit warning after 3 seconds
  useEffect(() => {
    if (!exceedsLimit) return
    const timer = setTimeout(() => {
      onClearExceedsLimit?.()
    }, 3000)
    return () => clearTimeout(timer)
  }, [exceedsLimit, onClearExceedsLimit])

  // Show limit warning (no selection rect needed — fixed position below cursor)
  if (exceedsLimit) {
    return (
      <div
        data-selection-toolbar
        className="
          fixed top-4 left-1/2 -translate-x-1/2
          z-50 bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg border border-amber-200 dark:border-amber-700
          px-4 py-2
          animate-in fade-in-0 zoom-in-95 duration-100
        "
      >
        <p className="text-sm font-medium text-amber-700">
          Selection too large (max {MAX_HIGHLIGHT_PARAGRAPHS} paragraphs)
        </p>
      </div>
    )
  }

  if (!isVisible || !selectionRect) {
    return null
  }

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      data-selection-toolbar
      onMouseDown={(e) => {
        // Prevent losing the text selection when clicking the toolbar
        e.preventDefault()
      }}
      className="
        z-50 bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg border border-gray-200 dark:border-[#2d2d4a]
        px-2 py-1.5 flex items-center gap-2
        animate-in fade-in-0 zoom-in-95 duration-100
      "
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onHighlight()
        }}
        className="
          text-sm font-medium text-amber-700 hover:text-amber-800
          bg-amber-50 hover:bg-amber-100
          px-3 py-1 rounded-md
          transition-colors
        "
      >
        Highlight
      </button>
    </div>
  )
}
