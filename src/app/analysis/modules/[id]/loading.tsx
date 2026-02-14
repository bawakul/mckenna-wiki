export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse dark:bg-zinc-700" />
          <div className="mt-4 h-8 w-64 bg-zinc-200 rounded animate-pulse dark:bg-zinc-700" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-zinc-200 rounded-lg animate-pulse dark:bg-zinc-700" />
          ))}
        </div>
      </div>
    </div>
  )
}
