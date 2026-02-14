"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import EventCard from "./event-card";
import type { Event } from "@/lib/events/types";

// =============================================================================
// Props
// =============================================================================

interface EventCalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

// =============================================================================
// Helpers
// =============================================================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// =============================================================================
// Component
// =============================================================================

export default function EventCalendarView({ events, onEventClick }: EventCalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((event) => {
      const start = new Date(event.startDate);
      const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const days = [];
  // Empty cells before the first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <div>
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          Previous
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          Next
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px border-b border-border">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day, idx) => {
          const key = day ? `${currentYear}-${currentMonth}-${day}` : `empty-${idx}`;
          const dayEvents = day ? eventsByDate[key] || [] : [];

          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-1",
                !day && "bg-muted/30"
              )}
            >
              {day && (
                <>
                  <div
                    className={cn(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(day)
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground"
                    )}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="cursor-pointer rounded bg-primary/10 px-1 py-0.5 text-xs text-primary truncate hover:bg-primary/20"
                        onClick={() => onEventClick?.(event)}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day events list (if any events this month) */}
      {events.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Events this month
          </h3>
          <div className="space-y-2">
            {events
              .filter((e) => {
                const d = new Date(e.startDate);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              })
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick?.(event)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
