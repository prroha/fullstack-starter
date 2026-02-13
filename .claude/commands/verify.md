Run quality verification on: $ARGUMENTS

## Instructions

Run ALL of these checks on the specified path (defaults to entire codebase if no path given).

### 1. Raw HTML Check (Frontend)

```bash
grep -rn '<button\s' <path>/web/src/
grep -rn '<input\s' <path>/web/src/
grep -rn '<textarea' <path>/web/src/
grep -rn '<select' <path>/web/src/
grep -rn '<table\|<thead\|<tbody\|<tr \|<th \|<td ' <path>/web/src/
grep -rn '<label' <path>/web/src/
```

**Expected**: 0 results (except `<label>` wrapping checkbox tiles).
**Fix**: Replace with core components from Component Registry in CLAUDE.md.

### 2. Hardcoded Colors Check

```bash
grep -rn 'text-gray-\|text-red-\|text-blue-\|text-green-\|bg-white\|bg-gray-\|border-gray-' <path>/web/src/
```

**Expected**: Minimal results. Use `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-background`, `border-border`, etc.

### 3. Custom Loading Spinners

```bash
grep -rn 'animate-spin\|Loading\.\.\.' <path>/web/src/
```

**Expected**: 0 results. Use `Spinner`, `LoadingWrapper`, or `Button isLoading`.

### 4. Manual Debounce

```bash
grep -rn 'setTimeout.*search\|setTimeout.*filter\|clearTimeout' <path>/web/src/
```

**Expected**: 0 results. Use `useDebounce` hook or `SearchInput` component.

### 5. Backend Response Patterns

```bash
grep -rn 'res.json({' <path>/backend/src/
grep -rn 'res.status.*json' <path>/backend/src/
```

**Expected**: All should use `successResponse`, `paginatedResponse`, or `ApiError`.

### 6. Unused Imports

```bash
# Run TypeScript compiler check if available
npx tsc --noEmit 2>&1 | head -50
```

### Report

After running all checks, report:

- Total violations found per category
- List each violation with file:line
- Provide fixes for each
