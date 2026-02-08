'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TranscriptParagraph } from '@/lib/types/transcript'
import { ParagraphView, shouldShowSpeaker } from './ParagraphView'

interface VirtualizedReaderProps {
  paragraphs: TranscriptParagraph[]
  searchQuery?: string
  currentSearchParagraphIndex?: number
  hasTimestamps?: boolean
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void
  onScrollToIndexReady?: (fn: (index: number) => void) => void
}

export function VirtualizedReader({
  paragraphs,
  searchQuery,
  currentSearchParagraphIndex,
  hasTimestamps = false,
  onVisibleRangeChange,
  onScrollToIndexReady,
}: VirtualizedReaderProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Memoize speaker visibility calculations
  const speakerVisibility = useMemo(() => {
    return paragraphs.map((para, index) =>
      shouldShowSpeaker(para, paragraphs[index - 1])
    )
  }, [paragraphs])

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
      ref={parentRef}
      data-virtualized-container
      className="h-[calc(100vh-200px)] overflow-auto"
      style={{
        contain: 'strict', // Performance optimization
      }}
    >
      <div
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
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
