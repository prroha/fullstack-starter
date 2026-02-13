Add a new page: $ARGUMENTS

## Instructions

You are adding a new page to this codebase. Before writing ANY code:

1. Read the root CLAUDE.md — Component Registry and MANDATORY RULES
2. Identify which core components this page needs
3. Check if a domain API client exists (`lib/<module>/api.ts`) or needs updating

## Page Template

Every page MUST follow this pattern:

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";

// STEP 1: Core UI — import from @/components/ui/*, @/components/feedback/*, etc.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ... (see Component Registry in CLAUDE.md for full list)

// STEP 2: Domain imports — from the module's own lib
import { moduleApi } from "@/lib/<module>/api";
import type { DomainType } from "@/lib/<module>/types";

// STEP 3: Domain components — that compose core UI
import DomainComponent from "@/components/<module>/domain-component";
```

## Rules

- NEVER write raw HTML elements when a core component exists (see CLAUDE.md Rule 1)
- Use `LoadingWrapper` or conditional rendering with `Spinner` for loading states
- Use `Alert` for error banners, not custom divs
- Use `EmptyState` for empty states, not custom divs
- Use `Pagination` for pagination, never custom prev/next buttons
- Use `SearchInput` with `debounceDelay` for search, never manual debounce
- Use design system CSS variables (`text-foreground`, `bg-card`, `border-border`)
- Every data-fetching page needs: loading state, error state, empty state
