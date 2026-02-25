export default function TranscriptsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="mt-2 h-5 w-64 bg-gray-100 dark:bg-[#252540] rounded animate-pulse" />
        </div>

        <div className="h-12 bg-gray-100 dark:bg-[#252540] rounded-lg animate-pulse" />

        <div className="mt-8 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 dark:bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
