# CLAUDE.md - Fullstack Starter Template

> **Last Updated**: 2026-02-12
> **Codebase Version**: 1.3.0
> **Maintainer**: AI-assisted documentation (auto-update on changes)

AI-optimized documentation for quick codebase navigation and understanding.

---

## MANDATORY RULES (Read First)

These are hard constraints. Violations are bugs.

### Rule 1: NEVER Write Raw HTML When a Core Component Exists

**BEFORE writing ANY UI element**, check the Component Registry below. If a core component exists, you MUST use it. NEVER write:

- `<button>` — use `Button` from `@/components/ui/button`
- `<input>` — use `Input` from `@/components/ui/input`
- `<textarea>` — use `Textarea` from `@/components/ui/textarea`
- `<select>` — use `Select` from `@/components/ui/select`
- `<label>` — use `Label` from `@/components/ui/label`
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` — use `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- Custom star ratings (SVGs, Array.from loops) — use `Rating` from `@/components/ui/rating`
- Custom loading spinners — use `Spinner` from `@/components/ui/spinner` or `LoadingWrapper` from `@/components/feedback/loading-wrapper`
- Custom status badges — use `Badge` from `@/components/ui/badge` or `StatusBadge` from `@/components/ui/status-badge`
- Custom stat cards — use `StatCard` from `@/components/ui/stat-card`
- Custom pagination — use `Pagination` from `@/components/ui/pagination`
- Custom search with debounce — use `SearchInput` from `@/components/ui/search-input`
- Custom confirm dialogs — use `ConfirmButton` from `@/components/ui/confirm-button` or `Dialog` from `@/components/ui/dialog`
- Custom empty states — use `EmptyState` from `@/components/shared/empty-state`
- Custom error/success banners — use `Alert` from `@/components/feedback/alert` or `InlineFeedback` from `@/components/feedback/inline-feedback`
- Custom progress bars — use `Progress` from `@/components/ui/progress`
- Custom tooltips — use `Tooltip` from `@/components/ui/tooltip`
- Custom tabs — use `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel` from `@/components/ui/tabs`
- Custom breadcrumbs — use `Breadcrumb` from `@/components/ui/breadcrumb`
- Custom accordion — use `Accordion` from `@/components/ui/accordion`
- Custom modal/dialog — use `Modal` from `@/components/ui/modal` or `Dialog` from `@/components/ui/dialog`
- Custom dropdown menus — use `DropdownMenu` from `@/components/ui/dropdown-menu`

**The ONLY exceptions** where raw HTML is acceptable:

- `<label>` wrapping a checkbox tile (custom interactive layout)
- `<input type="checkbox">` inside a styled tile selector
- Highly custom SVG illustrations or animations

### Rule 2: Core-First Development Workflow

When building ANY new module or feature, follow this order:

1. **Read core components first** — `ls core/web/src/components/ui/` and check this registry
2. **Import from core** — use `@/components/ui/*`, `@/components/feedback/*`, `@/components/layout/*`, `@/components/forms/*`, `@/components/shared/*`
3. **Build domain-specific components** that COMPOSE core components — never rebuild what exists
4. **If something new is generic** (useful across modules), add it to `core/web/src/components/` — not inside the module

### Rule 3: Module Code Must Be Domain-Specific Only

Module code (e.g., `modules/ecommerce/`, `modules/lms/`) must ONLY contain:

- **Domain types** (`types.ts`) — interfaces specific to that domain
- **Domain API client** (`api.ts`) — API calls specific to that domain
- **Domain formatters** (`formatters.ts`) — formatting helpers specific to that domain
- **Domain components** — components that COMPOSE core UI for domain-specific layouts
- **Domain pages** — pages that import core UI + domain components
- **Domain backend** — routes + services for domain business logic

Module code must NEVER contain:

- Generic UI components (buttons, inputs, tables, badges, etc.)
- Generic utilities (debounce, cn, formatDate, etc.)
- Auth middleware (use the shared pattern from `modules/*/backend/src/middleware/auth.ts`)

### Rule 4: Design System Consistency

- Use CSS variables (`text-foreground`, `bg-background`, `border-border`, `text-muted-foreground`, etc.) — NOT hardcoded colors like `text-gray-900`, `bg-white`, `border-gray-200`
- Use `cn()` from `@/lib/utils` for conditional class merging
- Follow spacing conventions: `space-y-4`, `gap-4`, not manual margins
- Use `isLoading` prop on `Button` — never build custom loading states with disabled + spinner

### Rule 5: Quality Standards

- **No unused imports or variables** — clean up after refactoring
- **No `any` types** — use proper TypeScript types
- **No `_variable` hacks** — if a prop is unused, remove it from the interface
- **Prices in cents** — `formatPrice` divides by 100, all price fields are integers
- **Consistent error handling** — `try/catch` with `err instanceof Error ? err.message : 'fallback'`
- **Loading/error/empty states** — every data-fetching page needs all three

### Rule 6: Promote Generic Code to Core

When writing or fixing code, if you create something **not tied to a specific domain**, it belongs in core — not inside the module.

**Promote to core when the code:**

- Could be used by 2+ modules
- Has no domain-specific imports (no `@/lib/lms/*`, `@/lib/ecommerce/*`, etc.)
- Solves a general UI, data, or backend pattern

**Where to put it:**

| What                   | Location                                | Then                                                                          |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| UI component (generic) | `core/web/src/components/ui/<name>.tsx` | Add to barrel export in `ui/index.ts`, update Component Registry in this file |
| Hook (generic)         | `core/web/src/lib/hooks/<name>.ts`      | Add to barrel export in `hooks/index.ts`, update Hooks Registry in this file  |
| Utility function       | `core/web/src/lib/<name>.ts`            | Update Utilities Registry in this file                                        |
| Backend middleware     | `core/backend/src/middleware/<name>.ts` | Update Middleware Registry in this file                                       |
| Backend utility        | `core/backend/src/utils/<name>.ts`      | Update Utilities Registry in this file                                        |

**Examples of what to promote:**

