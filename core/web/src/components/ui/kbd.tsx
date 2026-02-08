import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

// =====================================================
// Main Component
// =====================================================

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono",
        className
      )}
    >
      {children}
    </kbd>
  );
}
