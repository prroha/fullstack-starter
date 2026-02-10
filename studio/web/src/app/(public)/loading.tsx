import { Container, Skeleton, SkeletonCard, SkeletonButton } from "@/components/ui";

export default function PublicLoading() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <Container>
          <div className="py-20 md:py-32 max-w-4xl mx-auto text-center relative">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <Skeleton className="h-6 w-48 rounded-full" />
            </div>
            {/* Title */}
            <Skeleton className="h-12 md:h-16 w-full max-w-xl mx-auto mb-4" />
            <Skeleton className="h-12 md:h-16 w-3/4 mx-auto mb-6" />
            {/* Description */}
            <div className="space-y-2 mb-8 max-w-2xl mx-auto">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5 mx-auto" />
            </div>
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SkeletonButton size="lg" />
              <SkeletonButton size="lg" />
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Skeleton */}
      <section className="border-b">
        <Container>
          <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-10 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features Grid Skeleton */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 max-w-full mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} showImage={false} textLines={2} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section Skeleton */}
      <section className="border-t bg-muted/30">
        <Container>
          <div className="py-20 text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-80 max-w-full mx-auto mb-8" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SkeletonButton size="lg" />
              <SkeletonButton size="lg" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
