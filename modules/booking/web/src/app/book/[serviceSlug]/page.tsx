"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { serviceApi, providerApi, bookingApi } from "@/lib/booking/api";
import type {
  BookingService,
  Provider,
  TimeSlot,
  Booking,
} from "@/lib/booking/types";
import {
  formatPrice,
  formatDuration,
  formatDate,
  formatTime,
} from "@/lib/booking/formatters";
import ProviderCard from "@/components/booking/provider-card";
import BookingCalendar from "@/components/booking/booking-calendar";
import TimeSlotPicker from "@/components/booking/time-slot-picker";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// =============================================================================
// Multi-Step Booking Flow
// =============================================================================

type BookingStep = "provider" | "datetime" | "confirm" | "success";

export default function BookServicePage({
  params,
}: {
  params: Promise<{ serviceSlug: string }>;
}) {
  const { serviceSlug } = use(params);
  const searchParams = useSearchParams();
  const preselectedProviderId = searchParams.get("provider");

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [service, setService] = useState<BookingService | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<BookingStep>("provider");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching: Service + Providers
  // ---------------------------------------------------------------------------

  const fetchServiceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const serviceData = await serviceApi.getBySlug(serviceSlug);
      setService(serviceData);

      const providerData = await providerApi.list({
        serviceId: serviceData.id,
        limit: 50,
      });
      setProviders(providerData.items);

      // If a provider query param is set, pre-select that provider
      if (preselectedProviderId) {
        const matched = providerData.items.find(
          (p) => p.id === preselectedProviderId
        );
        if (matched) {
          setSelectedProvider(matched);
          setStep("datetime");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load service details"
      );
    } finally {
      setLoading(false);
    }
  }, [serviceSlug, preselectedProviderId]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  // ---------------------------------------------------------------------------
  // Fetch Slots When Date Changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedProvider || !service || !selectedDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    async function fetchSlots() {
      setSlotsLoading(true);
      setSelectedTime(null);
      try {
        const data = await providerApi.getAvailability(
          selectedProvider!.id,
          service!.id,
          selectedDate!
        );
        if (!cancelled) {
          setSlots(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
        }
      } finally {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      }
    }

    fetchSlots();

    return () => {
      cancelled = true;
    };
  }, [selectedProvider, service, selectedDate]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setStep("datetime");
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleProceedToConfirm = () => {
    if (selectedDate && selectedTime) {
      setStep("confirm");
    }
  };

  const handleSubmitBooking = async () => {
    if (!service || !selectedProvider || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const booking = await bookingApi.create({
        serviceId: service.id,
        providerId: selectedProvider.id,
        date: selectedDate,
        startTime: selectedTime,
        notes: notes.trim() || undefined,
      });
      setCreatedBooking(booking);
      setStep("success");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create booking"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("datetime");
    } else if (step === "datetime") {
      setSelectedProvider(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setSlots([]);
      setStep("provider");
    }
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error || !service) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Alert variant="destructive" title="Error">
          <p className="mt-1">{error || "Service not found"}</p>
          <Button
            variant="outline"
            onClick={fetchServiceData}
            className="mt-3"
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/services"
          className="transition-colors hover:text-foreground"
        >
          Services
        </Link>
        <span>/</span>
        <Link
          href={`/services/${service.slug}`}
          className="transition-colors hover:text-foreground"
        >
          {service.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Book</span>
      </nav>

      {/* Service Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Book: {service.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {service.duration > 0 && <span>{formatDuration(service.duration)}</span>}
          <span>{formatPrice(service.price, service.currency)}</span>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        <span
          className={
            step === "provider"
              ? "font-semibold text-primary"
              : "text-muted-foreground"
          }
        >
          1. Provider
        </span>
        <span className="text-muted-foreground">&rarr;</span>
        <span
          className={
            step === "datetime"
              ? "font-semibold text-primary"
              : "text-muted-foreground"
          }
        >
          2. Date & Time
        </span>
        <span className="text-muted-foreground">&rarr;</span>
        <span
          className={
            step === "confirm" || step === "success"
              ? "font-semibold text-primary"
              : "text-muted-foreground"
          }
        >
          3. Confirm
        </span>
      </div>

      {/* ================================================================= */}
      {/* Step: Provider Selection                                          */}
      {/* ================================================================= */}

      {step === "provider" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            Select a Provider
          </h2>

          {providers.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No providers are currently available for this service.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/services">Browse Other Services</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <div key={provider.id} className="flex flex-col">
                  <ProviderCard provider={provider} />
                  <Button
                    className="mt-3"
                    onClick={() => handleSelectProvider(provider)}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* Step: Date & Time Selection                                       */}
      {/* ================================================================= */}

      {step === "datetime" && selectedProvider && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Choose Date & Time
            </h2>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              &larr; Change Provider
            </Button>
          </div>

          {/* Selected provider info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Provider</p>
            <p className="font-medium text-foreground">
              {selectedProvider.userName ?? "Provider"}
            </p>
          </div>

          {/* Calendar + Slots */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Calendar */}
            <div className="rounded-lg border border-border bg-card p-4">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                minDate={todayStr}
              />
            </div>

            {/* Time Slots */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-medium text-foreground">
                {selectedDate
                  ? `Available times for ${formatDate(selectedDate)}`
                  : "Select a date to see available times"}
              </h3>
              {selectedDate ? (
                <TimeSlotPicker
                  slots={slots}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                  isLoading={slotsLoading}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Please select a date from the calendar.
                </p>
              )}
            </div>
          </div>

          {/* Proceed button */}
          <div className="flex justify-end">
            <Button
              onClick={handleProceedToConfirm}
              disabled={!selectedDate || !selectedTime}
            >
              Continue to Confirm
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Step: Confirmation                                                */}
      {/* ================================================================= */}

      {step === "confirm" && selectedProvider && selectedDate && selectedTime && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Confirm Your Booking
            </h2>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              &larr; Change Time
            </Button>
          </div>

          {submitError && (
            <Alert
              variant="destructive"
              title="Booking Failed"
              onDismiss={() => setSubmitError(null)}
            >
              {submitError}
            </Alert>
          )}

          {/* Booking Summary */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Booking Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">
                  {service.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium text-foreground">
                  {selectedProvider.userName ?? "Provider"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">
                  {formatDate(selectedDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">
                  {formatTime(selectedTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">
                  {formatDuration(service.duration)}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(service.price, service.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="booking-notes">Notes (optional)</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes for the provider..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleBack} disabled={submitting}>
              Back
            </Button>
            <Button onClick={handleSubmitBooking} isLoading={submitting}>
              Confirm Booking
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Step: Success                                                     */}
      {/* ================================================================= */}

      {step === "success" && createdBooking && (
        <div className="space-y-6">
          <Alert variant="success" title="Booking Confirmed!">
            Your booking has been created successfully. Your booking number is{" "}
            <strong>{createdBooking.bookingNumber}</strong>.
          </Alert>

          <div className="rounded-lg border border-border bg-card p-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Booking Number</span>
              <span className="font-medium text-foreground">
                {createdBooking.bookingNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">
                {formatDate(createdBooking.date)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-foreground">
                {formatTime(createdBooking.startTime)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <Link href="/dashboard/my-bookings">View My Bookings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
