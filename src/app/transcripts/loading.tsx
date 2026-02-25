export default function TranscriptsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a2e]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 dark:bg-[#2d2d4a] rounded animate-pulse" />
          <div className="mt-2 h-5 w-64 bg-gray-100 dark:bg-[#252540] rounded animate-pulse" />
        </div>

        <div className="h-12 bg-gray-100 dark:bg-[#252540] rounded-lg animate-pulse" />

        <div className="mt-8 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 dark:bg-[#16213e] rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
