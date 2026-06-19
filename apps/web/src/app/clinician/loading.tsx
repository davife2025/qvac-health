export default function ClinicianLoading() {
  return (
    <main className="min-h-full p-4 max-w-5xl mx-auto space-y-6 pb-16 animate-pulse">
      <div className="pt-2 space-y-2">
        <div className="h-8 w-56 rounded-xl bg-gray-200" />
        <div className="h-4 w-80 rounded-lg bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div key={i} className="h-8 w-24 rounded-lg bg-gray-100" />
            ))}
          </div>
          <div className="card space-y-4">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="h-10 w-48 rounded-xl bg-gray-100" />
            <div className="h-56 rounded-xl bg-gray-100" />
            <div className="h-10 w-40 rounded-xl bg-calm-200" />
          </div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card h-16 bg-gray-50" />
          ))}
        </div>
      </div>
    </main>
  );
}
