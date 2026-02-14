"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatRegistrationStatus, getRegistrationStatusBadge, formatDate } from "@/lib/events/formatters";
import type { EventRegistration } from "@/lib/events/types";

// =============================================================================
// Props
// =============================================================================

interface RegistrationListProps {
  registrations: EventRegistration[];
  onConfirm?: (id: string) => void;
  onCheckIn?: (id: string) => void;
  onCancel?: (id: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export default function RegistrationList({ registrations, onConfirm, onCheckIn, onCancel }: RegistrationListProps) {
  if (registrations.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground">
        No registrations yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Registration #</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Registered</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((reg) => (
          <TableRow key={reg.id}>
            <TableCell className="font-medium">{reg.attendeeName}</TableCell>
            <TableCell className="text-muted-foreground">{reg.attendeeEmail}</TableCell>
            <TableCell className="text-muted-foreground font-mono text-xs">
              {reg.registrationNumber}
            </TableCell>
            <TableCell>
              <StatusBadge
                status={getRegistrationStatusBadge(reg.status)}
                label={formatRegistrationStatus(reg.status)}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(reg.createdAt)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {reg.status === "PENDING" && onConfirm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConfirm(reg.id)}
                  >
                    Confirm
                  </Button>
                )}
                {(reg.status === "CONFIRMED" || reg.status === "PENDING") && onCheckIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCheckIn(reg.id)}
                  >
                    Check In
                  </Button>
                )}
                {reg.status !== "CANCELLED" && reg.status !== "ATTENDED" && onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(reg.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
