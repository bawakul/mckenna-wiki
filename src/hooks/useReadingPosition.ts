'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface ReadingPosition {
  transcriptId: string
  paragraphIndex: number
  timestamp: number // When position was saved
}

interface UseReadingPositionOptions {
  transcriptId: string
  expirationDays?: number
}

interface UseReadingPositionReturn {
  savedPosition: ReadingPosition | null
  showResumePrompt: boolean
  dismissResumePrompt: () => void
  savePosition: (paragraphIndex: number) => void
  resumePosition: () => number | null
}

const POSITION_KEY_PREFIX = 'reading-position-'

/**
 * Debounce function for position saving
 */
function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

export function useReadingPosition({
  transcriptId,
  expirationDays = 7,
}: UseReadingPositionOptions): UseReadingPositionReturn {
  const [savedPosition, setSavedPosition] = useState<ReadingPosition | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const positionSavedRef = useRef(false)

  // Load saved position on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const key = `${POSITION_KEY_PREFIX}${transcriptId}`
      const saved = localStorage.getItem(key)

      if (!saved) return

      const position: ReadingPosition = JSON.parse(saved)
      const daysSinceSaved = (Date.now() - position.timestamp) / (1000 * 60 * 60 * 24)

      // Check if position is within expiration period
      if (daysSinceSaved < expirationDays && position.paragraphIndex > 0) {
        setSavedPosition(position)
        setShowResumePrompt(true)
      } else {
        // Clean up expired position
        localStorage.removeItem(key)
      }
    } catch {
      // Ignore localStorage errors (private browsing, etc.)
    }
  }, [transcriptId, expirationDays])

  // Debounced position save
  const debouncedSave = useMemo(
    () =>
      debounce((paragraphIndex: number) => {
        if (typeof window === 'undefined') return

        try {
          const position: ReadingPosition = {
            transcriptId,
            paragraphIndex,
            timestamp: Date.now(),
          }
          const key = `${POSITION_KEY_PREFIX}${transcriptId}`
          localStorage.setItem(key, JSON.stringify(position))
          positionSavedRef.current = true
        } catch {
          // Ignore localStorage errors
        }
      }, 1000),
    [transcriptId]
  )

  const savePosition = useCallback(
    (paragraphIndex: number) => {
      debouncedSave(paragraphIndex)
    },
    [debouncedSave]
  )

  const dismissResumePrompt = useCallback(() => {
    setShowResumePrompt(false)
  }, [])

  const resumePosition = useCallback(() => {
    if (savedPosition) {
      setShowResumePrompt(false)
      return savedPosition.paragraphIndex
    }
    return null
  }, [savedPosition])

  return {
    savedPosition,
    showResumePrompt,
    dismissResumePrompt,
    savePosition,
    resumePosition,
  }
}
