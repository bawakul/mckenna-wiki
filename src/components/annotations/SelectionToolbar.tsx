'use client'

import { useEffect, useMemo } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'

interface SelectionToolbarProps {
  /** Bounding rect of the selection */
  selectionRect: DOMRect | null
  /** Called when user clicks Highlight button */
  onHighlight: () => void
  /** Whether to show the toolbar */
  isVisible: boolean
}

export function SelectionToolbar({
  selectionRect,
  onHighlight,
  isVisible,
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

  if (!isVisible || !selectionRect) {
    return null
  }

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="
        z-50 bg-white rounded-lg shadow-lg border border-gray-200
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
