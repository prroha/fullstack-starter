# CLAUDE.md - Fullstack Starter Web

> **Last Updated**: 2026-02-08
> **Codebase Version**: 1.0.0
> **Maintainer**: AI-assisted documentation (auto-update on changes)

AI-optimized documentation for quick codebase navigation and understanding.

---

## Quick Search Keywords

Use these to quickly find what you need:
- **Authentication**: `auth-context.tsx`, `useAuth`, `api.login`
- **API Client**: `lib/api.ts`, `ApiClient`, `ApiError`
- **Styling**: `globals.css`, `tailwind`, `cn()`, `utils.ts`
- **Layout**: `layout.tsx`, `AuthProvider`
- **Pages**: `app/page.tsx`, `app/*/page.tsx`
- **UI Components**: `components/ui/index.ts`, `Button`, `Input`, `Dialog`, `Tabs`

---

## Recent Changes

<!-- Add new entries at the top -->
| Date | Change | Files |
|------|--------|-------|
| 2026-02-08 | Added comprehensive UI components documentation | CLAUDE.md |
| 2026-02-06 | Initial documentation | CLAUDE.md |

---

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react
- **Auth**: Custom context with httpOnly cookies

### Design Patterns
- **App Router**: File-based routing with layouts
- **Client Components**: `"use client"` directive for interactive pages
- **Context Providers**: Auth context wraps the app
- **API Client**: Singleton pattern with cookie-based auth

### Path Aliases
```typescript
// tsconfig.json
"@/*": ["./src/*"]

// Usage examples
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
```

---

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (AuthProvider, fonts)
│   ├── globals.css         # Tailwind + global styles
│   ├── page.tsx            # Homepage
│   ├── login/              # Login page (create as needed)
│   └── register/           # Register page (create as needed)
│
├── components/
│   └── ui/                 # Custom UI component library (see UI Components section)
│
└── lib/
    ├── api.ts              # API client + types
    ├── auth-context.tsx    # Auth context provider
    └── utils.ts            # cn() utility for class merging