- A `formatCurrency(amount, currency)` function → `core/web/src/lib/utils.ts`
- A `usePagination()` hook → `core/web/src/lib/hooks/`
- A `PriceDisplay` component → `core/web/src/components/ui/`
- A `validatePagination()` middleware → `core/backend/src/middleware/`

**Examples of what stays in module:**

- `formatOrderStatus()` that maps `EcommerceOrderStatus` enum → stays in `modules/ecommerce/`
- `CourseProgressBar` that uses LMS enrollment data → stays in `modules/lms/`

**IMPORTANT**: After promoting to core, update the relevant registry section in THIS file so future sessions know about it without scanning.

### Rule 7: Bug Fixes Follow the Same Rules

When fixing bugs, ALL rules above still apply:

- If the fix involves UI, use core components — don't introduce raw HTML even in a quick fix
- If the fix introduces utility code, check if it's generic → promote to core
- Fix root causes, not symptoms
- Don't refactor surrounding code unless directly related to the bug

---

## Core Component Registry

This is the complete inventory of reusable components. **Always use these instead of writing custom UI.**

### Form Elements (`@/components/ui/*`)

| Component       | Import                              | Key Props                                                                                                                           |
| --------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Button`        | `@/components/ui/button`            | variant: "default"\|"destructive"\|"outline"\|"secondary"\|"ghost"\|"link", size: "default"\|"sm"\|"lg"\|"icon", isLoading, asChild |
| `Input`         | `@/components/ui/input`             | extends native `<input>`, showCharacterCount                                                                                        |
| `Textarea`      | `@/components/ui/textarea`          | extends native `<textarea>`, showCharacterCount                                                                                     |
| `Label`         | `@/components/ui/label`             | htmlFor, required, disabled                                                                                                         |
| `Select`        | `@/components/ui/select`            | options: {value,label}[], value, onChange: (value: string) => void, size: "sm"\|"md"\|"lg", error                                   |
| `Checkbox`      | `@/components/ui/checkbox`          | checked, onChange, label, error, indeterminate, size: "sm"\|"md"\|"lg"                                                              |
| `RadioGroup`    | `@/components/ui/radio`             | name, value, onChange: (value: string) => void, options: RadioOption[], orientation: "horizontal"\|"vertical"                       |
| `Switch`        | `@/components/ui/switch`            | checked, onChange: (checked: boolean) => void, label, size: "sm"\|"md"\|"lg"                                                        |
| `NumberInput`   | `@/components/ui/number-input`      | value, min, max, step, prefix, suffix, hideButtons, onChange: (value: number) => void                                               |
| `DatePicker`    | `@/components/ui/date-picker`       | value, onChange, minDate, maxDate, format, showTodayButton                                                                          |
| `TimePicker`    | `@/components/ui/time-picker`       | value, onChange, format: "12"\|"24", step                                                                                           |
| `TagInput`      | `@/components/ui/tag-input`         | value: string[], onChange, maxTags, validateTag, delimiter                                                                          |
| `SearchInput`   | `@/components/ui/search-input`      | debounceDelay, onSearch, onChange, size: "sm"\|"md"\|"lg", loading, shortcutHint                                                    |
| `PasswordInput` | `@/components/forms/password-input` | (extends Input with show/hide toggle)                                                                                               |
| `FieldWrapper`  | `@/components/ui/field-wrapper`     | label, htmlFor, error, required, hint                                                                                               |

### Data Display (`@/components/ui/*`)

| Component     | Import                         | Key Props                                                                                                                              |
| ------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Badge`       | `@/components/ui/badge`        | variant: "default"\|"secondary"\|"destructive"\|"outline"\|"success"\|"warning", size: "default"\|"sm"\|"lg"                           |
| `StatusBadge` | `@/components/ui/status-badge` | status: "active"\|"inactive"\|"pending"\|"success"\|"warning"\|"error"\|"info", showDot, label                                         |
| `Rating`      | `@/components/ui/rating`       | value, onChange, max, allowHalf, readOnly, size: "sm"\|"md"\|"lg", showValue                                                           |
| `StatCard`    | `@/components/ui/stat-card`    | value, label, change, trend: "up"\|"down"\|"neutral", icon, variant: "default"\|"success"\|"warning"\|"error"\|"info", isLoading, href |
| `Avatar`      | `@/components/ui/avatar`       | src, alt, name, size: "xs"\|"sm"\|"md"\|"lg"\|"xl", status: "online"\|"offline"\|"busy"\|"away"                                        |
| `Progress`    | `@/components/ui/progress`     | value, size: "sm"\|"md"\|"lg", color, showLabel, variant: "linear"\|"circular"                                                         |
| `Tooltip`     | `@/components/ui/tooltip`      | content, position: "top"\|"bottom"\|"left"\|"right", delay, variant: "dark"\|"light"                                                   |
| `Skeleton`    | `@/components/ui/skeleton`     | animation: "pulse"\|"shimmer"                                                                                                          |
| `Spinner`     | `@/components/ui/spinner`      | size: "sm"\|"md"\|"lg"                                                                                                                 |
| `Breadcrumb`  | `@/components/ui/breadcrumb`   | items: BreadcrumbItem[], separator, showHomeIcon                                                                                       |
| `Divider`     | `@/components/ui/divider`      | orientation, variant: "solid"\|"dashed", label                                                                                         |
| `Slider`      | `@/components/ui/slider`       | value, min, max, step, range, marks, size                                                                                              |
| `Stepper`     | `@/components/ui/stepper`      | steps, activeStep, orientation, isLinear, clickable                                                                                    |
| `Timeline`    | `@/components/ui/timeline`     | (timeline display)                                                                                                                     |

### Layout & Containers (`@/components/ui/*`, `@/components/layout/*`)

| Component       | Import                               | Key Props                                                                                                                         |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `Card`          | `@/components/ui/card`               | variant: "default"\|"outline"\|"elevated"\|"ghost", interactive, padding: "none"\|"sm"\|"md"\|"lg"                                |
| `CardHeader`    | `@/components/ui/card`               | bordered                                                                                                                          |
| `CardTitle`     | `@/components/ui/card`               | as: "h1"-"h6"                                                                                                                     |
| `CardContent`   | `@/components/ui/card`               | —                                                                                                                                 |
| `CardFooter`    | `@/components/ui/card`               | bordered                                                                                                                          |
| `Table`         | `@/components/ui/table`              | fullWidth (also: TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter, TableCaption)                               |
| `DataTable`     | `@/components/ui/data-table`         | columns, data, keyExtractor, isLoading, emptyMessage, onRowClick, pagination, skeletonRows                                        |
| `Tabs`          | `@/components/ui/tabs`               | defaultIndex, index, onChange, orientation, variant: "line"\|"enclosed"\|"soft-rounded" (also: TabList, Tab, TabPanels, TabPanel) |
| `Accordion`     | `@/components/ui/accordion`          | type: "single"\|"multiple", collapsible (also: AccordionItem, AccordionTrigger, AccordionContent)                                 |
| `Pagination`    | `@/components/ui/pagination`         | page, totalPages, onPageChange, totalItems, pageSize, showItemCount, showPageSizeSelector, size                                   |
| `PageContainer` | `@/components/layout/page-container` | size: "sm"\|"md"\|"lg"\|"xl"\|"full", padding, centered                                                                           |
| `Section`       | `@/components/layout/section`        | title, description, action, padding, bordered                                                                                     |

### Overlays & Feedback (`@/components/ui/*`, `@/components/feedback/*`)

| Component        | Import                                  | Key Props                                                                                                   |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Dialog`         | `@/components/ui/dialog`                | isOpen, onClose, title, size: "sm"\|"md"\|"lg"\|"xl"\|"full" (also: DialogHeader, DialogBody, DialogFooter) |
| `Modal`          | `@/components/ui/modal`                 | isOpen, onClose, title, size: "sm"\|"md"\|"lg", footer                                                      |
| `DropdownMenu`   | `@/components/ui/dropdown-menu`         | trigger, content, position, closeOnSelect                                                                   |
| `Alert`          | `@/components/feedback/alert`           | variant: "default"\|"info"\|"success"\|"warning"\|"destructive", title, onDismiss                           |
| `LoadingWrapper` | `@/components/feedback/loading-wrapper` | isLoading, error, children, onRetry, variant: "inline"\|"card"\|"overlay"\|"minimal"                        |
| `AsyncContent`   | `@/components/feedback/loading-wrapper` | data, isLoading, error, children: (data) => ReactNode, onRetry, emptyState                                  |
| `InlineFeedback` | `@/components/feedback/inline-feedback` | variant: "success"\|"error"\|"warning"\|"info", message, show, onDismiss                                    |
| `ConfirmButton`  | `@/components/ui/confirm-button`        | confirmMode: "double-click"\|"dialog", confirmTitle, confirmMessage, onConfirm                              |
| `ExportButton`   | `@/components/ui/export-button`         | url, filename, formats, onExport                                                                            |

### Shared Components (`@/components/shared/*`)

| Component           | Import                                    | Key Props                                                                                               |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `EmptyState`        | `@/components/shared/empty-state`         | icon, title, description, action, variant: "noData"\|"noResults"\|"noNotifications"\|"error"\|"offline" |
| `EmptySearch`       | `@/components/shared/empty-state`         | searchQuery, action                                                                                     |
| `EmptyList`         | `@/components/shared/empty-state`         | title, description, action                                                                              |
| `ErrorState`        | `@/components/shared/empty-state`         | title, description, action                                                                              |
| `SkeletonAdminPage` | `@/components/shared/skeleton-composites` | titleWidth, headerActions, filterCount, tableRows, tableColumns                                         |

### Form Helpers (`@/components/forms/*`)

| Component           | Import                          | Key Props                                               |
| ------------------- | ------------------------------- | ------------------------------------------------------- |
| `Form`              | `@/components/forms/form`       | form (react-hook-form), onSubmit                        |
| `FormField`         | `@/components/forms/form`       | (react-hook-form Controller)                            |
| `FormFieldInput`    | `@/components/forms/form-field` | label, description, required, placeholder, type         |
| `FormFieldTextarea` | `@/components/forms/form-field` | label, description, required, placeholder               |
| `FormActions`       | `@/components/forms/form-field` | submitLabel, cancelLabel, isSubmitting, onCancel, align |
| `FormStatusMessage` | `@/components/forms/form-field` | variant, message, title                                 |

### Admin Components (`@/components/admin/*`)

| Component             | Import               | Key Props                                  |
| --------------------- | -------------------- | ------------------------------------------ |
| `AdminPageHeader`     | `@/components/admin` | title, description, export button, actions |
| `AdminFilters`        | `@/components/admin` | search and filter inputs                   |
| `AdminTableContainer` | `@/components/admin` | table wrapper with loading/empty states    |
| `AdminPagination`     | `@/components/admin` | pagination controls                        |

---

## Backend Reusable Code Registry

### Middleware (`core/backend/src/middleware/`)

| Middleware               | Import                                | Usage                                                          |
| ------------------------ | ------------------------------------- | -------------------------------------------------------------- |
| `authMiddleware`         | `../middleware/auth.middleware`       | Require authenticated user, attaches `req.user` + `req.dbUser` |
| `adminMiddleware`        | `../middleware/auth.middleware`       | Require ADMIN role (use after authMiddleware)                  |
| `optionalAuthMiddleware` | `../middleware/auth.middleware`       | Attach user if present, don't fail                             |
| `rateLimiter`            | `../middleware/rate-limit.middleware` | Rate limiting per IP                                           |
| `uploadMiddleware`       | `../middleware/upload.middleware`     | File upload handling (multer)                                  |
| `sanitizeMiddleware`     | `../middleware/sanitize.middleware`   | Input sanitization                                             |
| `csrfMiddleware`         | `../middleware/csrf.middleware`       | CSRF protection                                                |

**Module auth middleware pattern** — each module copies the lightweight auth middleware pattern (see `modules/lms/backend/src/middleware/auth.ts`). Do NOT import from core directly since modules are independently deployable.

### Services (`core/backend/src/services/`)

| Service               | Import                             | Purpose                                 |
| --------------------- | ---------------------------------- | --------------------------------------- |
| `authService`         | `../services/auth.service`         | Password hashing, credential validation |
| `userService`         | `../services/user.service`         | User CRUD                               |
| `sessionService`      | `../services/session.service`      | Multi-device session management         |
| `emailService`        | `../services/email.service`        | Send transactional emails               |
| `auditService`        | `../services/audit.service`        | Audit log creation/querying             |
| `notificationService` | `../services/notification.service` | In-app notifications                    |
| `exportService`       | `../services/export.service`       | CSV export for admin data               |
| `searchService`       | `../services/search.service`       | Global search across entities           |
| `lockoutService`      | `../services/lockout.service`      | Account lockout/brute force protection  |
| `orderService`        | `../services/order.service`        | Core order management                   |
| `couponService`       | `../services/coupon.service`       | Discount coupon management              |
| `settingService`      | `../services/setting.service`      | App settings (key-value)                |

### Utilities (`core/backend/src/utils/`)

| Utility             | Import                           | Purpose                                                                          |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `successResponse`   | `../utils/response`              | Wrap data in `{ success: true, data }`                                           |
| `errorResponse`     | `../utils/response`              | Wrap error in `{ success: false, error }`                                        |
| `paginatedResponse` | `../utils/response`              | Wrap list in `{ items, pagination }`                                             |
| `ApiError`          | `../middleware/error.middleware` | `.notFound()`, `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.conflict()` |
| `generateTokenPair` | `../utils/jwt`                   | JWT access + refresh tokens                                                      |
| `db`                | `../lib/db`                      | Prisma client singleton                                                          |
| `logger`            | `../lib/logger`                  | `.info()`, `.warn()`, `.error()`, `.audit()`, `.security()`                      |

### Backend Anti-Patterns

```typescript
// BAD: Manual error response
res.status(404).json({ success: false, error: { message: "Not found" } });
// GOOD: Use ApiError
throw ApiError.notFound("Resource not found");

// BAD: Manual success response
res.json({ success: true, data: { items: results } });
// GOOD: Use helpers
res.json(successResponse({ items: results }));
res.json(paginatedResponse(items, page, limit, total));

// BAD: Manual pagination calculation
const totalPages = Math.ceil(total / limit);
const hasNext = page < totalPages;
// GOOD: paginatedResponse does this automatically
```

---

## Frontend Reusable Code Registry

### Hooks (`core/web/src/lib/hooks/`)

| Hook              | Import               | Purpose                                                                                                                      |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `useAuth`         | `@/lib/auth-context` | `{ user, isAuthenticated, isAdmin, isLoading, login, logout, refreshAuth }`                                                  |
| `useDebounce`     | `@/lib/hooks`        | Debounce a value: `const debouncedSearch = useDebounce(search, 300)`                                                         |
| `useAsync`        | `@/lib/hooks`        | `{ data, error, isLoading, execute }` — wraps async operations                                                               |
| `useAdminList`    | `@/lib/hooks`        | `{ items, loading, error, page, setPage, search, setSearch, filters, ... }` — full admin list with pagination/search/filters |
| `useClickOutside` | `@/lib/hooks`        | Close dropdown/modal when clicking outside ref                                                                               |
| `useClipboard`    | `@/lib/hooks`        | `{ copy, copied }` — copy text to clipboard                                                                                  |
| `useLocalStorage` | `@/lib/hooks`        | Persistent state in localStorage                                                                                             |
| `useSearch`       | `@/lib/hooks`        | Search with debounce: `{ query, setQuery, debouncedQuery }`                                                                  |
| `useToggle`       | `@/lib/hooks`        | `[isOpen, toggle, setOpen]` — boolean toggle                                                                                 |
| `useTheme`        | `@/lib/hooks`        | Theme management                                                                                                             |

### Utilities (`core/web/src/lib/`)

| Utility       | Import              | Purpose                                            |
| ------------- | ------------------- | -------------------------------------------------- |
| `cn()`        | `@/lib/utils`       | Tailwind class merging (clsx + tailwind-merge)     |
| `api`         | `@/lib/api`         | API client singleton with cookie auth              |
| `ApiError`    | `@/lib/api`         | Error class with `status` and `code`               |
| `toast`       | `@/lib/toast`       | `toast.success()`, `toast.error()`, `toast.info()` |
| `validations` | `@/lib/validations` | Shared validation patterns                         |
| `constants`   | `@/lib/constants`   | App-wide constants                                 |

### Frontend Anti-Patterns

```typescript
// BAD: Custom debounce in useEffect
useEffect(() => { const t = setTimeout(() => fn(val), 300); return () => clearTimeout(t); }, [val]);
// GOOD: Use hook
const debouncedVal = useDebounce(val, 300);

// BAD: Manual loading/error state management
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState(null);
// GOOD: Use useAsync hook or LoadingWrapper component

// BAD: Manual API error handling
try { ... } catch (e) { if (e.status === 401) router.push('/login'); }
// GOOD: API client handles 401 refresh automatically
```

---

## Quick Search Keywords

Use these to quickly find what you need:

- **Backend**: `core/backend/`, `Express`, `Prisma`, `auth.controller.ts`
- **Web**: `core/web/`, `Next.js`, `React`, `auth-context.tsx`
- **Mobile**: `mobile/`, `Flutter`, `Riverpod`, `api_client.dart`
- **Authentication**: `jwt.ts`, `auth.middleware.ts`, `auth-context.tsx`, `token_manager.dart`
- **Database**: `prisma/schema.prisma`, `db.ts`
- **API**: `routes/`, `controllers/`, `api.ts`
- **Config**: `config/index.ts`, `.env`
- **UI Components**: `components/ui/`, `skeleton.tsx`, `skeleton-composites.tsx`
- **Admin Components**: `components/admin/`, `AdminPageHeader`, `AdminFilters`
- **LMS Module**: `modules/lms/`, `course.routes.ts`, `enrollment.service.ts`, `lms.prisma`
- **E-Commerce Module**: `modules/ecommerce/`, `product.routes.ts`, `cart.service.ts`, `ecommerce.prisma`

---

## Recent Changes

<!-- Add new entries at the top -->

| Date       | Change                                                                                                                                                    | Files                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-13 | E-Commerce module: Complete implementation — 46 files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data) | `modules/ecommerce/`, `studio/backend/prisma/seed.ts`, `templates/ecommerce/config.json`                                 |
| 2026-02-12 | LMS module: DRY refactoring pass — shared formatters, auth middleware, core Rating reuse, prop bug fixes, extracted EnrollmentCard                        | `modules/lms/web/src/lib/lms/formatters.ts`, `modules/lms/backend/src/middleware/auth.ts`, multiple component/page fixes |
| 2026-02-12 | LMS module: Complete implementation — 42+ files (backend routes/services, frontend pages/components, Prisma schema, mobile placeholders, seed data)       | `modules/lms/`, `studio/backend/prisma/seed.ts`, `templates/lms/config.json`                                             |
| 2026-02-12 | Studio: Admin generation page, pricing management (bundles/history/recommendations), enhanced analytics (geo/PDF), PriceHistory model, enhanced seed data | `studio/backend/src/routes/admin/`, `studio/web/src/app/(admin)/admin/`, `studio/backend/prisma/`                        |
| 2026-02-11 | Studio code generator service, preview sessions, cleanup jobs                                                                                             | `studio/backend/src/services/generator.service.ts`, `studio/backend/src/jobs/`                                           |
| 2026-02-11 | Documentation updates: Studio web/backend CLAUDE.md files                                                                                                 | `studio/CLAUDE.md`, `studio/web/CLAUDE.md`, `studio/backend/CLAUDE.md`                                                   |
| 2026-02-10 | Studio MVP: Admin auth, API integration, toast notifications, validation, mobile responsive, a11y                                                         | `studio/backend/src/routes/`, `studio/web/src/app/(admin)/`, `studio/web/src/lib/`                                       |
| 2026-02-10 | Studio bug fixes: Route ordering, Stripe refunds, API path fixes                                                                                          | `studio/backend/src/routes/admin/`, `studio/backend/src/services/stripe.service.ts`                                      |
| 2026-02-09 | Documentation updates, ESLint configuration, skeleton composites                                                                                          | `CLAUDE.md`, `eslint.config.mjs`, `skeleton-composites.tsx`                                                              |
| 2026-02-08 | Admin platform expansion with FAQ, Announcements, Settings, Content, Coupons, Orders modules                                                              | `backend/src/routes/*.routes.ts`, `prisma/schema.prisma`, `web/src/app/(protected)/admin/*`                              |
| 2026-02-06 | Initial documentation                                                                                                                                     | CLAUDE.md                                                                                                                |

---

## Project Overview

This is a fullstack starter template with three main applications:

1. **Backend** - Express.js + Prisma + TypeScript API server
2. **Web** - Next.js 15 + React 19 + Tailwind CSS web application
3. **Mobile** - Flutter + Riverpod + Clean Architecture mobile app

All three applications share a common authentication flow using JWT tokens with httpOnly cookies (web) and secure storage (mobile).

---

## Tech Stack Summary

| Layer                 | Technology                         |
| --------------------- | ---------------------------------- |
| **Backend Runtime**   | Node.js 20+                        |
| **Backend Framework** | Express.js 4.x                     |
| **Database**          | PostgreSQL + Prisma ORM            |
| **Web Framework**     | Next.js 15 (App Router)            |
| **Web UI**            | React 19 + Tailwind CSS v4         |
| **Mobile Framework**  | Flutter 3.2+                       |
| **Mobile State**      | Riverpod (flutter_riverpod)        |
| **Authentication**    | JWT (access + refresh tokens)      |
| **Validation**        | Zod (backend), native (web/mobile) |

---

## Project Structure

```
fullstack-starter/
├── core/
│   ├── backend/               # Express + Prisma API server
│   │   ├── src/
│   │   │   ├── config/        # Environment configuration
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── lib/           # Core utilities (db, logger)
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── routes/        # Route definitions
│   │   │   ├── services/      # Business logic
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── utils/         # Helper utilities
│   │   │   └── app.ts         # Express app entry
│   │   └── prisma/            # Database schema & migrations
│   │
│   └── web/                   # Next.js web application
│       └── src/
│           ├── app/           # App Router pages
│           │   ├── (auth)/    # Auth pages (login, register)
│           │   ├── (dashboard)/ # User dashboard
│           │   ├── (protected)/ # Protected pages (admin, profile)
│           │   ├── (public)/  # Public pages
│           │   └── settings/  # User settings
│           ├── components/    # React components
│           │   ├── ui/        # Core UI components (atomic design)
│           │   ├── admin/     # Admin-specific components
│           │   ├── feedback/  # Alerts, toasts, loading states
│           │   ├── forms/     # Form components
│           │   ├── layout/    # Page layout components
│           │   ├── shared/    # Cross-cutting components
│           │   └── providers/ # Context providers
│           └── lib/           # Utilities (api, auth-context)
│
├── mobile/                    # Flutter mobile app
│   └── lib/
│       ├── core/              # Shared utilities
│       ├── data/              # Data layer (models, datasources)
│       ├── domain/            # Domain layer (entities, repositories)
│       └── presentation/      # UI layer (screens, widgets, providers)
│
├── modules/                   # Optional feature modules
│   ├── admin-dashboard/
│   ├── analytics/
│   ├── file-upload/
│   ├── ecommerce/             # E-Commerce module
│   │   ├── backend/src/       # Routes (6), services (6), auth middleware
│   │   ├── web/src/           # Pages (12), components (13), lib (types/api/formatters)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/ecommerce.prisma # 10 models + 3 enums
│   │   └── module.json        # Module metadata
│   ├── lms/                   # Learning Management System module
│   │   ├── backend/src/       # Routes (6), services (7), auth middleware
│   │   ├── web/src/           # Pages (10), components (13), lib (types/api/formatters)
│   │   ├── mobile/lib/        # Flutter placeholders (3)
│   │   ├── prisma/lms.prisma  # 12 models + 4 enums
│   │   └── module.json        # Module metadata
│   ├── payments/
│   └── real-time/
│
├── studio/                    # Starter Studio - Configuration & Pricing Platform
│   ├── backend/               # Express API (port 3001)
│   ├── web/                   # Next.js frontend (port 3002)
│   ├── shared/                # Shared TypeScript types
│   └── CLAUDE.md              # Studio-specific documentation
│
└── CLAUDE.md                  # This file
```

---

## Quick Reference

### Backend (Express + Prisma)

| Item            | Location                                         |
| --------------- | ------------------------------------------------ |
| Entry point     | `core/backend/src/app.ts`                        |
| Config          | `core/backend/src/config/index.ts`               |
| Database schema | `core/backend/prisma/schema.prisma`              |
| Routes          | `core/backend/src/routes/`                       |
| Auth middleware | `core/backend/src/middleware/auth.middleware.ts` |

**Key Commands:**

```bash
cd core/backend
npm run dev              # Start dev server (port 8000)
npm run db:migrate:dev   # Create migration
npm run db:studio        # Open Prisma Studio
npm run build            # Production build
```

### Web (Next.js)

| Item             | Location                            |
| ---------------- | ----------------------------------- |
| Entry layout     | `core/web/src/app/layout.tsx`       |
| Homepage         | `core/web/src/app/page.tsx`         |
| Auth context     | `core/web/src/lib/auth-context.tsx` |
| API client       | `core/web/src/lib/api.ts`           |
| UI Components    | `core/web/src/components/ui/`       |
| Admin Components | `core/web/src/components/admin/`    |

**Key Commands:**

```bash
cd core/web
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

### Mobile (Flutter)

| Item          | Location                                       |
| ------------- | ---------------------------------------------- |
| Entry point   | `mobile/lib/main.dart`                         |
| App widget    | `mobile/lib/app.dart`                          |
| API constants | `mobile/lib/core/constants/api_constants.dart` |
| API client    | `mobile/lib/core/network/api_client.dart`      |
| Theme         | `mobile/lib/core/theme/`                       |

**Key Commands:**

```bash
cd mobile
flutter run                    # Run on connected device
flutter build apk              # Build Android APK
flutter pub run build_runner build --delete-conflicting-outputs  # Generate code
```

### Studio (Configuration Platform)

| Item               | Location                                           |
| ------------------ | -------------------------------------------------- |
| Backend entry      | `studio/backend/src/index.ts`                      |
| Frontend entry     | `studio/web/src/app/layout.tsx`                    |
| Configurator       | `studio/web/src/components/configurator/`          |
| Admin dashboard    | `studio/web/src/app/(admin)/admin/`                |
| Feature resolver   | `studio/web/src/lib/features/dependencies.ts`      |
| Pricing calculator | `studio/web/src/lib/pricing/calculator.ts`         |
| Code generator     | `studio/backend/src/services/generator.service.ts` |
| Shared types       | `studio/shared/types/`                             |

**Key Commands:**

```bash
cd studio
npm run dev              # Start both backend (3001) and frontend (3002)

cd studio/backend
npm run dev              # Backend only
pnpm db:migrate          # Run database migrations
pnpm db:seed             # Seed features, tiers, templates

cd studio/web
npm run dev              # Frontend only
```

**Documentation:** See detailed Studio documentation:

- [`studio/CLAUDE.md`](./studio/CLAUDE.md) - Main Studio overview
- [`studio/web/CLAUDE.md`](./studio/web/CLAUDE.md) - Frontend documentation
- [`studio/backend/CLAUDE.md`](./studio/backend/CLAUDE.md) - Backend documentation

---

## Authentication Flow

### Overview

```
1. User submits credentials (email + password)
2. Backend validates and returns JWT tokens
3. Web: Tokens stored in httpOnly cookies
4. Mobile: Tokens stored in flutter_secure_storage
5. Authenticated requests include token automatically
6. Token refresh handled transparently
```

### API Endpoints

| Endpoint                | Method | Description           |
| ----------------------- | ------ | --------------------- |
| `/api/v1/auth/register` | POST   | Create new user       |
| `/api/v1/auth/login`    | POST   | Login, returns tokens |
| `/api/v1/auth/logout`   | POST   | Clear session         |
| `/api/v1/auth/me`       | GET    | Get current user      |
| `/api/v1/auth/refresh`  | POST   | Refresh tokens        |

### Admin API Endpoints

| Base Path                        | Description                     | Auth  |
| -------------------------------- | ------------------------------- | ----- |
| `/api/v1/admin/stats`            | Dashboard statistics            | Admin |
| `/api/v1/admin/users`            | User management (CRUD, export)  | Admin |
| `/api/v1/admin/audit-logs`       | Audit log viewing and export    | Admin |
| `/api/v1/admin/contact-messages` | Contact message management      | Admin |
| `/api/v1/admin/orders`           | Order management and stats      | Admin |
| `/api/v1/faqs`                   | FAQ management (public + admin) | Mixed |
| `/api/v1/announcements`          | Announcement management         | Mixed |
| `/api/v1/settings`               | Application settings            | Mixed |
| `/api/v1/content`                | CMS content pages               | Mixed |
| `/api/v1/coupons`                | Coupon/discount management      | Mixed |
| `/api/v1/notifications`          | User notification system        | Auth  |

### Request/Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Environment Variables

### Backend (`backend/.env`)

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secure-secret-min-32-chars

# Optional
NODE_ENV=development
PORT=8000
CORS_ORIGIN=http://localhost:3000
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Web (`web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Mobile (via dart-define)

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:8000/api/v1
```

---

## Database Schema (Prisma)

### Core Models

| Model                    | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `User`                   | Core user with auth, OAuth, session management, account lockout   |
| `Session`                | Multi-device session management with device info                  |
| `PasswordResetToken`     | Password reset flow tokens                                        |
| `EmailVerificationToken` | Email verification tokens                                         |
| `AuditLog`               | Action tracking with entity, changes, IP, user agent              |
| `Notification`           | In-app user notifications (info, success, warning, error, system) |

### Admin/CMS Models

| Model            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `FaqCategory`    | FAQ category organization with slug and ordering          |
| `Faq`            | FAQ items with category, question, answer, ordering       |
| `Announcement`   | System announcements/banners with scheduling              |
| `Setting`        | Key-value app settings (string, number, boolean, json)    |
| `ContentPage`    | Static CMS pages with SEO metadata                        |
| `Coupon`         | Discount codes (percentage/fixed, usage limits, validity) |
| `Order`          | Order/purchase tracking with items, payment, status       |
| `ContactMessage` | Contact form submissions with status tracking             |

### Enums

| Enum                   | Values                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `UserRole`             | USER, ADMIN                                                                                                            |
| `AuditAction`          | CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, PASSWORD_RESET, EMAIL_VERIFY, ADMIN_ACTION |
| `NotificationType`     | INFO, SUCCESS, WARNING, ERROR, SYSTEM                                                                                  |
| `AnnouncementType`     | INFO, WARNING, SUCCESS, PROMO                                                                                          |
| `SettingType`          | STRING, NUMBER, BOOLEAN, JSON                                                                                          |
| `DiscountType`         | PERCENTAGE, FIXED                                                                                                      |
| `OrderStatus`          | PENDING, COMPLETED, REFUNDED, FAILED                                                                                   |
| `PaymentMethod`        | STRIPE, PAYPAL, MANUAL                                                                                                 |
| `ContactMessageStatus` | PENDING, READ, REPLIED                                                                                                 |

---

## Common Patterns

### Module Page Pattern (Correct Way)

Every module page should look like this — composing core components, never recreating them:

```tsx
// modules/<module>/web/src/app/<page>/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
// 1. Core UI components — ALWAYS import from core
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Rating } from "@/components/ui/rating";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert } from "@/components/feedback/alert";

// 2. Domain-specific imports — from the module's own lib
import { moduleApi } from "@/lib/<module>/api";
import { formatPrice } from "@/lib/<module>/formatters";
import type { ModuleType } from "@/lib/<module>/types";

// 3. Domain components — composed from core UI
import ModuleDomainComponent from "@/components/<module>/domain-component";
```

### Anti-Patterns (NEVER Do This)

```tsx
// BAD: Custom button with inline styles
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</button>

// GOOD: Core Button with isLoading
<Button isLoading={loading}>Save</Button>
```

```tsx
// BAD: Custom star rating with SVGs
{
  Array.from({ length: 5 }).map((_, i) => (
    <svg key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
      ...
    </svg>
  ));
}

// GOOD: Core Rating
<Rating value={rating} readOnly size="sm" />;
```

```tsx
// BAD: Custom pagination with prev/next buttons
<button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
<span>Page {page} of {totalPages}</span>
<button onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>

// GOOD: Core Pagination
<Pagination page={page} totalPages={totalPages} onPageChange={setPage} showItemCount />
```

```tsx
// BAD: Custom search with useEffect debounce
const [search, setSearch] = useState('');
useEffect(() => { const timer = setTimeout(() => fetchData(search), 300); return () => clearTimeout(timer); }, [search]);
<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />

// GOOD: Core SearchInput
<SearchInput debounceDelay={400} onSearch={setSearch} placeholder="Search..." />
```

```tsx
// BAD: Custom loading/error handling
{
  loading && (
    <div className="flex justify-center">
      <p>Loading...</p>
    </div>
  );
}
{
  error && (
    <div className="bg-red-50 border border-red-200 p-4">
      <p className="text-red-600">{error}</p>
    </div>
  );
}

// GOOD: Core LoadingWrapper
<LoadingWrapper isLoading={loading} error={error} onRetry={fetchData}>
  {children}
</LoadingWrapper>;
```

```tsx
// BAD: Hardcoded colors
<div className="bg-white border-gray-200 text-gray-900">

// GOOD: Design system variables
<div className="bg-card border-border text-foreground">
```

### Backend: Adding New Endpoints

1. Create route file (`src/routes/example.routes.ts`):

```typescript
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", (req, res) => { ... });
router.post("/", authMiddleware, (req, res) => { ... });

export default router;
```

2. Register in `src/routes/index.ts`:

```typescript
import exampleRoutes from "./example.routes";
v1Router.use("/examples", exampleRoutes);
```

### Mobile: Adding New Features

1. Create provider in `lib/presentation/providers/`
2. Create screen in `lib/presentation/screens/`
3. Add route (when using go_router)
4. Use `ConsumerWidget` to access providers

---

## Common Issues & Solutions

| Issue               | Cause                  | Solution                              |
| ------------------- | ---------------------- | ------------------------------------- |
| CORS errors         | Origin not whitelisted | Add to `CORS_ORIGIN` in backend       |
| 401 Unauthorized    | Token expired          | Refresh token or re-login             |
| Database connection | Invalid URL            | Check `DATABASE_URL` format           |
| Mobile API fails    | Wrong localhost        | Use `10.0.2.2` for Android emulator   |
| JWT validation      | Missing secret         | Set `JWT_SECRET` environment variable |

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Web
cd web && npm run dev

# Terminal 3: Mobile (optional)
cd mobile && flutter run
```

### Database Changes

```bash
cd backend
npm run db:migrate:dev    # Create migration from schema changes
npm run db:push           # Push schema without migration (dev only)
npm run db:studio         # Visual database browser
```

---

## Spacing Conventions

Consistent spacing improves readability and maintainability:

| Context              | Preferred          | Avoid                           |
| -------------------- | ------------------ | ------------------------------- |
| Vertical stacking    | `space-y-4`        | Manual margins on each element  |
| Flex gaps            | `gap-4`            | Margins between flex children   |
| Grid gaps            | `gap-4` or `gap-6` | Margins between grid items      |
| Form fields          | `space-y-4`        | Individual `mb-4` on each field |
| Card content padding | `p-4` or `p-6`     | Inconsistent paddings           |

---

## Reusable Skeleton Components

Use these for consistent loading states across admin pages:

| Component                   | Location                                    | Purpose                                |
| --------------------------- | ------------------------------------------- | -------------------------------------- |
| `SkeletonAdminPage`         | `components/shared/skeleton-composites.tsx` | Admin page with header, filters, table |
| `SkeletonSettingsPage`      | `components/shared/skeleton-composites.tsx` | Settings page with form sections       |
| `SkeletonDashboardEnhanced` | `components/shared/skeleton-composites.tsx` | Dashboard with stats, charts, sidebar  |
| `SkeletonFormEnhanced`      | `components/shared/skeleton-composites.tsx` | Form with configurable layout          |

**Usage Example:**

```tsx
// loading.tsx for admin pages
import { SkeletonAdminPage } from "@/components/shared/skeleton-composites";

export default function Loading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-40"
      headerActions={1}
      filterCount={3}
      tableRows={8}
      tableColumns={5}
    />
  );
}
```

---

## Admin Components

Shared components for admin pages:

| Component             | Location            | Purpose                                         |
| --------------------- | ------------------- | ----------------------------------------------- |
| `AdminPageHeader`     | `components/admin/` | Page title, description, export button, actions |
| `AdminFilters`        | `components/admin/` | Search and filter inputs                        |
| `AdminTableContainer` | `components/admin/` | Table wrapper with loading/empty states         |
| `AdminPagination`     | `components/admin/` | Pagination controls                             |

---

## Template Implementation Roadmap

Each template needs: seed data (module + features), `config.json`, and a `modules/<name>/` directory with backend/frontend/mobile code. All templates reuse core components and generic features (`auth.*`, `payments.*`, `ui.*`, `analytics.*`, etc.) — only domain-specific code goes in each module.

### Template Status

| #   | Template            | Seed Data        | config.json    | Domain Features           | Module Code                           | Status             |
| --- | ------------------- | ---------------- | -------------- | ------------------------- | ------------------------------------- | ------------------ |
| 1   | **SaaS Starter**    | Yes              | Yes            | None (core-only)          | N/A                                   | **Done**           |
| 2   | **LMS**             | Yes (6 features) | Yes            | `lms.*` (6)               | `modules/lms/` (43 files)             | **Done**           |
| 3   | **Admin Dashboard** | Yes              | No (seed only) | None (`admin.*` generic)  | `modules/admin-dashboard/` (14 files) | **Done** (generic) |
| 4   | **Mobile App Kit**  | Yes              | No (seed only) | None (`mobile.*` generic) | N/A (core mobile)                     | **Done** (generic) |
| 5   | **E-commerce**      | Yes (6 features) | Yes            | `ecommerce.*` (6)         | `modules/ecommerce/` (46 files)       | **Done**           |
| 6   | **Booking**         | No               | Empty dir      | Needs `booking.*`         | Needs `modules/booking/`              | **Not Started**    |
| 7   | **Helpdesk**        | No               | Empty dir      | Needs `helpdesk.*`        | Needs `modules/helpdesk/`             | **Not Started**    |
| 8   | **Invoicing**       | No               | Empty dir      | Needs `invoicing.*`       | Needs `modules/invoicing/`            | **Not Started**    |
| 9   | **Events**          | No               | Empty dir      | Needs `events.*`          | Needs `modules/events/`               | **Not Started**    |
| 10  | **Tasks**           | No               | Empty dir      | Needs `tasks.*`           | Needs `modules/tasks/`                | **Not Started**    |

### Existing Generic Modules (shared across templates)

| Module               | Files | Provides Features | Used By                             |
| -------------------- | ----- | ----------------- | ----------------------------------- |
| `admin-dashboard`    | 14    | `admin.*`         | Admin Dashboard, SaaS Starter       |
| `analytics`          | 9     | `analytics.*`     | All templates                       |
| `file-upload`        | 9     | `storage.*`       | E-commerce, LMS, Booking            |
| `payments`           | 8     | `payments.*`      | E-commerce, LMS, Booking, Invoicing |
| `real-time`          | 8     | `comms.websocket` | Helpdesk, Events                    |
| `push-notifications` | 6     | `comms.push`      | Mobile App Kit, LMS                 |
| `audit-log`          | 6     | `security.audit`  | Admin Dashboard, SaaS Starter       |
| `email`              | 5     | `comms.email`     | All templates                       |
| `social-auth`        | 4     | `auth.social`     | SaaS Starter, E-commerce, LMS       |

### Per-Template Work Scope

Each remaining template needs:

1. **Seed data** — Module entry + domain features with `fileMappings`, `schemaMappings`, `envVars`, `npmPackages`
2. **`config.json`** — Template definition with `includedFeatures` (generic + domain)
3. **`module.json`** — Module metadata
4. **Prisma schema** — Domain models + enums
5. **Backend** — Routes + services (reuse shared auth middleware pattern from LMS)
6. **Frontend lib** — `types.ts`, `api.ts`, `formatters.ts` (domain-specific only)
7. **Frontend components** — Domain components that COMPOSE core UI (see Component Registry above)
8. **Frontend pages** — Import core UI + domain components. NEVER write raw `<button>`, `<input>`, `<table>`, etc.
9. **Mobile** — Flutter placeholders
10. **Verification checklist**:
    - `grep -r '<button' modules/<name>/web/` returns 0 results (except checkbox tiles)
    - `grep -r '<input' modules/<name>/web/` returns 0 results (except checkbox tiles)
    - `grep -r '<table\|<thead\|<tbody' modules/<name>/web/` returns 0 results
    - `grep -r '<select' modules/<name>/web/` returns 0 results
    - All imports come from `@/components/ui/*`, `@/components/feedback/*`, `@/components/layout/*`, `@/components/forms/*`, or `@/components/shared/*`
    - No hardcoded colors (no `text-gray-900`, `bg-white` — use `text-foreground`, `bg-card`)

---

## Detailed Documentation

For detailed documentation of each application, see:

- **Backend**: [`core/backend/CLAUDE.md`](./core/backend/CLAUDE.md)
- **Web**: [`core/web/CLAUDE.md`](./core/web/CLAUDE.md)
- **Mobile**: [`mobile/CLAUDE.md`](./mobile/CLAUDE.md)

---

_This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase._
