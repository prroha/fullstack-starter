import { Skeleton } from "@/components/ui";

export default function ConfigureLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Category Sidebar Skeleton */}
      <div className="w-64 border-r bg-muted/20 p-4 space-y-2 hidden md:block">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Template Picker (at top) */}
        <div className="p-6 border-b bg-muted/20">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 p-4 border rounded-lg space-y-2"
              >
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                {/* Feature Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
                {/* Feature Description */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                {/* Feature Footer */}
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart Summary Skeleton */}
      <div className="w-80 border-l bg-background p-6 space-y-6 hidden lg:block">
        {/* Cart Header */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Selected Items */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex justify-between pt-2 border-t">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
