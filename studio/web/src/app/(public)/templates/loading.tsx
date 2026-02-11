import { Container, Skeleton, SkeletonCard } from "@/components/ui";

export default function TemplatesLoading() {
  return (
    <Container className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto" />
        <Skeleton className="h-5 w-3/4 max-w-xl mx-auto mt-2" />
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} showImage={false} textLines={3} />
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-5 w-64 mx-auto mb-6" />
        <Skeleton className="h-11 w-36 mx-auto rounded-md" />
      </div>
    </Container>
  );
}
