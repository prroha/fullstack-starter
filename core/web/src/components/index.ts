// =====================================================
// Component Library - Atomic Design Structure
// =====================================================
//
// This file provides a single entry point for all components.
// Components are organized following a pragmatic atomic design pattern:
//
// ui/       - Atoms (primitive UI components)
// forms/    - Molecules (form-related composed components)
// feedback/ - Molecules (feedback components like alerts, toasts)
// layout/   - Organisms (structural/layout components)
// shared/   - Cross-cutting concerns (error boundaries, SEO)
//
// Usage:
//   import { Button, Input } from "@/components/ui";
//   import { Form, FormField } from "@/components/forms";
//   import { Toaster, Alert } from "@/components/feedback";
//   import { Header, Footer } from "@/components/layout";
//   import { ErrorBoundary } from "@/components/shared";
//
// Or import everything from this file:
//   import { Button, Form, Toaster, Header, ErrorBoundary } from "@/components";
// =====================================================

// UI Components (Atoms)
export * from "./ui";

// Form Components (Molecules)
export * from "./forms";

// Feedback Components (Molecules)
export * from "./feedback";

// Layout Components (Organisms)
export * from "./layout";

// Shared Components (Cross-cutting)
export * from "./shared";

// Provider Components
export * from "./providers";

// Feature Flag Components
export * from "./feature-gate";