```

---

## Key Files Index

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, metadata, fonts, AuthProvider |
| `src/app/page.tsx` | Homepage with auth state display |
| `src/lib/api.ts` | API client, types, error handling |
| `src/lib/auth-context.tsx` | Auth state, login/logout functions |
| `src/lib/utils.ts` | `cn()` utility for Tailwind class merging |
| `src/app/globals.css` | Global CSS, Tailwind imports, CSS variables |
| `src/components/ui/index.ts` | UI component library barrel export |

---

## State Management

### Auth Context (`src/lib/auth-context.tsx`)
```typescript
const {
  user,           // User | null
  isLoading,      // boolean - true during initial auth check
  isAuthenticated,// boolean - true if user is logged in
  isAdmin,        // boolean - true if user role is ADMIN
  userRole,       // "USER" | "ADMIN" | null
  login,          // (email, password) => Promise<User>
  logout,         // () => Promise<void>
  refreshAuth,    // () => Promise<void>
} = useAuth();
```

### Usage Example
```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <p>Welcome, {user?.name || user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## API Integration

### API Client (`src/lib/api.ts`)
```typescript
// Base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Singleton instance
export const api = new ApiClient();
```

### Authentication Flow
1. Login sets httpOnly cookies (access + refresh tokens)
2. All requests include `credentials: "include"`
3. Cookies are automatically sent with requests
4. Token refresh handled via `/auth/refresh` endpoint

### Key API Methods
```typescript
// Auth
api.login(email, password)       // Returns user + tokens
api.register(email, password, name?) // Returns user
api.logout()                     // Clears cookies
api.getMe()                      // Returns current user
api.refresh()                    // Refresh tokens
```

### API Response Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Error handling
class ApiError extends Error {
  status: number;
  code?: string;
}
```

### Adding New API Methods
```typescript
// In ApiClient class (src/lib/api.ts)
async getPosts(page = 1, limit = 10) {
  return this.request<PaginatedResponse<Post>>(`/v1/posts?page=${page}&limit=${limit}`);
}

async createPost(data: CreatePostInput) {
  return this.request<{ post: Post }>("/v1/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

---

## Routing

### Current Routes
| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Homepage | No |
| `/login` | Login (create) | No |
| `/register` | Register (create) | No |

### Adding Protected Routes
```tsx
"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/protected-page");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

---

## Styling

### Tailwind CSS v4
Tailwind is configured via `postcss.config.mjs` and imports in `globals.css`.

### cn() Utility
```typescript
import { cn } from "@/lib/utils";

// Merge classes conditionally
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" ? "primary-classes" : "secondary-classes"
)}>
```

### Common Patterns
```tsx
// Container
<div className="container mx-auto px-4">

// Flex layouts
<div className="flex items-center justify-between gap-4">
<div className="flex flex-col gap-2">

// Grid layouts
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

// Typography
<h1 className="text-3xl font-bold">
<p className="text-gray-600">

// Buttons
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
<button className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50">
```

---

## UI Components Library

> **Note**: This is a **custom component library** built specifically for this project. It is **NOT shadcn/ui** - all components are implemented from scratch with full control over styling and behavior. The design system uses **CSS variables with Tailwind CSS** for theming.

### Import Pattern
```typescript
// Import from the barrel file
import { Button, Input, Dialog, Tabs } from "@/components/ui";

// Or import individual components
import { Button } from "@/components/ui/button";
```

### Form Components

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `button.tsx` | Versatile button with variants (default, destructive, outline, secondary, ghost, link), sizes (sm, md, lg, icon), and loading state |
| `Input` | `input.tsx` | Text input with focus ring, disabled state, and error styling via `aria-invalid` |
| `Textarea` | `textarea.tsx` | Multi-line text input with auto-resize support and consistent styling |
| `Checkbox` | `checkbox.tsx` | Checkbox with label support, indeterminate state, and size variants (sm, md, lg) |
| `Radio` / `RadioGroup` | `radio.tsx` | Radio button and group with keyboard navigation, horizontal/vertical orientation |
| `Select` | `select.tsx` | Dropdown select with options, placeholder, label, error message, and size variants |
| `Switch` | `switch.tsx` | Toggle switch with label support, size variants, and configurable label position |

### Display Components

| Component | File | Description |
|-----------|------|-------------|
| `Badge` | `badge.tsx` | Status indicator with variants (default, secondary, destructive, outline, success, warning) and sizes |
| `Spinner` / `SpinnerOverlay` | `spinner.tsx` | Loading spinner in three sizes; overlay version for full-page loading states |
| `Skeleton` | `skeleton.tsx` | Loading placeholder with pulse/shimmer animations and many variants (see below) |

### Skeleton Variants

The skeleton system includes specialized components for common UI patterns:

| Component | Description |
|-----------|-------------|
| `Skeleton` | Base skeleton with pulse or shimmer animation |
| `SkeletonText` | Multi-line text placeholder with configurable line count |
| `SkeletonCircle` | Circle placeholder for avatars |
| `SkeletonAvatar` | Avatar with optional text placeholders |
| `SkeletonButton` | Button placeholder in various sizes |
| `SkeletonImage` | Image placeholder with aspect ratio support (square, video, portrait, wide) |
| `SkeletonCard` | Card layout skeleton (default, horizontal, compact variants) |
| `SkeletonTable` | Table skeleton with configurable rows/columns |
| `SkeletonList` | List skeleton (default, simple, detailed variants) |
| `SkeletonPage` | Full page loading skeleton |
| `SkeletonDashboard` | Dashboard layout skeleton with nav, sidebar, stats, and charts |
| `SkeletonForm` | Form layout skeleton |
| `SkeletonProfile` | Profile page skeleton |
| `SkeletonAuth` | Authentication page skeleton |

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `Dialog` | `dialog.tsx` | Modal dialog with focus trap, escape to close, and size variants (sm, md, lg, xl, full) |
| `DialogHeader` | `dialog.tsx` | Dialog header with optional close button |
| `DialogBody` | `dialog.tsx` | Scrollable dialog content area |
| `DialogFooter` | `dialog.tsx` | Dialog footer for action buttons |
| `Tabs` | `tabs.tsx` | Tab container with controlled/uncontrolled modes |
| `TabList` / `Tab` | `tabs.tsx` | Tab navigation with keyboard support and variants (line, enclosed, soft-rounded) |
| `TabPanels` / `TabPanel` | `tabs.tsx` | Tab content panels with auto-indexing |
| `Accordion` | `accordion.tsx` | Expandable sections with single/multiple mode support |
| `AccordionItem` | `accordion.tsx` | Individual accordion section |
| `AccordionTrigger` | `accordion.tsx` | Clickable accordion header |
| `AccordionContent` | `accordion.tsx` | Animated accordion content |

### Utility Components

| Component | File | Description |
|-----------|------|-------------|
| `ThemeToggle` | `theme-toggle.tsx` | Dark/light mode toggle with variants (icon, button, dropdown) |
| `ExportButton` | `export-button.tsx` | File download button with format selection and loading state |
| `ExportCsvButton` | `export-button.tsx` | Simplified CSV export button |
| `ExportMyDataButton` | `export-button.tsx` | User data export button for GDPR compliance |

### Usage Examples

#### Button with Loading State
```tsx
import { Button } from "@/components/ui";

<Button variant="default" isLoading={isSubmitting}>
  Submit
</Button>
```

#### Dialog Modal
```tsx
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from "@/components/ui";

<Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
  <DialogHeader>Confirm Action</DialogHeader>
  <DialogBody>Are you sure you want to proceed?</DialogBody>
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </DialogFooter>
</Dialog>
```

#### Tabs with Variants
```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui";

<Tabs variant="enclosed" defaultIndex={0}>
  <TabList>
    <Tab>Profile</Tab>
    <Tab>Settings</Tab>
    <Tab disabled>Disabled</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Profile content</TabPanel>
    <TabPanel>Settings content</TabPanel>
    <TabPanel>Disabled content</TabPanel>
  </TabPanels>
</Tabs>
```

#### Form with Validation
```tsx
import { Input, Select, Checkbox, Button } from "@/components/ui";

<form>
  <Input placeholder="Email" aria-invalid={!!errors.email} />
  <Select
    options={[{ value: "us", label: "United States" }]}
    error={errors.country}
    label="Country"
  />
  <Checkbox label="I agree to terms" />
  <Button type="submit">Submit</Button>
</form>
```

#### Skeleton Loading State
```tsx
import { SkeletonCard, SkeletonTable } from "@/components/ui";

{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
) : (
  <CardGrid items={items} />
)}
```

### Design System CSS Variables

The component library uses CSS variables for theming. Key variables include:

```css
/* Colors (defined in globals.css) */
--background    /* Page background */
--foreground    /* Primary text color */
--primary       /* Primary brand color */
--secondary     /* Secondary color */
--muted         /* Muted backgrounds */
--accent        /* Accent/hover backgrounds */
--destructive   /* Error/danger color */
--border        /* Border color */
--input         /* Input border color */
--ring          /* Focus ring color */

