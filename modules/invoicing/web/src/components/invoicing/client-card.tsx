"use client";

import type { InvoicingClient } from "../../lib/invoicing/types";
import { formatPrice } from "../../lib/invoicing/formatters";
import { Badge } from "@/components/ui/badge";

interface ClientCardProps {
  client: InvoicingClient;
  onClick?: (client: InvoicingClient) => void;
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const handleClick = () => {
    onClick?.(client);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(client);
    }
  };

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 transition-shadow ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      }`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {client.name}
          </h3>
          {client.companyName && (
            <p className="text-sm text-muted-foreground truncate">
              {client.companyName}
            </p>
          )}
        </div>
        {client.invoiceCount !== undefined && client.invoiceCount > 0 && (
          <Badge variant="secondary" size="sm">
            {client.invoiceCount} invoice{client.invoiceCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Contact info */}
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        {client.email && <p className="truncate">{client.email}</p>}
        {client.phone && <p>{client.phone}</p>}
      </div>

      {/* Stats */}
      {client.totalBilled !== undefined && (
        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-sm">
          <div>
            <span className="text-muted-foreground">Billed: </span>
            <span className="font-medium text-foreground">
              {formatPrice(client.totalBilled)}
            </span>
          </div>
          {client.totalPaid !== undefined && (
            <div>
              <span className="text-muted-foreground">Paid: </span>
              <span className="font-medium text-success">
                {formatPrice(client.totalPaid)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
