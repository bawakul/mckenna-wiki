export default function TranscriptLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a2e]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header skeleton */}
        <div className="border-b border-gray-100 dark:border-[#2d2d4a] pb-8 mb-8">
          <div className="h-4 w-32 bg-gray-100 dark:bg-[#252540] rounded animate-pulse" />
          <div className="mt-4 h-9 w-3/4 bg-gray-200 dark:bg-[#2d2d4a] rounded animate-pulse" />
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-24 bg-gray-100 dark:bg-[#252540] rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 dark:bg-[#252540] rounded animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-[#e8e8f0]" />
            <span className="ml-3 text-gray-600 dark:text-[#9090b0]">Loading transcript...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
