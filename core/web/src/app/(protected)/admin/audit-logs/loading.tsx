import { SkeletonAdminPage } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function AdminAuditLogsLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-48"
      descriptionWidth="w-64"
      headerActions={1}
      filterCount={0}
      tableRows={10}
      tableColumns={6}
      customContent={
        <>
          {/* Filters skeleton */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="w-40 h-10" />
              <Skeleton className="w-40 h-10" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="w-48 h-10" />
              <Skeleton className="w-48 h-10" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      }
    />
  );
}
