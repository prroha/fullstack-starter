# CLAUDE.md - Fullstack Starter Web

> **Last Updated**: 2026-02-06
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

---

## Recent Changes

<!-- Add new entries at the top -->
| Date | Change | Files |
|------|--------|-------|
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
│   └── ui/                 # UI components (add as needed)
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
| `src/app/globals.css` | Global CSS and Tailwind imports |

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
