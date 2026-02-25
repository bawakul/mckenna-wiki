'use client'

interface ResumePromptProps {
  paragraphIndex: number
  totalParagraphs: number
  onResume: () => void
  onDismiss: () => void
}

export function ResumePrompt({
  paragraphIndex,
  totalParagraphs,
  onResume,
  onDismiss,
}: ResumePromptProps) {
  const progress = Math.round((paragraphIndex / totalParagraphs) * 100)

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-4 max-w-sm z-40">
      <p className="text-sm text-gray-700 dark:text-zinc-300 mb-3">
        Continue where you left off?
        <span className="block text-xs text-gray-500 dark:text-zinc-400 mt-1">
          You were {progress}% through this transcript
        </span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={onResume}
          className="flex-1 rounded-lg bg-gray-900 dark:bg-zinc-700 px-3 py-2 text-sm font-medium text-white dark:text-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-600"
        >
          Continue
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-gray-200 dark:border-zinc-600 px-3 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
