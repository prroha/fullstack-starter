# CLAUDE.md - Fullstack Starter Web

> **Last Updated**: 2026-02-09
> **Codebase Version**: 1.1.0
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
- **Skeletons**: `skeleton.tsx`, `skeleton-composites.tsx`, `SkeletonAdminPage`
- **Admin**: `components/admin/`, `AdminPageHeader`, `AdminFilters`

---

## Recent Changes

<!-- Add new entries at the top -->

| Date       | Change                                                        | Files                                                       |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| 2026-02-09 | ESLint flat config, skeleton composites, documentation update | `eslint.config.mjs`, `skeleton-composites.tsx`, `CLAUDE.md` |
| 2026-02-08 | Admin platform expansion with full admin dashboard pages      | `app/(protected)/admin/*`                                   |
| 2026-02-08 | Organized components with atomic design pattern               | `components/ui/index.ts`, `CLAUDE.md`                       |
| 2026-02-06 | Initial documentation                                         | CLAUDE.md                                                   |

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
│   ├── login/              # Login page
│   └── register/           # Register page
│
├── components/             # Atomic Design Component Library
│   ├── ui/                 # Core UI components (atoms, molecules, organisms)
│   │   ├── button.tsx      # Atom: Primary action element
│   │   ├── input.tsx       # Atom: Text input
│   │   ├── avatar.tsx      # Molecule: User avatar with fallback
│   │   ├── nav-link.tsx    # Molecule: Navigation link with active state
│   │   ├── dialog.tsx      # Organism: Modal dialog
│   │   ├── tabs.tsx        # Organism: Tabbed content
│   │   ├── layouts/        # Layout components
│   │   │   ├── container.tsx
│   │   │   ├── stack.tsx
│   │   │   ├── grid.tsx
│   │   │   └── dashboard-layout.tsx
│   │   └── index.ts        # Barrel export organized by category
│   ├── forms/              # Form-related molecules
│   ├── feedback/           # Alerts, toasts, loading states
│   ├── layout/             # Page layout organisms (Header, Footer)
│   ├── shared/             # Cross-cutting (ErrorBoundary, SEO)
│   ├── providers/          # Context providers
│   └── index.ts            # Main component entry point
│
└── lib/
    ├── api.ts              # API client + types
    ├── auth-context.tsx    # Auth context provider
    └── utils.ts            # cn() utility for class merging
