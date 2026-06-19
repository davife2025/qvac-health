export default function JournalLoading() {
  return (
    <main className="min-h-full p-4 max-w-2xl mx-auto space-y-6 pb-16 animate-pulse">
      <div className="pt-2 space-y-2">
        <div className="h-8 w-40 rounded-xl bg-gray-200" />
        <div className="h-4 w-64 rounded-lg bg-gray-100" />
      </div>
      {/* Sparkline skeleton */}
      <div className="card h-24 bg-gray-50" />
      {/* Editor skeleton */}
      <div className="card space-y-4">
        <div className="h-5 w-24 rounded-lg bg-gray-200" />
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-1 h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-36 rounded-xl bg-gray-100" />
        <div className="h-10 w-36 rounded-xl bg-calm-200" />
      </div>
      {/* Entry skeletons */}
      {[1,2,3].map(i => (
        <div key={i} className="card space-y-3">
          <div className="h-4 w-32 rounded bg-gray-100" />
          <div className="h-4 w-20 rounded-full bg-gray-100" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
            <div className="h-3 w-3/5 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </main>
  );
}
