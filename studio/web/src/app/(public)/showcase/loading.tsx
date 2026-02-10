import { Container, Grid, Skeleton, SkeletonCard } from "@/components/ui";

export default function ShowcaseLoading() {
  return (
    <Container className="py-12">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Search & Filter */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <Skeleton className="h-10 flex-1 max-w-md" />
          {/* Tier Select */}
          <Skeleton className="h-10 w-32" />
          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-24 rounded-md flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Popular Components Section */}
      <div className="mb-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              {/* Component Preview Area */}
              <Skeleton className="h-32 w-full rounded-md" />
              {/* Component Name */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              {/* Tags */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </Grid>
      </div>

      {/* All Components Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36" />
        </div>
        <Grid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              {/* Component Preview Area */}
              <Skeleton className="h-32 w-full rounded-md" />
              {/* Component Name */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              {/* Tags */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </Grid>
      </div>
    </Container>
  );
}
