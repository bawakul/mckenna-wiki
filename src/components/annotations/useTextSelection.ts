'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { snapToWordBoundaries } from '@/lib/annotations/selectors'

interface SelectionState {
  range: Range | null
  text: string
  rect: DOMRect | null
}

interface UseTextSelectionOptions {
  /** Container element to listen for selections in */
  containerRef: React.RefObject<HTMLElement | null>
  /** Called when selection is cleared (user clicks elsewhere) */
  onSelectionClear?: () => void
}

export function useTextSelection({ containerRef, onSelectionClear }: UseTextSelectionOptions) {
  const [selection, setSelection] = useState<SelectionState>({
    range: null,
    text: '',
    rect: null,
  })

  // Store selection in ref to avoid stale closure issues
  const selectionRef = useRef<SelectionState>(selection)
  selectionRef.current = selection

  const clearSelection = useCallback(() => {
    setSelection({ range: null, text: '', rect: null })
    onSelectionClear?.()
  }, [onSelectionClear])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Capture container in closure for callbacks
    const containerElement = container

    function handleMouseUp(event: MouseEvent) {
      // Don't clear selection if clicking on a toolbar button
      const target = event.target as HTMLElement
      if (target.closest('[data-selection-toolbar]')) {
        return
      }

      // Small delay to let browser finalize selection
      requestAnimationFrame(() => {
        const sel = window.getSelection()

        // No selection or collapsed (just a click)
        if (!sel || sel.isCollapsed) {
          // Only clear if we had a selection before
          if (selectionRef.current.range) {
            clearSelection()
          }
          return
        }

        // Check if selection is within our container
        const range = sel.getRangeAt(0)
        if (!containerElement.contains(range.commonAncestorContainer)) {
          return
        }

        const text = range.toString().trim()
        if (text.length === 0) {
          clearSelection()
          return
        }

        // Snap to word boundaries
        const snappedRange = snapToWordBoundaries(range)
        const snappedText = snappedRange.toString()

        // Get bounding rect for positioning toolbar
        const rect = snappedRange.getBoundingClientRect()

        setSelection({
          range: snappedRange,
          text: snappedText,
          rect,
        })
      })
    }

    // Listen for selections ending
    document.addEventListener('mouseup', handleMouseUp)

    // Clear selection when clicking outside
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      // If clicking outside container and we have a selection, clear it
      if (!containerElement.contains(target) && selectionRef.current.range) {
        clearSelection()
        window.getSelection()?.removeAllRanges()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [containerRef, clearSelection])

  return {
    selection,
    clearSelection,
    hasSelection: selection.range !== null,
  }
}
