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
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-40">
      <p className="text-sm text-gray-700 mb-3">
        Continue where you left off?
        <span className="block text-xs text-gray-500 mt-1">
          You were {progress}% through this transcript
        </span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={onResume}
          className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Continue
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
