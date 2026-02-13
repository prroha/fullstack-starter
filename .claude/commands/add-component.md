Add a new component: $ARGUMENTS

## Instructions

Before creating ANY new component:

### Step 1: Check if it already exists

Read the Component Registry in root CLAUDE.md. If a core component already does what you need, USE IT — don't create a new one.

### Step 2: Determine where it belongs

**Core component** (`core/web/src/components/`) — if it's generic and reusable across modules:

- Form elements, data display, overlays, feedback, layout
- Examples: a date range picker, a file uploader, a data table

**Domain component** (`modules/<name>/web/src/components/<name>/`) — if it's specific to one domain:

- Composes core components for domain-specific layouts
- Examples: ProductCard, OrderStatusBadge, CourseProgressBar

### Step 3: Follow the pattern

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
// Import core components — NEVER recreate them
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MyComponentProps {
  // ... domain-specific props
}

export default function MyComponent({ ... }: MyComponentProps) {
  return (
    // Use design system variables, not hardcoded colors
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Compose core components */}
      <Badge variant="success">Active</Badge>
      <Button size="sm">Action</Button>
    </div>
  );
}
```

### Rules

- Use `cn()` for conditional classes
- Use design system CSS variables (`bg-card`, `text-foreground`, `border-border`)
- Compose core UI components — never rebuild buttons, inputs, badges, etc.
- If you're building something generic, put it in `core/web/src/components/ui/` and add to barrel export
- If domain-specific, put it in `modules/<name>/web/src/components/<name>/`
