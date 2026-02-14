"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { registrationApi } from "@/lib/events/api";
import {
  formatRegistrationStatus,
  getRegistrationStatusBadge,
  formatDate,
} from "@/lib/events/formatters";
import { REGISTRATION_STATUS_OPTIONS } from "@/lib/events/constants";
import type { EventRegistration, RegistrationStatus } from "@/lib/events/types";

const PAGE_SIZE = 20;

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await registrationApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setRegistrations(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleConfirm = async (id: string) => {
    try {
      await registrationApi.confirm(id);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm registration");
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await registrationApi.checkIn(id);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in");
    }
  };

  const handleCancelReg = async (id: string) => {
    try {
      await registrationApi.cancel(id);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel registration");
    }
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...REGISTRATION_STATUS_OPTIONS,
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Registrations
          </h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all event registrations
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Search registrations..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={statusOptions}
            />
          </div>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mb-6"
            onDismiss={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : registrations.length === 0 ? (
          <EmptyState
            title="No registrations found"
            description={
              search || statusFilter
                ? "Try adjusting your search or filters."
                : "No registrations have been made yet."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registration #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.attendeeName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {reg.attendeeEmail}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {reg.registrationNumber}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={getRegistrationStatusBadge(reg.status as RegistrationStatus)}
                      label={formatRegistrationStatus(reg.status as RegistrationStatus)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(reg.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {reg.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfirm(reg.id)}
                        >
                          Confirm
                        </Button>
                      )}
                      {(reg.status === "CONFIRMED" || reg.status === "PENDING") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckIn(reg.id)}
                        >
                          Check In
                        </Button>
                      )}
                      {reg.status !== "CANCELLED" && reg.status !== "ATTENDED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelReg(reg.id)}
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
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              showItemCount
            />
          </div>
        )}
      </div>
    </div>
  );
}