```

---

## Key Files Index

| File                         | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `src/app/layout.tsx`         | Root layout, metadata, fonts, AuthProvider  |
| `src/app/page.tsx`           | Homepage with auth state display            |
| `src/lib/api.ts`             | API client, types, error handling           |
| `src/lib/auth-context.tsx`   | Auth state, login/logout functions          |
| `src/lib/utils.ts`           | `cn()` utility for Tailwind class merging   |
| `src/app/globals.css`        | Global CSS, Tailwind imports, CSS variables |
| `src/components/ui/index.ts` | UI component library barrel export          |

---

## State Management

### Auth Context (`src/lib/auth-context.tsx`)

```typescript
const {
  user, // User | null
  isLoading, // boolean - true during initial auth check
  isAuthenticated, // boolean - true if user is logged in
  isAdmin, // boolean - true if user role is ADMIN
  userRole, // "USER" | "ADMIN" | null
  login, // (email, password) => Promise<User>
  logout, // () => Promise<void>
  refreshAuth, // () => Promise<void>
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
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

| Route       | Page              | Auth Required |
| ----------- | ----------------- | ------------- |
| `/`         | Homepage          | No            |
| `/login`    | Login (create)    | No            |
| `/register` | Register (create) | No            |

### Admin Pages

All admin pages are under `app/(protected)/admin/` and require ADMIN role.

| Route                  | Page              | Description                               |
| ---------------------- | ----------------- | ----------------------------------------- |
| `/admin`               | Admin Dashboard   | Overview stats, quick actions             |
| `/admin/users`         | User Management   | List, view, edit, delete users, export    |
| `/admin/audit-logs`    | Audit Logs        | View action history, filter, export       |
| `/admin/orders`        | Order Management  | View orders, stats, update status, export |
| `/admin/faqs`          | FAQ Management    | CRUD FAQs and categories, reorder         |
| `/admin/announcements` | Announcements     | Create/manage system announcements        |
| `/admin/settings`      | App Settings      | Key-value settings management             |
| `/admin/content`       | CMS Pages         | Static content page editor                |
| `/admin/coupons`       | Coupon Management | Discount codes, usage tracking            |
| `/admin/messages`      | Contact Messages  | View/respond to contact form submissions  |

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

## UI Components Library - Atomic Design

> **Note**: This is a **custom component library** built specifically for this project. It is **NOT shadcn/ui** - all components are implemented from scratch with full control over styling and behavior. The design system uses **CSS variables with Tailwind CSS** for theming.

### Atomic Design Overview

Components are organized following **Atomic Design** principles:

```
components/
├── ui/                         # Core UI components
│   ├── button.tsx              # ATOM
│   ├── input.tsx               # ATOM
│   ├── avatar.tsx              # MOLECULE
│   ├── nav-link.tsx            # MOLECULE
│   ├── dialog.tsx              # ORGANISM
│   ├── tabs.tsx                # ORGANISM
│   ├── layouts/                # LAYOUTS
│   │   ├── container.tsx
│   │   ├── stack.tsx
│   │   ├── grid.tsx
│   │   └── dashboard-layout.tsx
│   └── index.ts                # Barrel export with categories
├── forms/                      # Form-specific molecules
├── feedback/                   # Alerts, toasts, loading
├── layout/                     # Page layout organisms
├── shared/                     # Cross-cutting concerns
└── index.ts                    # Main entry point
```

### Component Categories

#### ATOMS - Basic Building Blocks

Smallest components - single HTML elements with consistent styling. No dependencies on other components.

| Component              | File                  | Description                                                                                               |
| ---------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `Button`               | `button.tsx`          | Action button with variants (default, destructive, outline, secondary, ghost, link), sizes, loading state |
| `Input`                | `input.tsx`           | Text input with focus ring, disabled state, error styling via `aria-invalid`                              |
| `Textarea`             | `textarea.tsx`        | Multi-line text input with auto-resize support                                                            |
| `Checkbox`             | `checkbox.tsx`        | Boolean toggle with label, indeterminate state, size variants                                             |
| `Radio` / `RadioGroup` | `radio.tsx`           | Radio selection with keyboard navigation                                                                  |
| `Select`               | `select.tsx`          | Dropdown with options, placeholder, error message                                                         |
| `Switch`               | `switch.tsx`          | Toggle switch with label position options                                                                 |
| `Badge`                | `badge.tsx`           | Status indicator with color variants                                                                      |
| `Spinner`              | `spinner.tsx`         | Loading indicator in multiple sizes                                                                       |
| `Skeleton`             | `skeleton.tsx`        | Loading placeholders (14+ variants)                                                                       |
| `Label`                | `label.tsx`           | Form field label with required indicator                                                                  |
| `Icon`                 | `icon.tsx`            | Lucide icon wrapper with size/color variants                                                              |
| `AppLink`              | `link.tsx`            | Internal/external link with auto-detection                                                                |
| `Text`                 | `text.tsx`            | Typography component with variants                                                                        |
| `Divider`              | `divider.tsx`         | Visual separator (horizontal/vertical)                                                                    |
| `Kbd`                  | `kbd.tsx`             | Keyboard key indicator                                                                                    |
| `VisuallyHidden`       | `visually-hidden.tsx` | Screen reader only content                                                                                |

#### MOLECULES - Functional Combinations

Groups of atoms forming a functional unit with a single purpose.

| Component               | File                    | Description                                                          |
| ----------------------- | ----------------------- | -------------------------------------------------------------------- |
| `Avatar`                | `avatar.tsx`            | User avatar with image/initials fallback, status indicator           |
| `NavLink`               | `nav-link.tsx`          | Navigation link with active state (sidebar, topnav, mobile variants) |
| `IconButton`            | `icon-button.tsx`       | Icon-only button with accessibility label                            |
| `MenuItem`              | `menu-item.tsx`         | Menu action item with icon and keyboard shortcut                     |
| `FieldWrapper`          | `field-wrapper.tsx`     | Form field with label, hint, error message                           |
| `StatusBadge`           | `status-badge.tsx`      | Status indicator (active, pending, error, etc.)                      |
| `ThemeToggle`           | `theme-toggle.tsx`      | Dark/light mode switch                                               |
| `ThemeSelector`         | `theme-selector.tsx`    | Theme dropdown selector                                              |
| `PasswordStrengthMeter` | `password-strength.tsx` | Password validation indicator                                        |
| `ConfirmButton`         | `confirm-button.tsx`    | Button with confirmation dialog                                      |
| `ExportButton`          | `export-button.tsx`     | Download/export actions                                              |
| `Autocomplete`          | `autocomplete.tsx`      | Search input with suggestions                                        |
| `TagInput`              | `tag-input.tsx`         | Multi-value tag input                                                |
| `QRCode`                | `qr-code.tsx`           | QR code generator with download                                      |
| `AvatarUpload`          | `avatar-upload.tsx`     | Avatar with upload/remove capability                                 |

#### ORGANISMS - Complex UI Patterns

Composed of molecules and atoms, forming distinct interface sections.

| Component   | File            | Description                                                                      |
| ----------- | --------------- | -------------------------------------------------------------------------------- |
| `Dialog`    | `dialog.tsx`    | Modal with `DialogHeader`, `DialogBody`, `DialogFooter`                          |
| `Tabs`      | `tabs.tsx`      | Tab navigation with `TabList`, `Tab`, `TabPanels`, `TabPanel`                    |
| `Accordion` | `accordion.tsx` | Expandable sections with `AccordionItem`, `AccordionTrigger`, `AccordionContent` |

#### LAYOUTS - Page Structure

Structural components defining arrangement and responsive behavior.

| Component         | File                           | Description                             |
| ----------------- | ------------------------------ | --------------------------------------- |
| `Container`       | `layouts/container.tsx`        | Centered content wrapper with max-width |
| `Stack`           | `layouts/stack.tsx`            | Vertical/horizontal flex container      |
| `Grid`            | `layouts/grid.tsx`             | Responsive grid with `GridItem`         |
| `AuthLayout`      | `layouts/auth-layout.tsx`      | Authentication page layout              |
| `PageLayout`      | `layouts/page-layout.tsx`      | Standard page with optional sidebar     |
| `DashboardLayout` | `layouts/dashboard-layout.tsx` | Admin dashboard layout                  |
| `SplitLayout`     | `layouts/split-layout.tsx`     | Two-panel layout                        |

### Import Patterns

```typescript
// Import from barrel file (recommended)
import { Button, Input, Dialog, Avatar, Stack } from "@/components/ui";

// Import individual components
import { Button } from "@/components/ui/button";

// Import from category folders
import { Form, FormField } from "@/components/forms";
import { Alert, Toaster } from "@/components/feedback";
import { Header, Footer } from "@/components/layout";
```

### When to Use Each Category

| Category      | Use When                                    | Examples                          |
| ------------- | ------------------------------------------- | --------------------------------- |
| **Atoms**     | Need a basic, styled HTML element           | Button, Input, Badge              |
| **Molecules** | Combining 2-3 atoms for a specific function | Avatar, NavLink, FieldWrapper     |
| **Organisms** | Building a complete UI section              | Dialog, Tabs, Accordion           |
| **Layouts**   | Structuring page content                    | Container, Stack, DashboardLayout |

### How to Add New Components

1. **Determine the category** based on complexity:
   - Single styled element = Atom
   - Combines 2-3 atoms = Molecule
   - Complex with state/behavior = Organism
   - Page structure = Layout

2. **Create the component file** in the appropriate location:

```tsx
// src/components/ui/my-component.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary";
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "base-styles",
          variant === "primary" && "primary-styles",
          className,
        )}
        {...props}
      />
    );
  },
);
MyComponent.displayName = "MyComponent";

export { MyComponent };
```

3. **Add to the barrel export** in `ui/index.ts` under the correct category section:

```typescript
// =============================================================================
// MOLECULES - Simple Combinations of Atoms
// =============================================================================

// MyComponent - Brief description
export { MyComponent } from "./my-component";
export type { MyComponentProps } from "./my-component";
```

### Usage Examples

#### Atoms - Button with Loading State

```tsx
import { Button } from "@/components/ui";

<Button variant="default" isLoading={isSubmitting}>
  Submit
</Button>;
```

#### Molecules - Avatar with Status

```tsx
import { Avatar } from "@/components/ui";

<Avatar src="/user.jpg" name="John Doe" size="lg" status="online" />;
```

#### Organisms - Dialog Modal

```tsx
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from "@/components/ui";

<Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
  <DialogHeader>Confirm Action</DialogHeader>
  <DialogBody>Are you sure you want to proceed?</DialogBody>
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </DialogFooter>
</Dialog>;
```

#### Layouts - Dashboard Page

```tsx
import {
  DashboardLayout,
  DashboardSidebar,
  DashboardNavItem,
} from "@/components/ui";

<DashboardLayout
  sidebar={
    <DashboardSidebar>
      <DashboardNavItem href="/dashboard" icon={<HomeIcon />} label="Home" />
      <DashboardNavItem
        href="/settings"
        icon={<SettingsIcon />}
        label="Settings"
      />
    </DashboardSidebar>
  }
>
  <main>{children}</main>
</DashboardLayout>;
```

### Skeleton Components

Loading placeholders organized in two files:

**Base Skeletons** (`components/ui/skeleton.tsx`):

| Component           | Description                                |
| ------------------- | ------------------------------------------ |
| `Skeleton`          | Base skeleton with pulse/shimmer animation |
| `SkeletonText`      | Multi-line text placeholder                |
| `SkeletonCircle`    | Circle for avatars                         |
| `SkeletonAvatar`    | Avatar with text placeholders              |
| `SkeletonButton`    | Button placeholder                         |
| `SkeletonImage`     | Image with aspect ratio support            |
| `SkeletonCard`      | Card layout (default, horizontal, compact) |
| `SkeletonTable`     | Table with configurable rows/columns       |
| `SkeletonList`      | List (default, simple, detailed)           |
| `SkeletonPage`      | Full page loading                          |
| `SkeletonDashboard` | Dashboard with nav, sidebar, stats         |
| `SkeletonForm`      | Form layout                                |
| `SkeletonProfile`   | Profile page                               |
| `SkeletonAuth`      | Authentication page                        |

**Composite Skeletons** (`components/shared/skeleton-composites.tsx`):

| Component                   | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `SkeletonAdminPage`         | Admin page with header, filters, table         |
| `SkeletonSettingsPage`      | Settings page with form sections               |
| `SkeletonDashboardEnhanced` | Dashboard with stats, charts, sidebar          |
| `SkeletonFormEnhanced`      | Form with configurable layout                  |
| `SkeletonUserCard`          | User card (default, compact, detailed)         |
| `SkeletonProfilePage`       | Full profile page with cover, avatar, activity |
| `SkeletonProductCard`       | E-commerce product card                        |
| `SkeletonComment`           | Comment/message with replies                   |
| `SkeletonNotification`      | Notification item                              |
| `SkeletonSearchResults`     | Search results with filters                    |

**Usage for Admin Loading States:**

```tsx
// app/(protected)/admin/users/loading.tsx
import { SkeletonAdminPage } from "@/components/shared/skeleton-composites";

export default function Loading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-40"
      descriptionWidth="w-64"
      headerActions={1}
      filterCount={3}
      tableRows={8}
      tableColumns={5}
    />
  );
}
```

**Usage for Settings Loading States:**

```tsx
// app/settings/loading.tsx
import { SkeletonSettingsPage } from "@/components/shared/skeleton-composites";

export default function Loading() {
  return <SkeletonSettingsPage sections={3} fieldsPerSection={3} />;
}
```

### Design System CSS Variables

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

## Admin Components

Shared components for admin pages (`components/admin/`):

| Component             | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `AdminPageHeader`     | Page title, description, export button, action buttons |
| `AdminFilters`        | Search input and filter dropdowns                      |
| `AdminTableContainer` | Table wrapper with loading/empty states                |
| `AdminPagination`     | Pagination controls                                    |

**Usage Example:**

```tsx
import {
  AdminPageHeader,
  AdminFilters,
  AdminTableContainer,
  AdminPagination,
} from "@/components/admin";

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Users"
        description="Manage user accounts"
        exportConfig={{
          label: "Export Users",
          onExport: handleExport,
        }}
        actions={<Button>Add User</Button>}
      />
      <AdminFilters
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: "role",
            label: "Role",
            options: roleOptions,
            value: role,
            onChange: setRole,
          },
        ]}
      />
      <AdminTableContainer loading={isLoading} isEmpty={users.length === 0}>
        <DataTable columns={columns} data={users} />
      </AdminTableContainer>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
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

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded font-medium transition-colors",
        variant === "primary" && "bg-blue-500 text-white hover:bg-blue-600",
        variant === "outline" &&
          "border border-blue-500 text-blue-500 hover:bg-blue-50",
        className,
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <div>{/* Protected content */}</div>;
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

## ESLint Configuration

This project uses **ESLint flat config** (`eslint.config.mjs`) with TypeScript and React support.

### Key Rules

| Rule                                 | Setting | Purpose                                  |
| ------------------------------------ | ------- | ---------------------------------------- |
| `@typescript-eslint/no-unused-vars`  | error   | Unused vars must be prefixed with `_`    |
| `@typescript-eslint/no-explicit-any` | warn    | Avoid `any` type                         |
| `react-hooks/rules-of-hooks`         | error   | Enforce hooks rules                      |
| `react-hooks/exhaustive-deps`        | warn    | Dependency array completeness            |
| `no-console`                         | warn    | Use logger; `console.warn/error` allowed |

### Ignored Patterns

- `node_modules/`, `.next/`, `dist/`, `out/`
- `coverage/`, `storybook-static/`
- `*.d.ts` files

### Unused Variable Pattern

Variables prefixed with `_` are ignored:

```typescript
const [_value, setValue] = useState(); // OK - _value ignored
const { user: _user, ...rest } = data; // OK - _user ignored
```

---

## Spacing Conventions

Use consistent spacing patterns:

| Context            | Preferred          | Avoid                         |
| ------------------ | ------------------ | ----------------------------- |
| Vertical stacking  | `space-y-4`        | Manual `mb-4` on each element |
| Flex children gaps | `gap-4`            | `ml-4` / `mr-4` on children   |
| Grid gaps          | `gap-4` or `gap-6` | Margins on grid items         |
| Form fields        | `space-y-4`        | Individual margins per field  |
| Card content       | `p-4` or `p-6`     | Mixed padding values          |

**Example:**

```tsx
// Good - consistent spacing
<div className="space-y-4">
  <Input />
  <Input />
  <Button />
</div>

// Avoid - manual margins
<div>
  <Input className="mb-4" />
  <Input className="mb-4" />
  <Button />
</div>
```

---

## Common Issues & Solutions

| Issue              | Cause                       | Solution                                    |
| ------------------ | --------------------------- | ------------------------------------------- |
| 401 Unauthorized   | Session expired             | Call `refreshAuth()` or redirect to login   |
| CORS error         | API URL mismatch            | Check `NEXT_PUBLIC_API_URL` in `.env.local` |
| Hydration mismatch | Server/client state differs | Add `"use client"` directive                |
| API types mismatch | API changed                 | Update types in `src/lib/api.ts`            |
| Auth state stale   | Context not refreshed       | Call `refreshAuth()` after login            |

---

## Critical Code Locations

| Functionality | File                       | Key Export/Function            |
| ------------- | -------------------------- | ------------------------------ |
| Auth state    | `src/lib/auth-context.tsx` | `useAuth()`, `AuthProvider`    |
| API client    | `src/lib/api.ts`           | `api`, `ApiClient`, `ApiError` |
| Root layout   | `src/app/layout.tsx`       | Metadata, AuthProvider wrapper |
| CSS utilities | `src/lib/utils.ts`         | `cn()`                         |
| Global styles | `src/app/globals.css`      | Tailwind imports               |

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

_This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase._
