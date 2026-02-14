"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/feedback/alert";
import { agentApi } from "@/lib/helpdesk/api";
import { AGENT_ROLE_OPTIONS } from "@/lib/helpdesk/constants";
import type { AgentCreateInput, AgentRole } from "@/lib/helpdesk/types";

// =============================================================================
// Page Component
// =============================================================================

export default function NewAgentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("AGENT");
  const [department, setDepartment] = useState("");
  const [maxOpenTickets, setMaxOpenTickets] = useState("25");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const data: AgentCreateInput = {
        name: name.trim(),
        email: email.trim(),
        role: role as AgentRole,
        department: department.trim() || undefined,
        maxOpenTickets: parseInt(maxOpenTickets, 10) || 25,
      };
      const agent = await agentApi.create(data);
      router.push(`/helpdesk/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Helpdesk", href: "/helpdesk" },
            { label: "Agents", href: "/helpdesk/agents" },
            { label: "New Agent" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">New Agent</h1>
        <p className="mt-1 text-muted-foreground">
          Add a new support team member
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          {error && (
            <Alert variant="destructive" onDismiss={() => setError(null)} className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Agent name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onChange={setRole}
                  options={AGENT_ROLE_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Technical Support"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxOpenTickets">Max Open Tickets</Label>
                <Input
                  id="maxOpenTickets"
                  type="number"
                  min="1"
                  value={maxOpenTickets}
                  onChange={(e) => setMaxOpenTickets(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" isLoading={isSaving}>
                Create Agent
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/helpdesk/agents")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
