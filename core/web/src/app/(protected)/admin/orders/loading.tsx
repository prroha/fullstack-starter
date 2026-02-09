import { SkeletonAdminPage } from "@/components/shared";
import { Skeleton, SkeletonTable } from "@/components/ui";

export default function AdminOrdersLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-32"
      descriptionWidth="w-48"
      headerActions={1}
      filterCount={0}
      showTable={false}
      customContent={
        <>
          {/* Stats cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Filters skeleton */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="w-40 h-10" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="w-32 h-10" />
              <Skeleton className="w-32 h-10" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <SkeletonTable rows={10} columns={6} />
          </div>
        </>
      }
    />
  );
}
