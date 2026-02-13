"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { serviceApi, reviewApi } from "@/lib/booking/api";
import type { BookingService, BookingReview } from "@/lib/booking/types";
import { formatPrice, formatDuration } from "@/lib/booking/formatters";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";

// =============================================================================
// Review List (inline for service detail)
// =============================================================================

function ReviewList({
  reviews,
  averageRating,
  totalCount,
}: {
  reviews: BookingReview[];
  averageRating: number;
  totalCount: number;
}) {
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getUserInitials(name?: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="w-full">
      {/* Average rating summary */}
      <div className="mb-6 rounded-xl border border-border bg-muted/50 p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-bold text-foreground">
              {averageRating.toFixed(1)}
            </p>
            <div className="mt-1">
              <Rating value={averageRating} readOnly allowHalf size="md" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Be the first to leave a review!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
                    {getUserInitials(review.userName)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {review.userName || "Anonymous"}
                    </p>
                    <time className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                  <div className="mt-1">
                    <Rating value={review.rating} readOnly allowHalf size="sm" />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Service Detail Page
// =============================================================================

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [service, setService] = useState<BookingService | null>(null);
  const [reviews, setReviews] = useState<BookingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceApi.getBySlug(slug);
      setService(data);

      // Fetch reviews for this service
      try {
        const reviewResult = await reviewApi.listByService(data.id, 1, 50);
        setReviews(reviewResult.items);
      } catch {
        // Reviews are non-critical
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load service");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error || !service) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error || "Service not found"}
          </p>
          <Button onClick={fetchService} className="mt-4" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const providers = service.providers ?? [];
  const categoryNames = (service.categories ?? []).map((c) => c.name);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <a
              href="/services"
              className="transition-colors hover:text-foreground"
            >
              Services
            </a>
            <span>/</span>
            <span className="text-foreground">{service.name}</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {service.name}
          </h1>

          {service.shortDescription && (
            <p className="mt-2 text-lg text-muted-foreground">
              {service.shortDescription}
            </p>
          )}

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {service.isFeatured && (
              <Badge variant="default" size="sm">
                Featured
              </Badge>
            )}
            {service.price === 0 && (
              <Badge variant="success" size="sm">
                Free
              </Badge>
            )}
            {service.duration > 0 && (
              <Badge variant="secondary" size="sm">
                {formatDuration(service.duration)}
              </Badge>
            )}
            {categoryNames.map((name) => (
              <Badge key={name} variant="outline" size="sm">
                {name}
              </Badge>
            ))}
          </div>

          {/* Rating */}
          {service.avgRating !== undefined && (
            <div className="mt-4 flex items-center gap-1">
              <Rating
                value={service.avgRating}
                readOnly
                allowHalf
                size="sm"
                showValue
              />
              {service.reviewCount !== undefined && (
                <span className="text-sm text-muted-foreground">
                  ({service.reviewCount} review
                  {service.reviewCount !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(service.price, service.currency)}
            </span>
            {service.compareAtPrice != null &&
              service.compareAtPrice > service.price && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(service.compareAtPrice, service.currency)}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2">
            {/* Full Description */}
            <div className="mb-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                About This Service
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap">{service.description}</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultIndex={0}>
              <TabList>
                <Tab>
                  Providers
                  {providers.length > 0 && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {providers.length}
                    </span>
                  )}
                </Tab>
                <Tab>
                  Reviews
                  {(service.reviewCount ?? 0) > 0 && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {service.reviewCount}
                    </span>
                  )}
                </Tab>
              </TabList>

              <TabPanels>
                {/* Providers Tab */}
                <TabPanel>
                  {providers.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No providers available for this service.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {providers.map((provider) => (
                        <div
                          key={provider.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar
                              src={provider.avatarUrl}
                              name={provider.userName ?? "Provider"}
                              size="md"
                              alt={provider.userName ?? "Provider"}
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {provider.userName ?? "Provider"}
                              </p>
                              {provider.avgRating !== undefined && (
                                <div className="mt-1">
                                  <Rating
                                    value={provider.avgRating}
                                    readOnly
                                    allowHalf
                                    size="sm"
                                    showValue
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/book/${service.slug}?provider=${provider.id}`,
                              )
                            }
                          >
                            Book Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabPanel>

                {/* Reviews Tab */}
                <TabPanel>
                  <ReviewList
                    reviews={reviews}
                    averageRating={service.avgRating ?? 0}
                    totalCount={service.reviewCount ?? 0}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>

          {/* Sidebar (1/3) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="space-y-4 p-6">
                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(service.price, service.currency)}
                  </span>
                  {service.compareAtPrice != null &&
                    service.compareAtPrice > service.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(service.compareAtPrice, service.currency)}
                      </span>
                    )}
                </div>

                {/* Duration */}
                {service.duration > 0 && (
                  <div className="flex items-center justify-between border-b border-border pb-4 text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-foreground">
                      {formatDuration(service.duration)}
                    </span>
                  </div>
                )}

                {/* Book Now Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => router.push(`/book/${service.slug}`)}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
