"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import TicketForm from "@/components/helpdesk/ticket-form";
import { ticketApi } from "@/lib/helpdesk/api";
import type { TicketCreateInput } from "@/lib/helpdesk/types";

// =============================================================================
// Page Component
// =============================================================================

export default function NewTicketPage() {
  const router = useRouter();

  const handleSubmit = async (data: TicketCreateInput) => {
    const ticket = await ticketApi.create(data as TicketCreateInput);
    router.push(`/helpdesk/tickets/${ticket.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Helpdesk", href: "/helpdesk" },
            { label: "Tickets", href: "/helpdesk/tickets" },
            { label: "New Ticket" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          New Ticket
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create a new support ticket
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <TicketForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/helpdesk/tickets")}
          />
        </div>
      </div>
    </div>
  );
}
