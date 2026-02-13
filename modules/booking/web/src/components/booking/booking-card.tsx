'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import type { Booking } from '@/lib/booking/types';
import { formatDate, formatTimeRange, formatPrice } from '@/lib/booking/formatters';
import BookingStatusBadge from './booking-status-badge';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  showActions?: boolean;
}

export default function BookingCard({
  booking,
  onCancel,
  onReschedule,
  showActions = false,
}: BookingCardProps) {
  const canAct =
    showActions && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header: Booking number + Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {booking.bookingNumber}
          </span>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Service & Provider */}
        <div className="space-y-1">
          {booking.service && (
            <p className="text-sm font-medium text-foreground">
              {booking.service.name}
            </p>
          )}
          {booking.provider?.userName && (
            <p className="text-xs text-muted-foreground">
              with {booking.provider.userName}
            </p>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(booking.date)}</span>
          <span className="text-muted-foreground/50">|</span>
          <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
        </div>

        {/* Price */}
        <div className="text-sm font-bold text-foreground">
          {formatPrice(booking.totalAmount, booking.currency)}
        </div>

        {/* Notes */}
        {booking.notes && (
          <p className="text-xs text-muted-foreground italic">
            {booking.notes}
          </p>
        )}

        {/* Actions */}
        {canAct && (
          <div className="flex items-center gap-2 pt-1">
            {onReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReschedule(booking.id)}
              >
                Reschedule
              </Button>
            )}
            {onCancel && (
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Cancel Booking"
                confirmMessage={`Are you sure you want to cancel booking ${booking.bookingNumber}? This action cannot be undone.`}
                variant="destructive"
                size="sm"
                onConfirm={() => onCancel(booking.id)}
              >
                Cancel
              </ConfirmButton>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
