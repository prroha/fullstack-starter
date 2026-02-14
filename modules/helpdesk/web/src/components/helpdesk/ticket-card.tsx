import { Badge } from "@/components/ui/badge";
import TicketStatusBadge from "./ticket-status-badge";
import TicketPriorityBadge from "./ticket-priority-badge";
import { formatRelativeTime } from "@/lib/helpdesk/formatters";
import type { Ticket } from "@/lib/helpdesk/types";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 transition-colors ${onClick ? "cursor-pointer hover:bg-accent/50" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h3 className="mt-1 font-medium text-foreground truncate">{ticket.subject}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {ticket.category && <Badge variant="outline">{ticket.category.name}</Badge>}
        {ticket.assignedAgent && (
          <span>Assigned to {ticket.assignedAgent.name}</span>
        )}
        {ticket.slaBreached && (
          <Badge variant="destructive">SLA Breached</Badge>
        )}
        <span className="ml-auto">{formatRelativeTime(ticket.createdAt)}</span>
      </div>
    </div>
  );
}
