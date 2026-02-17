import {
  Container,
  Skeleton,
  SkeletonButton,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui";

export default function PricingLoading() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <Container>
          <div className="py-10 md:py-16 max-w-3xl mx-auto text-center relative">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <Skeleton className="h-6 w-56 rounded-full" />
            </div>
            {/* Title */}
            <Skeleton className="h-12 md:h-14 w-full max-w-md mx-auto mb-4" />
            {/* Description */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5 mx-auto" />
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Cards Skeleton */}
      <section className="py-10 md:py-12">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} variant="outline" className="flex flex-col">
                {/* Header */}
                <div className="p-6 bg-muted/30">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <CardContent className="flex-1 pt-6">
                  {/* Price */}
                  <Skeleton className="h-10 w-20 mb-6" />
                  {/* Features */}
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6 px-6">
                  <SkeletonButton className="w-full" size="lg" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Feature Comparison Skeleton */}
      <section className="py-10 md:py-12 border-t bg-muted/30">
        <Container>
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-80 max-w-full mx-auto" />
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </Container>
      </section>
    </>
  );
}
