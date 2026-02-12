export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-36 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded w-28 animate-pulse" />
          <div className="h-10 bg-muted rounded w-28 animate-pulse" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-lg border p-4 animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-20" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-40 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
        <div className="bg-background rounded-lg border p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-40 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
