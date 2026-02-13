Fix this issue: $ARGUMENTS

## Instructions

You are fixing a bug or resolving an error. Follow this workflow:

### Step 1: Understand

- Read the error message / screenshot / description carefully
- Read the file(s) involved — NEVER guess at code you haven't read
- Trace the root cause — don't just fix symptoms

### Step 2: Check context

- Is this a frontend issue? Check if the file uses core components correctly (see Component Registry in CLAUDE.md)
- Is this a backend issue? Check if it uses `ApiError`, `successResponse`, `paginatedResponse` correctly
- Is this a type mismatch? Check the domain `types.ts` and the API response shape
- Is this a prop mismatch? Check the core component's actual props (see Component Registry)

### Step 3: Fix with standards

When fixing, follow ALL rules from CLAUDE.md:

- If the fix involves UI — use core components, not raw HTML
- If the fix involves loading/error states — use `LoadingWrapper`, `Alert`, `Spinner`
- If the fix involves backend responses — use `successResponse`, `paginatedResponse`, `ApiError`
- If the fix introduces new utility code that's generic — put it in core (see Rule 6 in CLAUDE.md)
- Use design system colors (`text-foreground`, `bg-card`) not hardcoded colors

### Step 4: Don't spread the damage

- Fix the root cause, not symptoms in multiple places
- Don't refactor surrounding code unless directly related to the bug
- Don't add features while fixing bugs
- If you find other bugs while fixing, mention them but fix only what was asked

### Step 5: Verify

- Confirm the fix addresses the original issue
- Check that no new raw HTML or anti-patterns were introduced
- If tests exist, ensure they pass
