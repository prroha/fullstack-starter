export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          <div className="h-4 bg-muted rounded w-56 animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 bg-muted rounded w-28 animate-pulse" />
        ))}
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-lg border p-6 animate-pulse"
          >
            <div className="space-y-3">
              <div className="h-5 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
