import { Skeleton } from "@/components/ui";

export default function ConfigureLoading() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Mobile Header Bar Skeleton */}
      <div className="lg:hidden flex items-center justify-between border-b p-3 bg-background sticky top-16 z-40">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-11 w-24" />
      </div>

      {/* Left: Category Sidebar Skeleton - Desktop Only */}
      <div className="hidden lg:block w-64 border-r bg-muted/30 p-4 space-y-2">
        {/* Sidebar Header */}
        <Skeleton className="h-6 w-32 mb-4" />
        {/* Category Items */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>

      {/* Middle: Feature List Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Template Picker (at top) */}
        <div className="p-4 md:p-6 border-b bg-muted/20">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between mt-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <Skeleton className="h-7 w-32 mb-4" />
            <div className="flex flex-col gap-3 sm:gap-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Skeleton className="h-10 w-full sm:w-40" />
                <Skeleton className="h-11 w-full sm:w-32" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Module Group */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    {/* Feature Header */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-5 w-28" />
                          <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                        <div className="flex gap-1 mt-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-5 w-14" />
                        <Skeleton className="h-6 w-10 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Cart Summary Skeleton - Desktop Only */}
      <div className="hidden lg:flex w-80 border-l bg-muted/30 p-4 flex-col space-y-6">
        {/* Tier Selector */}
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* Selection Summary */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-px w-full my-2" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* Pricing */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-16 mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-px w-full my-2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-px w-full my-2" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
