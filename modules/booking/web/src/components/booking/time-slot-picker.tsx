'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { TimeSlot } from '@/lib/booking/types';
import { formatTime } from '@/lib/booking/formatters';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isLoading?: boolean;
}

export default function TimeSlotPicker({
  slots,
  selectedTime,
  onTimeSelect,
  isLoading = false,
}: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No available time slots for this date. Please select another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.time;
        return (
          <Button
            key={slot.time}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            disabled={!slot.available}
            onClick={() => onTimeSelect(slot.time)}
            className="w-full"
          >
            {formatTime(slot.time)}
          </Button>
        );
      })}
    </div>
  );
}
