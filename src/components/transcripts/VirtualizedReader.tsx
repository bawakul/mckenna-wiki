'use client'

import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TranscriptParagraph } from '@/lib/types/transcript'
import type { AnnotationWithModule, ParagraphHighlight } from '@/lib/types/annotation'
import { ParagraphView, shouldShowSpeaker } from './ParagraphView'
import { useTextSelection } from '@/components/annotations/useTextSelection'
import { SelectionToolbar } from '@/components/annotations/SelectionToolbar'
import { createSelectorFromRange } from '@/lib/annotations/selectors'
import { createAnnotation } from '@/app/annotations/actions'
import { getHighlightsForParagraph } from '@/components/annotations/HighlightRenderer'

interface VirtualizedReaderProps {
  paragraphs: TranscriptParagraph[]
  transcriptId: string
  searchQuery?: string
  currentSearchParagraphIndex?: number
  hasTimestamps?: boolean
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void
  onScrollToIndexReady?: (fn: (index: number) => void) => void
  // Annotation props
  annotations?: AnnotationWithModule[]
  onAnnotationCreated?: () => void
  onHighlightClick?: (annotationId: string, element: HTMLElement) => void
}

export function VirtualizedReader({
  paragraphs,
  transcriptId,
  searchQuery,
  currentSearchParagraphIndex,
  hasTimestamps = false,
  onVisibleRangeChange,
  onScrollToIndexReady,
  annotations,
  onAnnotationCreated,
  onHighlightClick,
}: VirtualizedReaderProps) {
  // Ref for virtualizer scroll container
  const parentRef = useRef<HTMLDivElement>(null)
  // Ref for selection detection (shared with parentRef via callback ref)
  const containerRef = useRef<HTMLDivElement>(null)

  // Selection handling
  const { selection, hasSelection, clearSelection, exceedsLimit, clearExceedsLimit } = useTextSelection({
    containerRef,
  })

  // Memoize speaker visibility calculations
  const speakerVisibility = useMemo(() => {
    return paragraphs.map((para, index) =>
      shouldShowSpeaker(para, paragraphs[index - 1])
    )
  }, [paragraphs])

  // Memoize highlights per paragraph
  const highlightsByParagraph = useMemo(() => {
    const map = new Map<number, ParagraphHighlight[]>()
    if (!annotations) return map

    for (const para of paragraphs) {
      const highlights = getHighlightsForParagraph(annotations, para.id)
      if (highlights.length > 0) {
        map.set(para.id, highlights)
      }
    }
    return map
  }, [paragraphs, annotations])

  // Handle highlight creation
  const handleCreateHighlight = useCallback(async () => {
    if (!selection.range) return

    const container = containerRef.current
    if (!container) return

    try {
      const { selector, startParagraphId, endParagraphId } = createSelectorFromRange(
        selection.range,
        container
      )

      if (startParagraphId === 0 || endParagraphId === 0) {
        console.error('Failed to find paragraph IDs for highlight')
        return
      }

      const result = await createAnnotation({
        transcript_id: transcriptId,
        selector,
        highlighted_text: selection.text,
        start_paragraph_id: startParagraphId,
        end_paragraph_id: endParagraphId,
      })

      if (result.success) {
        clearSelection()
        window.getSelection()?.removeAllRanges()
        onAnnotationCreated?.()
      } else {
        console.error('Failed to create annotation:', result.error)
      }
    } catch (error) {
      console.error('Error creating highlight:', error)
    }
  }, [selection, transcriptId, clearSelection, onAnnotationCreated])

  // Handle clicking on a highlight
  const handleHighlightClick = useCallback((annotationId: string) => {
    const element = document.querySelector(`mark[data-annotation-id="${annotationId}"]`) as HTMLElement
    if (element && onHighlightClick) {
      onHighlightClick(annotationId, element)
    }
  }, [onHighlightClick])

  // Callback ref that assigns to both parentRef (virtualizer) and containerRef (selection)
  const sharedRef = useCallback((el: HTMLDivElement | null) => {
    // Update both refs to point to the same element
    (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    containerRef.current = el
  }, [])

  const virtualizer = useVirtualizer({
    count: paragraphs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated ~3-4 lines of text
    overscan: 5, // Render 5 extra items above/below viewport
    measureElement: (element) => element.getBoundingClientRect().height,
    // React 19 compatibility - prevents flushSync warnings
    useFlushSync: false,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Provide scroll function to parent
  useEffect(() => {
    onScrollToIndexReady?.((index: number) => {
      virtualizer.scrollToIndex(index, {
        align: 'start',
        behavior: 'auto',
      })
    })
  }, [virtualizer, onScrollToIndexReady])

  // Notify parent of visible range changes (for position memory)
  useEffect(() => {
    if (onVisibleRangeChange && virtualItems.length > 0) {
      const startIndex = virtualItems[0]?.index ?? 0
      const endIndex = virtualItems[virtualItems.length - 1]?.index ?? 0
      onVisibleRangeChange(startIndex, endIndex)
    }
  }, [virtualItems, onVisibleRangeChange])

  return (
    <div
      ref={sharedRef}
      data-virtualized-container
      className="h-full overflow-auto px-8 py-8"
      style={{
        contain: 'strict', // Performance optimization
      }}
    >
      {/* Selection toolbar */}
      <SelectionToolbar
        selectionRect={selection.rect}
        onHighlight={handleCreateHighlight}
        isVisible={hasSelection}
        exceedsLimit={exceedsLimit}
        onClearExceedsLimit={clearExceedsLimit}
      />

      <div
        className="max-w-2xl mx-auto"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const paragraph = paragraphs[virtualItem.index]
          const showSpeaker = speakerVisibility[virtualItem.index]
          const isCurrentMatch = currentSearchParagraphIndex === virtualItem.index
          const highlights = highlightsByParagraph.get(paragraph.id)

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ParagraphView
                paragraph={paragraph}
                showSpeaker={showSpeaker}
                searchQuery={searchQuery}
                isCurrentMatch={isCurrentMatch}
                hasTimestamps={hasTimestamps}
                highlights={highlights}
                onHighlightClick={handleHighlightClick}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