/* Usage in components */
bg-primary text-primary-foreground
bg-muted text-muted-foreground
border-border
ring-ring
```

---

## Quick Reference

### How to Add a New Page

1. Create folder in `src/app/`:
```
src/app/new-page/
└── page.tsx        # Main page component
```

2. Basic page template:
```tsx
// src/app/new-page/page.tsx
"use client";

export default function NewPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">New Page</h1>
      {/* Content */}
    </div>
  );
}
```

### How to Add a New Component

```tsx
// src/components/ui/button.tsx
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded font-medium transition-colors",
        variant === "primary" && "bg-blue-500 text-white hover:bg-blue-600",
        variant === "outline" && "border border-blue-500 text-blue-500 hover:bg-blue-50",
        className
      )}
      {...props}
    />
  );
}
```

### How to Add Authentication to a Page

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div>
      {/* Protected content */}
    </div>
  );
}
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run lint:fix # Fix ESLint issues
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Session expired | Call `refreshAuth()` or redirect to login |
| CORS error | API URL mismatch | Check `NEXT_PUBLIC_API_URL` in `.env.local` |
| Hydration mismatch | Server/client state differs | Add `"use client"` directive |
| API types mismatch | API changed | Update types in `src/lib/api.ts` |
| Auth state stale | Context not refreshed | Call `refreshAuth()` after login |

---

## Critical Code Locations

| Functionality | File | Key Export/Function |
|--------------|------|---------------------|
| Auth state | `src/lib/auth-context.tsx` | `useAuth()`, `AuthProvider` |
| API client | `src/lib/api.ts` | `api`, `ApiClient`, `ApiError` |
| Root layout | `src/app/layout.tsx` | Metadata, AuthProvider wrapper |
| CSS utilities | `src/lib/utils.ts` | `cn()` |
| Global styles | `src/app/globals.css` | Tailwind imports |

---

## Type Reference

### User Types
```typescript
type UserRole = "USER" | "ADMIN";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}
```

### API Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Notes

- All pages using hooks must have `"use client"` directive
- API client automatically includes cookies for authentication
- AuthProvider in root layout makes auth available everywhere
- Use `cn()` utility from `@/lib/utils` for conditional classes

---

*This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase.*
