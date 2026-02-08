import { SkeletonProfile } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 w-24 bg-muted rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-9 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <SkeletonProfile />
      </main>
    </div>
  );
}
