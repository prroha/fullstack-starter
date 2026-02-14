import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatAgentRole } from "@/lib/helpdesk/formatters";
import type { HelpdeskAgent } from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface AgentCardProps {
  agent: HelpdeskAgent;
  onClick?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 transition-colors ${
        onClick ? "cursor-pointer hover:bg-accent/50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{agent.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{agent.email}</p>
        </div>
        <StatusBadge
          status={agent.isActive ? "active" : "inactive"}
          label={agent.isActive ? "Active" : "Inactive"}
          showDot
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Badge variant="outline">{formatAgentRole(agent.role)}</Badge>
        {agent.department && (
          <Badge variant="outline">{agent.department}</Badge>
        )}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        <span>Max tickets: {agent.maxOpenTickets}</span>
        {agent.specialties.length > 0 && (
          <span className="ml-3">{agent.specialties.length} specialt{agent.specialties.length !== 1 ? "ies" : "y"}</span>
        )}
      </div>
    </div>
  );
}
