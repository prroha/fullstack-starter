Build a new module: $ARGUMENTS

## Instructions

You are building a new domain module for this fullstack starter. Follow these steps EXACTLY:

### Step 1: Plan (use EnterPlanMode)

- Read the root CLAUDE.md — especially MANDATORY RULES and Component Registry
- Study `modules/lms/` as the reference implementation (same structure)
- Design: Prisma schema, backend routes/services, frontend pages/components
- In the plan, list which core components each page will import
- Get user approval before writing code

### Step 2: Config + Schema

- `modules/<name>/module.json`
- `modules/<name>/prisma/<name>.prisma`

### Step 3: Backend

- `modules/<name>/backend/src/middleware/auth.ts` (copy LMS pattern)
- Services: one per domain entity
- Routes: one per domain area
- Use `successResponse`, `paginatedResponse`, `ApiError` from core

### Step 4: Frontend Lib

- `types.ts` — domain interfaces only
- `api.ts` — domain API client only
- `formatters.ts` — domain formatters only

### Step 5: Frontend Components + Pages

CRITICAL RULES:

- Import ALL UI from core: `@/components/ui/*`, `@/components/feedback/*`, `@/components/layout/*`
- NEVER write raw `<button>`, `<input>`, `<textarea>`, `<select>`, `<table>`, `<label>`
- Use `Button isLoading` not custom spinners
- Use `LoadingWrapper` or `AsyncContent` for loading/error states
- Use design system colors (`text-foreground`, `bg-card`) not hardcoded (`text-gray-900`, `bg-white`)
- Use core hooks: `useDebounce`, `useAsync`, `useToggle`

### Step 6: Mobile Stubs

- Flutter placeholder files

### Step 7: Seed Data

- Module entry in `studio/backend/prisma/seed.ts`
- Feature entries with `fileMappings`
- Update template `config.json`

### Step 8: Verify

Run these checks — ALL must pass:

```bash
grep -r '<button' modules/<name>/web/src/  # Must return 0 results
grep -r '<input' modules/<name>/web/src/   # Must return 0 results (except checkbox tiles)
grep -r '<table\|<thead\|<tbody' modules/<name>/web/src/  # Must return 0
grep -r '<select' modules/<name>/web/src/  # Must return 0
grep -r '<textarea' modules/<name>/web/src/  # Must return 0
grep -r 'text-gray-\|bg-white\|border-gray-' modules/<name>/web/src/  # Should be minimal
```
