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
    <div className="fixed bottom-4 right-4 bg-white dark:bg-[#16213e] rounded-lg shadow-lg border border-gray-200 dark:border-[#2d2d4a] p-4 max-w-sm z-40">
      <p className="text-sm text-gray-700 dark:text-[#c0c0d0] mb-3">
        Continue where you left off?
        <span className="block text-xs text-gray-500 dark:text-[#9090b0] mt-1">
          You were {progress}% through this transcript
        </span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={onResume}
          className="flex-1 rounded-lg bg-gray-900 dark:bg-[#2d2d4a] px-3 py-2 text-sm font-medium text-white dark:text-[#e8e8f0] hover:bg-gray-800 dark:hover:bg-[#3d3d5a]"
        >
          Continue
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-gray-200 dark:border-[#3d3d5a] px-3 py-2 text-sm text-gray-600 dark:text-[#9090b0] hover:bg-gray-50 dark:hover:bg-[#2d2d4a]"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
