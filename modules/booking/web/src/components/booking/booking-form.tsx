'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/feedback/alert';
import BookingCalendar from './booking-calendar';
import TimeSlotPicker from './time-slot-picker';
import type { BookingService, Provider, TimeSlot } from '@/lib/booking/types';
import { formatPrice, formatDuration, formatTime } from '@/lib/booking/formatters';

interface BookingFormProps {
  service: BookingService;
  provider: Provider;
  slots: TimeSlot[];
  slotsLoading: boolean;
  onDateChange: (date: string) => void;
  onSubmit: (data: { date: string; startTime: string; notes: string }) => Promise<void>;
}

const STEPS = ['Select Date', 'Select Time', 'Confirm & Book'] as const;

export default function BookingForm({
  service,
  provider,
  slots,
  slotsLoading,
  onDateChange,
  onSubmit,
}: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    onDateChange(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        date: selectedDate,
        startTime: selectedTime,
        notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext =
    (currentStep === 0 && selectedDate !== null) ||
    (currentStep === 1 && selectedTime !== null);

  return (
    <div className="space-y-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-center">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-1 text-xs ${
                  index <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 sm:w-16 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" title="Booking Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Select Date */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Choose a Date</h3>
                <p className="text-sm text-muted-foreground">
                  Select your preferred date for {service.name}
                </p>
              </div>
              <div className="mx-auto max-w-sm">
                <BookingCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  minDate={todayStr}
                />
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Choose a Time</h3>
                <p className="text-sm text-muted-foreground">
                  Available slots for{' '}
                  {selectedDate
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    : ''}
                </p>
              </div>
              <TimeSlotPicker
                slots={slots}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                isLoading={slotsLoading}
              />
            </div>
          )}

          {/* Step 3: Confirm & Book */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Confirm Your Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Review the details below and confirm
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium text-foreground">
                    {provider.userName ?? 'Provider'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">
                    {formatDuration(service.duration)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">
                    {selectedDate
                      ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium text-foreground">
                    {selectedTime ? formatTime(selectedTime) : ''}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(service.price, service.currency)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="booking-notes">Notes (optional)</Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Any special requests or notes for the provider..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canGoNext}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!selectedDate || !selectedTime}
            >
              Book Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
