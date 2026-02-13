'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface BookingCalendarProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  disabledDates?: string[];
  minDate?: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function BookingCalendar({
  selectedDate,
  onDateSelect,
  disabledDates = [],
  minDate,
}: BookingCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates]);

  const minDateObj = useMemo(
    () => (minDate ? new Date(minDate + 'T00:00:00') : null),
    [minDate],
  );

  const selectedDateObj = useMemo(
    () => (selectedDate ? new Date(selectedDate + 'T00:00:00') : null),
    [selectedDate],
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDateDisabled = (day: number): boolean => {
    const date = new Date(viewYear, viewMonth, day);
    const dateStr = toDateString(date);

    if (disabledSet.has(dateStr)) return true;
    if (minDateObj && date < minDateObj) return true;

    return false;
  };

  const isToday = (day: number): boolean => {
    const date = new Date(viewYear, viewMonth, day);
    return isSameDay(date, today);
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDateObj) return false;
    const date = new Date(viewYear, viewMonth, day);
    return isSameDay(date, selectedDateObj);
  };

  const handleDayClick = (day: number) => {
    const dateStr = toDateString(new Date(viewYear, viewMonth, day));
    onDateSelect(dateStr);
  };

  return (
    <div className="w-full">
      {/* Header: Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>

      {/* Weekday labels */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day buttons */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const disabled = isDateDisabled(day);
          const selected = isSelected(day);
          const todayHighlight = isToday(day);

          return (
            <Button
              key={day}
              variant={selected ? 'default' : 'ghost'}
              size="icon"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={`h-9 w-full ${
                todayHighlight && !selected
                  ? 'ring-1 ring-primary ring-offset-1 ring-offset-background'
                  : ''
              } ${
                disabled ? 'text-muted-foreground/50 cursor-not-allowed' : ''
              }`}
              aria-label={`${new Date(viewYear, viewMonth, day).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}${todayHighlight ? ' (today)' : ''}${selected ? ' (selected)' : ''}`}
            >
              {day}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
