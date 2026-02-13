"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { providerApi, reviewApi } from "@/lib/booking/api";
import type { Provider, BookingReview } from "@/lib/booking/types";
import { formatPrice, formatDuration } from "@/lib/booking/formatters";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";

// =============================================================================
// Review List (inline for provider detail)
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
// Provider Profile Page
// =============================================================================

export default function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<BookingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchProvider = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await providerApi.getById(id);
      setProvider(data);

      // Fetch reviews for this provider
      try {
        const reviewResult = await reviewApi.listByProvider(data.id, 1, 50);
        setReviews(reviewResult.items);
      } catch {
        // Reviews are non-critical
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load provider",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

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

  if (error || !provider) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error || "Provider not found"}
          </p>
          <Button onClick={fetchProvider} className="mt-4" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const services = provider.services ?? [];
  const specialties = provider.specialties ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <a
              href="/providers"
              className="transition-colors hover:text-foreground"
            >
              Providers
            </a>
            <span>/</span>
            <span className="text-foreground">
              {provider.userName ?? "Provider"}
            </span>
          </nav>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <Avatar
              src={provider.avatarUrl}
              name={provider.userName ?? "Provider"}
              size="xl"
              alt={provider.userName ?? "Provider"}
            />

            <div className="flex-1 space-y-3">
              {/* Name */}
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {provider.userName ?? "Provider"}
              </h1>

              {/* Bio */}
              {provider.bio && (
                <p className="max-w-2xl text-lg text-muted-foreground">
                  {provider.bio}
                </p>
              )}

              {/* Specialties */}
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" size="sm">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Rating */}
              {provider.avgRating !== undefined && (
                <div className="flex items-center gap-1">
                  <Rating
                    value={provider.avgRating}
                    readOnly
                    allowHalf
                    size="sm"
                    showValue
                  />
                  {provider.reviewCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({provider.reviewCount} review
                      {provider.reviewCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:max-w-4xl">
          {/* Tabs */}
          <Tabs defaultIndex={0}>
            <TabList>
              <Tab>
                Services
                {services.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {services.length}
                  </span>
                )}
              </Tab>
              <Tab>
                Reviews
                {(provider.reviewCount ?? 0) > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {provider.reviewCount}
                  </span>
                )}
              </Tab>
            </TabList>

            <TabPanels>
              {/* Services Tab */}
              <TabPanel>
                {services.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No services available from this provider.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-foreground">
                            {service.name}
                          </h3>
                          {service.shortDescription && (
                            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                              {service.shortDescription}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-semibold text-foreground">
                              {formatPrice(service.price, service.currency)}
                            </span>
                            {service.duration > 0 && (
                              <span className="text-muted-foreground">
                                {formatDuration(service.duration)}
                              </span>
                            )}
                            {service.avgRating !== undefined &&
                              service.avgRating > 0 && (
                                <Rating
                                  value={service.avgRating}
                                  readOnly
                                  allowHalf
                                  size="sm"
                                  showValue
                                />
                              )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4 flex-shrink-0"
                          onClick={() =>
                            router.push(
                              `/book/${service.slug}?provider=${provider.id}`,
                            )
                          }
                        >
                          Book
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
                  averageRating={provider.avgRating ?? 0}
                  totalCount={provider.reviewCount ?? 0}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
