Update existing code: $ARGUMENTS

## Instructions

You are adding a feature, modifying behavior, or enhancing existing code. Follow this workflow:

### Step 1: Read first

- Read the file(s) you're modifying — understand existing patterns
- Read the module's `types.ts`, `api.ts`, `formatters.ts` if frontend
- Read the module's services/routes if backend
- Check what core components and hooks are already imported

### Step 2: Plan the change

- If the change is non-trivial (touches 3+ files), use EnterPlanMode
- Identify if new API endpoints, types, or components are needed
- Check the Component Registry in CLAUDE.md — does a core component already solve this?

### Step 3: Implement with standards

Follow ALL rules from CLAUDE.md:

**Frontend changes:**

- Import UI from core — NEVER write raw `<button>`, `<input>`, `<table>`, etc.
- Use existing hooks (`useDebounce`, `useAsync`, `useToggle`) before writing custom state logic
- Use `LoadingWrapper`/`AsyncContent` for new data-fetching sections
- Use design system CSS variables, not hardcoded colors
- If adding a new component, decide: is it domain-specific or generic? (see Step 4)

**Backend changes:**

- Use `successResponse`, `paginatedResponse`, `ApiError` from core
- Use Zod for any new input validation
- Follow singleton service pattern
- Add to existing route file if the endpoint fits, or create new route file if it's a new domain area

### Step 4: Promote to core when appropriate

If your change creates something GENERIC (useful across modules), put it in core:

**Promote to `core/web/src/components/ui/`** if:

- It's a UI pattern not tied to any specific domain
- Multiple modules could use it
- Examples: PriceDisplay, DateRangeSelector, FileUploadZone, StepWizard

**Promote to `core/web/src/lib/hooks/`** if:

- It's a hook not tied to any specific domain
- Examples: useInfiniteScroll, usePagination, useFormState

**Promote to `core/web/src/lib/`** if:

- It's a utility function useful across modules
- Examples: formatCurrency, formatRelativeTime, slugify

**Promote to `core/backend/src/utils/`** or `core/backend/src/middleware/`\*\* if:

- It's backend utility or middleware useful across modules
- Examples: validatePagination, cacheMiddleware

After promoting: update the registry in root CLAUDE.md so future sessions know about it.

### Step 5: Verify

- Run the relevant verification checks from `/verify`
- Ensure no raw HTML, hardcoded colors, or anti-patterns were introduced
