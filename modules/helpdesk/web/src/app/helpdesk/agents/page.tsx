"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import AgentCard from "@/components/helpdesk/agent-card";
import { agentApi } from "@/lib/helpdesk/api";
import { AGENT_ROLE_OPTIONS } from "@/lib/helpdesk/constants";
import type { HelpdeskAgent, PaginatedResponse } from "@/lib/helpdesk/types";
import { Users } from "lucide-react";

const PAGE_SIZE = 12;

// =============================================================================
// Page Component
// =============================================================================

export default function AgentsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<HelpdeskAgent> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await agentApi.list({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // ---------------------------------------------------------------------------
  // Filter options
  // ---------------------------------------------------------------------------

  const roleOptions = [
    { value: "", label: "All Roles" },
    ...AGENT_ROLE_OPTIONS,
  ];

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <Alert variant="destructive">
            {error}
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={fetchAgents}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const agents = data?.items ?? [];
  const pagination = data?.pagination;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Agents
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your support team members
              </p>
            </div>
            <Button onClick={() => router.push("/helpdesk/agents/new")}>
              New Agent
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search agents by name or email..."
            debounceDelay={400}
            onSearch={handleSearch}
            className="flex-1"
          />
          <Select
            value={roleFilter}
            onChange={handleRoleChange}
            options={roleOptions}
          />
        </div>

        {/* Error banner (when data already loaded but refresh failed) */}
        {error && data && (
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading overlay for subsequent fetches */}
        {loading && data && (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        )}

        {/* Agent grid or empty state */}
        {!loading && agents.length === 0 ? (
          search || roleFilter ? (
            <EmptyState
              variant="noResults"
              title="No agents found"
              description="No agents match your current filters. Try adjusting your search or filters."
              action={{
                label: "Clear Filters",
                onClick: () => {
                  handleSearch("");
                  setRoleFilter("");
                },
                variant: "outline",
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No agents yet"
              description="Add your first support agent to start handling tickets"
              action={{
                label: "New Agent",
                onClick: () => router.push("/helpdesk/agents/new"),
              }}
            />
          )
        ) : (
          !loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => router.push(`/helpdesk/agents/${agent.id}`)}
                />
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            showItemCount
          />
        )}
      </div>
    </div>
  );
}
