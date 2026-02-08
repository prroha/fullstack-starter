import { SkeletonTable } from "@/components/ui";

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
          <div className="w-40 h-10 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="w-32 h-10 bg-muted rounded animate-pulse" />
          <div className="w-32 h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <SkeletonTable rows={10} columns={6} />
      </div>
    </div>
  );
}
