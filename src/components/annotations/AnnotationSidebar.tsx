'use client'

import { useState, useCallback, useEffect } from 'react'
import type { AnnotationWithModule } from '@/lib/types/annotation'

interface AnnotationSidebarProps {
  /** All annotations in the transcript */
  annotations: AnnotationWithModule[]
  /** Whether sidebar is open */
  isOpen: boolean
  /** Toggle sidebar visibility */
  onToggle: () => void
  /** Called when an annotation is clicked */
  onAnnotationClick: (annotation: AnnotationWithModule) => void
  /** IDs of annotations currently visible in viewport */
  visibleAnnotationIds?: Set<string>
}

/**
 * Scroll to an annotation in the document
 * Finds the mark element by data-annotation-id and scrolls it into view
 */
export function scrollToAnnotation(annotationId: string): void {
  const mark = document.querySelector(`[data-annotation-id="${annotationId}"]`)
  if (mark) {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

/**
 * Hook to track which annotation marks are visible in the viewport
 * Uses IntersectionObserver for efficiency
 */
export function useVisibleAnnotations(
  annotations: AnnotationWithModule[],
  enabled: boolean = true
): Set<string> {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || annotations.length === 0) {
      setVisibleIds(new Set())
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev)
          for (const entry of entries) {
            const id = entry.target.getAttribute('data-annotation-id')
            if (id) {
              if (entry.isIntersecting) {
                next.add(id)
              } else {
                next.delete(id)
              }
            }
          }
          return next
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    // Observe all annotation marks after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const marks = document.querySelectorAll('[data-annotation-id]')
      marks.forEach((mark) => observer.observe(mark))
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [annotations, enabled])

  return visibleIds
}

/**
 * Sidebar listing all annotations in the transcript
 * Supports navigation by clicking entries
 */
export function AnnotationSidebar({
  annotations,
  isOpen,
  onToggle,
  onAnnotationClick,
  visibleAnnotationIds = new Set(),
}: AnnotationSidebarProps) {
  // Sort annotations by start_paragraph_id (document position)
  const sortedAnnotations = [...annotations].sort(
    (a, b) => a.start_paragraph_id - b.start_paragraph_id
  )

  function handleAnnotationClick(annotation: AnnotationWithModule) {
    scrollToAnnotation(annotation.id)
    onAnnotationClick(annotation)
  }

  // Truncate text for display
  function truncateText(text: string, maxLength: number = 60): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="
          fixed right-4 top-24 z-40
          w-10 h-10 rounded-full
          bg-white dark:bg-zinc-900
          border border-gray-200 dark:border-zinc-700
          shadow-md
          flex items-center justify-center
          hover:bg-gray-50 dark:hover:bg-zinc-800
          transition-colors
        "
        aria-label={isOpen ? 'Close annotations sidebar' : 'Open annotations sidebar'}
        title={`${annotations.length} annotation${annotations.length !== 1 ? 's' : ''}`}
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
        {/* Badge showing annotation count */}
        {annotations.length > 0 && !isOpen && (
          <span className="
            absolute -top-1 -right-1
            min-w-5 h-5 px-1
            rounded-full bg-amber-500 text-white text-xs font-medium
            flex items-center justify-center
          ">
            {annotations.length}
          </span>
        )}
      </button>

      {/* Sidebar panel */}
      <div
        className={`
          fixed right-0 top-0 h-full w-80 z-30
          bg-white dark:bg-zinc-900
          border-l border-gray-200 dark:border-zinc-700
          shadow-xl
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="
          px-4 py-3 border-b border-gray-200 dark:border-zinc-700
          flex items-center justify-between
        ">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Annotations
          </h2>
          <span className="text-sm text-gray-500 dark:text-zinc-400">
            {annotations.length} total
          </span>
        </div>

        {/* Annotation list */}
        <div className="h-[calc(100%-56px)] overflow-y-auto">
          {sortedAnnotations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                No annotations yet
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-400 mt-1">
                Select text to create highlights
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {sortedAnnotations.map((annotation) => {
                const isVisible = visibleAnnotationIds.has(annotation.id)
                return (
                  <li key={annotation.id}>
                    <button
                      type="button"
                      onClick={() => handleAnnotationClick(annotation)}
                      className={`
                        w-full text-left px-4 py-3
                        hover:bg-gray-50 dark:hover:bg-zinc-800
                        transition-colors
                        border-l-4
                        ${isVisible
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/20'
                          : 'border-transparent'
                        }
                      `}
                    >
                      {/* Module badge */}
                      {annotation.module ? (
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: annotation.module.color }}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">
                            {annotation.module.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-300 dark:bg-zinc-600" />
                          <span className="text-xs font-medium text-gray-400 dark:text-zinc-400">
                            Untagged
                          </span>
                        </div>
                      )}

                      {/* Text snippet */}
                      <p className="text-sm text-gray-600 dark:text-zinc-400 leading-snug">
                        {truncateText(annotation.highlighted_text)}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Overlay when sidebar is open (optional, for focus) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/10"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  )
}
