# Web Frontend & UI Cheatsheet

> Clean, Maintainable, Robust, Performant & User-Friendly UI (2025–2026 Edition)

---

## 1. Foundations & Structure

### Semantic HTML
- [ ] Use HTML5 semantic elements (`<header>`, `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<footer>`)
- [ ] `<button>` for actions, `<a>` for navigation (never `<div onClick>`)
- [ ] Proper heading hierarchy (one `<h1>`, logical `h2`→`h6` nesting)
- [ ] `<form>` for forms, `<label>` for inputs
- [ ] Validate HTML (no warnings in [W3C Validator](https://validator.w3.org/))

### Project Structure
```
src/
├── components/          # Shared/reusable components
│   ├── ui/             # Primitives (Button, Input, Modal)
│   └── common/         # Composed components (Header, Footer)
├── features/           # Feature-based modules
│   ├── auth/
│   ├── dashboard/
│   └── settings/
├── hooks/              # Custom hooks
├── lib/                # Utilities, API client, helpers
├── styles/             # Global styles, tokens
└── pages/ or app/      # Routes (framework-specific)
```

- [ ] Organize by feature/domain, not by type
- [ ] Co-locate tests, styles, and types with components
- [ ] Use barrel exports (`index.ts`) sparingly (tree-shaking issues)
- [ ] Component-driven development with Storybook

---

## 2. Design System & Styling

### Design Tokens (Define Early!)
```css
/* Example token structure */
:root {
  /* Colors */
  --color-primary-500: #3b82f6;
  --color-neutral-100: #f5f5f5;

  /* Spacing (8px base) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --line-height-normal: 1.5;

  /* Shadows, radii, transitions... */
}
```

### Styling Approach
| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| **Tailwind CSS** | Rapid development, consistency | Fast, low CSS bloat, design constraints | Learning curve, verbose markup |
| **CSS Modules** | Component isolation | True scoping, standard CSS | More files, no sharing |
| **CSS-in-JS** (styled-components) | Dynamic styling | Co-location, theming | Runtime cost, SSR complexity |
| **Vanilla CSS + BEM** | Simple projects | No tooling, universal | Manual scoping, verbose |

### Checklist
- [ ] Design tokens for colors, spacing, typography, shadows, radii
- [ ] Consistent spacing scale (4px or 8px base)
- [ ] Typography scale with `rem`/`em` units (not `px` for font-size)
- [ ] Dark mode via `prefers-color-scheme` + manual toggle
- [ ] Mobile-first media queries (`min-width`, not `max-width`)
- [ ] CSS custom properties for theming
- [ ] No magic values in styles – use tokens

---

## 3. Component Best Practices

### Component Hierarchy (Atomic Design)
```
Atoms       → Button, Input, Icon, Badge
Molecules   → SearchInput, FormField, Card
Organisms   → Header, Sidebar, ProductList
Templates   → PageLayout, DashboardLayout
Pages       → HomePage, SettingsPage
```

### Principles
- [ ] Single responsibility – one component, one job
- [ ] Props for configuration, composition for structure
- [ ] Controlled components for forms (value + onChange)
- [ ] Render props or compound components for flexibility
- [ ] Avoid prop drilling beyond 2-3 levels → use context

### TypeScript for Components
```tsx
// Good: Explicit, documented props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Extend native elements when wrapping
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
```

- [ ] TypeScript strict mode enabled
- [ ] Props interface for every component
- [ ] Discriminated unions for variant props
- [ ] `React.forwardRef` for components wrapping native elements
- [ ] Default props via destructuring, not `defaultProps`

---

## 4. Forms & User Input

### Form Libraries
| Library | Best For |
|---------|----------|
| **React Hook Form** | Performance, minimal re-renders |
| **Formik** | Feature-rich, larger forms |
| **Native HTML** | Simple forms, progressive enhancement |

### Validation
```tsx
// Zod schema example
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});
```

### UX Patterns
- [ ] Inline validation (on blur, not on every keystroke)
- [ ] Clear error messages next to the field
- [ ] Disable submit button while submitting (show loading)
- [ ] Preserve form data on error (don't clear fields)
- [ ] Autofocus first field or first error
- [ ] Support browser autofill (`autocomplete` attributes)
- [ ] Input masks for phone, credit card, dates
- [ ] Character counters for limited fields

### Accessibility
- [ ] Labels associated with inputs (`htmlFor` / wrapping)
- [ ] Required fields marked (`aria-required`, visual indicator)
- [ ] Error messages linked (`aria-describedby`)
- [ ] `aria-invalid="true"` on invalid fields
- [ ] Error summary at top for long forms

---

## 5. Loading, Empty & Error States

### The Three States Every View Needs
```tsx
function UserList() {
  const { data, isLoading, error } = useUsers();

  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorState retry={refetch} />;
  if (data.length === 0) return <EmptyState action={<CreateUserButton />} />;

  return <UserTable users={data} />;
}
```

### Loading States
- [ ] Skeleton screens over spinners (less jarring)
- [ ] Match skeleton to actual content layout
- [ ] Show spinner only after 200-300ms delay (avoid flash)
- [ ] Loading indicators for buttons (`isLoading` prop)
- [ ] Progress indicators for long operations
- [ ] Optimistic UI for instant feedback

### Error States
- [ ] User-friendly error messages (not technical jargon)
- [ ] Retry button for recoverable errors
- [ ] Fallback UI via Error Boundaries
- [ ] Log errors to monitoring (Sentry)
- [ ] Different treatment: network vs validation vs server errors

### Empty States
- [ ] Explain what would be here
- [ ] Provide action to create/add content
- [ ] Use illustrations to make it feel intentional
- [ ] Don't just show blank space

---

## 6. Performance (Core Web Vitals)

### Targets
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

### Code Optimization
- [ ] Route-based code splitting (`React.lazy`, dynamic imports)
- [ ] Lazy load below-fold components
- [ ] Tree shaking enabled (ES modules, sideEffects: false)
- [ ] Bundle analysis in CI (fail if bundle > budget)
- [ ] Remove unused dependencies

### Image Optimization
- [ ] Modern formats (WebP, AVIF with fallbacks)
- [ ] Responsive images (`srcset`, `sizes`)
- [ ] Lazy loading (`loading="lazy"`)
- [ ] Explicit `width` and `height` (prevent CLS)
- [ ] Use `<Image>` component (Next.js) or image CDN
- [ ] Blur placeholder or dominant color while loading

### Font Optimization
- [ ] `font-display: swap` (prevent invisible text)
- [ ] Subset fonts (only needed characters)
- [ ] Preload critical fonts
- [ ] Self-host or use system font stack
- [ ] Limit font variations (2-3 weights max)

### Rendering Performance
- [ ] Memoization where measured benefit exists
- [ ] Virtualize long lists (react-window, TanStack Virtual)
- [ ] Debounce/throttle expensive handlers
- [ ] `useTransition` for non-urgent updates
- [ ] Avoid layout thrashing (batch DOM reads/writes)

### Caching
- [ ] HTTP cache headers for static assets
- [ ] Service worker for offline/repeat visits
- [ ] React Query / SWR for server state caching
- [ ] `stale-while-revalidate` patterns

---

## 7. Accessibility (a11y) – Non-Negotiable

### WCAG 2.1 AA Minimum
| Requirement | Guideline |
|-------------|-----------|
| Color contrast | 4.5:1 text, 3:1 large text/UI |
| Touch targets | ≥ 44x44px on mobile |
| Focus visible | Clear focus indicator on all interactive elements |
| Text scaling | Works up to 200% zoom |
| Motion | Respect `prefers-reduced-motion` |

### Checklist
- [ ] Semantic HTML first, ARIA only when needed
- [ ] Logical focus order (no `tabindex` > 0)
- [ ] Visible focus indicators (don't remove `:focus` outline)
- [ ] Skip link to main content
- [ ] Alt text: descriptive or `alt=""` for decorative
- [ ] Color is not the only indicator
- [ ] Links have descriptive text (not "click here")
- [ ] Modals trap focus, Escape closes
- [ ] Live regions for dynamic content (`aria-live`)
- [ ] Reduced motion alternative for animations

### Testing
- [ ] Keyboard-only navigation test
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Automated: `eslint-plugin-jsx-a11y`, axe DevTools
- [ ] Lighthouse accessibility audit
- [ ] Manual testing with real users

---

## 8. State Management

### Decision Tree
```
Is it server data?
  → Yes: React Query / SWR / TanStack Query

Is it shared across many components?
  → No: useState / useReducer (local)
  → Yes: Context (small), Zustand/Jotai (medium), Redux (large/complex)

Is it URL state (filters, pagination)?
  → Yes: URL search params (nuqs, next/navigation)
```

### Best Practices
- [ ] Server state ≠ client state (use appropriate tools)
- [ ] Colocate state as low as possible
- [ ] Derive state instead of syncing
- [ ] Immutable updates (spread, immer)
- [ ] Persist critical state (localStorage, URL)
- [ ] Optimistic updates for better UX

### Server State (React Query Example)
```tsx
// Good: Caching, refetching, loading/error states handled
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => fetchUsers(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries(['users']);
    const previous = queryClient.getQueryData(['users']);
    queryClient.setQueryData(['users'], (old) => /* optimistic update */);
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['users'], context.previous);
  },
});
```

---

## 9. Animations & Micro-interactions

### Performance Rules
- [ ] Animate only `transform` and `opacity` (GPU-accelerated)
- [ ] Use `will-change` sparingly (not on everything)
- [ ] Prefer CSS transitions/animations over JS
- [ ] 60fps target (16ms per frame)
- [ ] Disable animations with `prefers-reduced-motion`

### Libraries
| Library | Best For |
|---------|----------|
| **CSS Transitions** | Simple state changes |
| **Framer Motion** | Complex React animations |
| **GSAP** | Timeline-based, scroll animations |
| **Lottie** | After Effects animations |

### Where to Use
- [ ] Page transitions (subtle, fast)
- [ ] Loading states (skeleton pulse, spinner)
- [ ] Micro-feedback (button press, success checkmark)
- [ ] Attention (notification badge, toast entrance)
- [ ] Progressive disclosure (accordion, dropdown)

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Rendering Strategies (Modern Frameworks)

### Next.js App Router
| Pattern | Use When |
|---------|----------|
| **Server Components** (default) | Static content, data fetching, no interactivity |
| **Client Components** (`'use client'`) | Hooks, event handlers, browser APIs |
| **SSG** (generateStaticParams) | Content known at build time |
| **ISR** (revalidate) | Content changes occasionally |
| **SSR** (no cache) | Personalized, real-time data |
| **Streaming** (Suspense) | Progressive loading |

### Best Practices
- [ ] Default to Server Components, opt into Client
- [ ] Keep client components small and leaf-level
- [ ] Fetch data in Server Components (no waterfalls)
- [ ] Use Suspense boundaries for streaming
- [ ] Server Actions for mutations
- [ ] Parallel data fetching where possible

---

## 11. Internationalization (i18n)

### Setup Early (Expensive to Retrofit!)
- [ ] Extract all user-facing strings to translation files
- [ ] Use ICU message format for plurals, gender, etc.
- [ ] Never concatenate translated strings
- [ ] Support RTL layout (`dir="rtl"`)
- [ ] Format dates/times/numbers with Intl API
- [ ] Allow for text expansion (30% for German)
- [ ] Language switcher with persistence

### Libraries
| Library | Framework |
|---------|-----------|
| **next-intl** | Next.js |
| **react-i18next** | React |
| **vue-i18n** | Vue |
| **FormatJS** | Any |

---

## 12. Mobile & Touch

### Touch Targets
- [ ] Minimum 44x44px touch targets (48px preferred)
- [ ] Adequate spacing between targets
- [ ] Touch feedback (`:active` state)

### Mobile UX
- [ ] Thumb-friendly placement (bottom navigation, FABs)
- [ ] Swipe gestures for common actions
- [ ] Pull-to-refresh where expected
- [ ] Avoid hover-dependent UI
- [ ] Responsive images and typography
- [ ] Viewport meta tag configured

### Viewport
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Testing
- [ ] Test on real devices (not just DevTools)
- [ ] Test on slow 3G/4G networks
- [ ] Test with different text sizes (accessibility settings)
- [ ] Test with screen readers (TalkBack, VoiceOver)

---

## 13. Security in Frontend

### XSS Prevention
- [ ] Never use `dangerouslySetInnerHTML` with user input
- [ ] Sanitize HTML if you must render it (DOMPurify)
- [ ] Use framework escaping (React auto-escapes)
- [ ] Content Security Policy headers

### Data Handling
- [ ] Never store sensitive data in localStorage
- [ ] Use httpOnly cookies for tokens
- [ ] Validate on client AND server
- [ ] HTTPS only in production

### Dependencies
- [ ] Audit dependencies (`npm audit`)
- [ ] Use lockfile
- [ ] Minimize third-party scripts
- [ ] Subresource Integrity (SRI) for CDN scripts

---

## 14. Testing & Quality

### Testing Pyramid
```
         ╱╲
        ╱  ╲      E2E (few, critical paths)
       ╱────╲
      ╱      ╲    Integration (component + API)
     ╱────────╲
    ╱          ╲  Unit (utils, hooks, logic)
   ╱────────────╲
```

### Component Testing
```tsx
// Testing Library: Test behavior, not implementation
test('shows error when email is invalid', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText(/email/i), 'invalid');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

### Checklist
- [ ] Unit tests for utilities, hooks, business logic
- [ ] Component tests with Testing Library (user-centric)
- [ ] Visual regression (Chromatic, Percy)
- [ ] E2E for critical flows (Playwright)
- [ ] Accessibility tests in CI (axe-core)
- [ ] Lighthouse CI for performance/a11y budgets

---

## 15. Tooling & Developer Experience

### Essential Setup
```json
// package.json scripts
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "lint": "next lint && tsc --noEmit",
  "format": "prettier --write .",
  "test": "vitest",
  "storybook": "storybook dev"
}
```

### Toolchain
| Tool | Purpose |
|------|---------|
| **Vite / Turbopack** | Fast dev server & builds |
| **TypeScript** | Type safety |
| **ESLint** | Code quality |
| **Prettier** | Code formatting |
| **Husky + lint-staged** | Pre-commit hooks |
| **Storybook** | Component development & docs |
| **Chromatic** | Visual testing |

### CI Checks
- [ ] Lint + type check
- [ ] Unit + component tests
- [ ] Build succeeds
- [ ] Bundle size within budget
- [ ] Lighthouse scores above threshold
- [ ] Accessibility audit passes

---

## Pre-Launch Checklist

### Performance
- [ ] Lighthouse Performance ≥ 90
- [ ] Core Web Vitals passing
- [ ] Bundle size within budget
- [ ] Images optimized and lazy-loaded
- [ ] Fonts don't cause FOUT/FOIT
- [ ] Tested on slow network (3G)
- [ ] Tested on low-end device

### Accessibility
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast passes
- [ ] Focus indicators visible
- [ ] Reduced motion respected

### Responsive & Cross-Browser
- [ ] Mobile-first responsive
- [ ] Tested on real devices
- [ ] Works in target browsers
- [ ] Touch targets adequate

### Quality
- [ ] No console errors/warnings
- [ ] Error boundaries in place
- [ ] Loading states for async
- [ ] Empty states designed
- [ ] 404 page exists
- [ ] Favicon and meta tags set

### Design Consistency
- [ ] Design tokens used consistently
- [ ] Dark mode works
- [ ] Typography scale followed
- [ ] Spacing system followed

---

## Resources

### Performance
- [web.dev](https://web.dev/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)

### Design Systems
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible primitives
- [shadcn/ui](https://ui.shadcn.com/) - Copy-paste components
- [Tailwind UI](https://tailwindui.com/) - Pre-designed Tailwind components

### Testing
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)

---

*Last updated: February 2026*
