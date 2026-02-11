import {
  Container,
  Skeleton,
  SkeletonButton,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui";

export default function CheckoutLoading() {
  return (
    <Container className="py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tier */}
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>

              <Skeleton className="h-px w-full" />

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* Total */}
              <div className="flex justify-between">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-16" />
              </div>

              <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <SkeletonButton className="w-full" size="lg" />
              <Skeleton className="h-3 w-40" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </Container>
  );
}
