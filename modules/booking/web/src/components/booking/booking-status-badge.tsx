"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import type { BookingStatus } from "@/lib/booking/types";
import {
  getStatusLabel,
  getBookingStatusBadge,
} from "@/lib/booking/formatters";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export default function BookingStatusBadge({
  status,
}: BookingStatusBadgeProps) {
  return (
    <StatusBadge
      status={getBookingStatusBadge(status)}
      label={getStatusLabel(status)}
      showDot
    />
  );
}
