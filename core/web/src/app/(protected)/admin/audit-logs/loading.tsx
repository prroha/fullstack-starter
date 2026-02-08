import { SkeletonTable } from "@/components/ui";

export default function AdminAuditLogsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-muted rounded animate-pulse" />
      </div>
      {/* Filters skeleton */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
          <div className="w-40 h-10 bg-muted rounded animate-pulse" />
          <div className="w-40 h-10 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="w-48 h-10 bg-muted rounded animate-pulse" />
          <div className="w-48 h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <SkeletonTable rows={10} columns={6} />
      </div>
    </div>
  );
}
