# Design System Documentation

> A comprehensive guide to building intuitive, accessible, and calming user interfaces.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Scientific Foundations](#2-scientific-foundations)
3. [Spacing System](#3-spacing-system)
4. [Color System](#4-color-system)
5. [Typography](#5-typography)
6. [Interaction Patterns](#6-interaction-patterns)
7. [Component Guidelines](#7-component-guidelines)
8. [Intuitive Design Checklist](#8-intuitive-design-checklist)

---

## 1. Design Philosophy

### Core Principles

#### Content-First Approach
Every pixel should serve the user's primary task. We maximize screen real estate for content by:

- **Minimizing chrome**: Headers, sidebars, and navigation should be compact and unobtrusive
- **Progressive disclosure**: Show only what's needed at each moment
- **Whitespace as a feature**: Empty space guides the eye and reduces cognitive load
- **Full-bleed content areas**: Let content breathe within generous containers

```
BAD:  Header (80px) + Sidebar (280px) + Padding (48px) = 408px lost
GOOD: Header (64px) + Collapsible sidebar + Fluid padding = More content space
```

#### Intuitive Over Trendy
We choose patterns backed by research over flashy trends:

- **Familiar patterns first**: Users shouldn't have to learn new interaction models
- **Consistency over creativity**: Same action = same interaction everywhere
- **Predictable behavior**: Users should never be surprised by the UI
- **Evidence-based decisions**: Every design choice should trace back to UX research

#### Calm, Focused Experience
Digital tools should reduce stress, not add to it:

- **Muted color palette**: Avoid attention-grabbing colors except for critical actions
- **Gentle transitions**: 150-300ms easing curves that feel natural
- **Minimal notifications**: Interrupt only when truly necessary
- **Clear visual hierarchy**: The eye should flow naturally through the interface

#### Accessibility as Core
Accessibility isn't a feature; it's a foundation:

- **WCAG 2.1 AA compliance minimum**: 4.5:1 contrast for normal text, 3:1 for large text
- **Keyboard navigation**: Every interaction must work without a mouse
- **Screen reader support**: Semantic HTML and proper ARIA labels
- **Reduced motion support**: Respect `prefers-reduced-motion` preference
- **Focus indicators**: Clear, visible focus states for all interactive elements

---

## 2. Scientific Foundations

Understanding why users behave the way they do allows us to design better interfaces. Here are the cognitive principles that guide our decisions:

### Hick's Law
> The time to make a decision increases logarithmically with the number of choices.

**Formula**: `RT = a + b * log2(n)` where n = number of choices

**Application**:
- Limit navigation items to 5-7 options
- Use progressive disclosure for complex settings
- Default to the most common choice
- Group related actions under clear categories

```typescript
// BAD: Too many top-level options
<nav>
  <NavItem>Home</NavItem>
  <NavItem>Products</NavItem>
  <NavItem>Services</NavItem>
  <NavItem>About</NavItem>
  <NavItem>Team</NavItem>
  <NavItem>Blog</NavItem>
  <NavItem>Resources</NavItem>
  <NavItem>Support</NavItem>
  <NavItem>Contact</NavItem>
  <NavItem>Careers</NavItem>
</nav>

// GOOD: Grouped and prioritized
<nav>
  <NavItem>Home</NavItem>
  <NavItem>Products</NavItem>
  <NavDropdown label="Company">
    <NavItem>About</NavItem>
    <NavItem>Team</NavItem>
    <NavItem>Careers</NavItem>
  </NavDropdown>
  <NavDropdown label="Resources">
    <NavItem>Blog</NavItem>
    <NavItem>Support</NavItem>
    <NavItem>Documentation</NavItem>
  </NavDropdown>
  <NavItem>Contact</NavItem>
</nav>
```

### Miller's Law
> The average person can hold 7 plus or minus 2 items in working memory.

**Application**:
- Chunk information into groups of 5-9 items
- Use visual grouping (cards, sections, dividers)
- Paginate lists longer than 7 items when scanning is the goal
- For complex data, provide filters and search

| Context | Recommended Max Items |
|---------|----------------------|
| Navigation tabs | 5-7 |
| Form fields per section | 5-7 |
| Table columns visible | 5-7 |
| Dropdown options before search | 7-9 |
| Steps in a wizard | 5-7 |

### Fitts's Law
> The time to reach a target is a function of the distance to and size of the target.

**Formula**: `T = a + b * log2(D/W + 1)` where D = distance, W = width

**Application**:
- Primary actions should be **large** (minimum 44x44px touch target)
- Frequently used controls should be **close** to the user's cursor path
- Place destructive actions **away** from common paths
- Use full-width buttons on mobile
- Corner and edge placement for frequent actions (infinite edge = easy target)

```css
/* Primary action - larger, prominent */
.button-primary {
  height: 44px;      /* Minimum touch target */
  min-width: 120px;  /* Wide enough for easy clicking */
  padding: 0 24px;
}

/* Secondary action - smaller but accessible */
.button-secondary {
  height: 40px;
  min-width: 80px;
  padding: 0 16px;
}

/* Destructive action - intentionally smaller, requires precision */
.button-destructive {
  height: 36px;
  min-width: 60px;
  padding: 0 12px;
}
```

### Jakob's Law
> Users spend most of their time on other sites, so they prefer your site to work like others they know.

**Application**:
- Use standard UI patterns (hamburger menu on mobile, logo in top-left)
- Place search in the header, settings in expected locations
- Follow platform conventions (iOS vs Android vs Web)
- Shopping cart in top-right, user menu in top-right
- Login/Register in the header

**Common Expectations**:
| Element | Expected Location |
|---------|------------------|
| Logo | Top-left, links to home |
| Search | Header, center or right |
| User menu | Top-right corner |
| Primary navigation | Header or left sidebar |
| Submit button | Bottom-right of forms |
| Cancel button | Left of submit |

### Gestalt Principles

#### Proximity
> Elements close together are perceived as related.

```
BAD:                    GOOD:
[Label]                 [Label]
                        [Input]
[Input]
                        [Label]
[Label]                 [Input]

[Input]
```

**Spacing guidelines**:
- Related elements: 4-8px gap
- Grouped elements: 16-24px gap
- Distinct sections: 32-48px gap

#### Similarity
> Elements that look similar are perceived as related.

- Use consistent styling for related actions
- Same icon style throughout the app
- Consistent button styles for same-level actions

#### Closure
> The mind fills in missing information to create complete shapes.

- Use subtle borders or backgrounds to define regions
- Partial dividers can effectively separate sections
- Card shadows suggest containment

#### Continuity
> Elements arranged in a line or curve are perceived as related.

- Align form labels and inputs
- Use consistent grid alignment
- Flow naturally left-to-right, top-to-bottom

#### Figure-Ground
> We perceive elements as either in the foreground or background.

- Modals should clearly overlay the page
- Use backdrop blur for depth
- Active/selected items should "lift" from the surface

### Color Psychology

Colors trigger emotional and behavioral responses. Use them intentionally:

| Color | Psychology | Use Case |
|-------|-----------|----------|
| **Blue** | Trust, stability, calm | Finance, healthcare, enterprise |
| **Green** | Growth, success, nature | Success states, eco, health |
| **Red** | Urgency, error, passion | Errors, destructive actions, alerts |
| **Yellow** | Optimism, warning, energy | Warnings, highlights, attention |
| **Purple** | Creativity, luxury, wisdom | Premium features, creative tools |
| **Orange** | Enthusiasm, action | CTAs, promotions |
| **Neutral grays** | Professional, calm | Primary interface |

**Our approach**: Use saturated colors sparingly. The interface should be predominantly neutral, with color used only to:
1. Indicate state (success, error, warning)
2. Highlight the primary action
3. Reinforce brand identity subtly

---

## 3. Spacing System

We use a **4px base unit** for all spacing. This creates visual rhythm and makes designs feel cohesive.

### Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `space-0` | 0px | No spacing |
| `space-0.5` | 2px | Minimal separation (icon + text) |
| `space-1` | 4px | Tight inline elements |
| `space-1.5` | 6px | Compact list items |
| `space-2` | 8px | Related elements, form field gaps |
| `space-3` | 12px | Button padding, card internal spacing |
| `space-4` | 16px | Section padding, card gaps |
| `space-5` | 20px | Comfortable breathing room |
| `space-6` | 24px | Section breaks, modal padding |
| `space-8` | 32px | Major section separation |
| `space-10` | 40px | Page section breaks |
| `space-12` | 48px | Large gaps, hero spacing |
| `space-16` | 64px | Major layout breaks |
| `space-20` | 80px | Page-level spacing |
| `space-24` | 96px | Hero sections |

### Spacing Patterns

#### Tight Spacing (4-8px)
Use for closely related elements:

```typescript
// Icon + text in a button
<Button>
  <Icon className="mr-2" /> {/* 8px gap */}
  Save Changes
</Button>

// Badge next to text
<span className="flex items-center gap-1"> {/* 4px gap */}
  Status <Badge>Active</Badge>
</span>
```

#### Comfortable Spacing (12-24px)
Use for grouped elements within a section:

```typescript
// Form fields
<form className="space-y-4"> {/* 16px between fields */}
  <FormField label="Name" />
  <FormField label="Email" />
  <FormField label="Message" />
</form>

// Card content
<Card className="p-6"> {/* 24px internal padding */}
  <CardHeader className="mb-4"> {/* 16px below header */}
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

#### Loose Spacing (32-64px)
Use for distinct sections:

```typescript
// Page sections
<main className="space-y-12"> {/* 48px between sections */}
  <Section title="Overview">...</Section>
  <Section title="Details">...</Section>
  <Section title="Related">...</Section>
</main>

// Hero to content
<div>
  <Hero className="mb-16" /> {/* 64px gap */}
  <MainContent />
</div>
```

### Container Width Scale

| Size | Max Width | Use Case |
|------|-----------|----------|
| `sm` | 512px (32rem) | Auth forms, simple content |
| `md` | 768px (48rem) | Blog posts, focused content |
| `lg` | 1024px (64rem) | General content, dashboards |
| `xl` | 1280px (80rem) | Wide layouts, complex tables |
| `2xl` | 1536px (96rem) | Extra-wide layouts |
| `full` | 100% | Full-bleed content |

### Responsive Spacing

Spacing should increase on larger screens:

```typescript
// Mobile-first responsive spacing
<div className="px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-12">
  {/*
    Mobile: 16px horizontal, 24px vertical
    Tablet: 24px horizontal, 32px vertical
    Desktop: 32px horizontal, 48px vertical
  */}
</div>
```

---

## 4. Color System

### Base Calming Palette

Our color system is built on OKLCH for perceptual uniformity. Colors are designed to be calming and professional.

#### Light Mode

```css
:root {
  /* Backgrounds */
  --background: oklch(0.99 0.002 90);      /* Near-white with warm tint */
  --card: oklch(1 0 0);                     /* Pure white for cards */
  --muted: oklch(0.96 0.008 80);            /* Subtle gray for disabled */

  /* Foregrounds */
  --foreground: oklch(0.20 0.02 250);       /* Near-black, slightly cool */
  --muted-foreground: oklch(0.50 0.01 250); /* Medium gray for secondary text */

  /* Primary - Calming teal-blue */
  --primary: oklch(0.55 0.15 195);          /* Trustworthy, calm */
  --primary-foreground: oklch(0.99 0 0);    /* White text on primary */

  /* Accent - Warm amber */
  --accent: oklch(0.75 0.15 65);            /* Highlights, active states */

  /* Semantic */
  --destructive: oklch(0.55 0.22 25);       /* Errors, danger */

  /* Borders */
  --border: oklch(0.90 0.01 80);            /* Subtle, warm gray */
}
```

#### Dark Mode

```css
.dark {
  /* Inverted with reduced contrast for eye comfort */
  --background: oklch(0.16 0.02 250);
  --card: oklch(0.20 0.02 250);
  --foreground: oklch(0.95 0.01 80);

  /* Slightly lighter primary for dark mode visibility */
  --primary: oklch(0.70 0.14 195);

  /* Reduced saturation in dark mode */
  --destructive: oklch(0.60 0.20 25);
}
```

### App-Type Theme Recommendations

Different applications benefit from different color palettes based on their purpose and user psychology.

#### Educational Apps
**Goal**: Focus, retention, reduced fatigue during long study sessions

```css
:root {
  --primary: oklch(0.55 0.12 220);    /* Deep blue - concentration */
  --accent: oklch(0.70 0.10 140);     /* Sage green - calm */
  --background: oklch(0.98 0.005 95); /* Cream white - easy on eyes */
  --highlight: oklch(0.85 0.12 85);   /* Soft yellow - highlights */
}
```

**Design notes**:
- Low contrast backgrounds for extended reading
- Green accents promote calm and retention
- Avoid bright reds (triggers anxiety)
- Use generous line height (1.7) for readability

#### Finance Apps
**Goal**: Trust, security, precision

```css
:root {
  --primary: oklch(0.45 0.10 250);    /* Navy blue - trust */
  --accent: oklch(0.55 0.15 150);     /* Teal - stability */
  --success: oklch(0.55 0.18 145);    /* Deep green - positive */
  --destructive: oklch(0.50 0.20 25); /* Muted red - loss */
}
```

**Design notes**:
- Use monospace fonts for numbers
- Right-align numerical data
- Clear positive (green) and negative (red) indicators
- Conservative, professional aesthetic

#### E-commerce Apps
**Goal**: Action, conversion, excitement balanced with trust

```css
:root {
  --primary: oklch(0.60 0.20 30);     /* Vibrant orange - action */
  --accent: oklch(0.55 0.15 195);     /* Trust blue - secondary */
  --success: oklch(0.55 0.18 145);    /* Green - in stock */
  --sale: oklch(0.55 0.22 25);        /* Red - urgency */
}
```

**Design notes**:
- High-contrast CTAs for "Add to Cart"
- Use urgency colors sparingly (sales, low stock)
- Trust signals (security badges) in blue
- White space around purchase actions

#### Accounting Apps
**Goal**: Precision, clarity, error prevention

```css
:root {
  --primary: oklch(0.45 0.08 250);    /* Muted blue - professional */
  --accent: oklch(0.50 0.05 250);     /* Steel gray - neutral */
  --positive: oklch(0.45 0.12 145);   /* Dark green - credits */
  --negative: oklch(0.45 0.15 25);    /* Dark red - debits */
}
```

**Design notes**:
- Extremely high contrast for numbers
- Clear debit/credit color coding
- Zebra striping for tables
- Minimal decoration, maximum clarity

#### Notes/Writing Apps
**Goal**: Flow state, minimal distraction, creativity

```css
:root {
  --background: oklch(0.98 0.002 60); /* Warm paper */
  --foreground: oklch(0.25 0.02 60);  /* Soft black */
  --primary: oklch(0.55 0.08 60);     /* Subtle brown */
  --accent: oklch(0.70 0.10 200);     /* Soft blue links */
}
```

**Design notes**:
- Minimal UI, hide until needed
- Paper-like backgrounds
- Focus mode: single document view
- Gentle, warm color palette

#### Health/Wellness Apps
**Goal**: Calm, healing, reassurance

```css
:root {
  --primary: oklch(0.60 0.12 170);    /* Healing teal */
  --accent: oklch(0.75 0.10 120);     /* Soft green */
  --secondary: oklch(0.65 0.08 280);  /* Lavender calm */
  --background: oklch(0.98 0.005 180);/* Cool white */
}
```

**Design notes**:
- Cool, natural color palette
- Generous whitespace
- Rounded corners (softer feel)
- Avoid harsh contrasts

#### Social Apps
**Goal**: Connection, energy, engagement

```css
:root {
  --primary: oklch(0.55 0.20 250);    /* Vibrant blue */
  --accent: oklch(0.65 0.25 330);     /* Pink/magenta */
  --like: oklch(0.55 0.22 25);        /* Heart red */
  --success: oklch(0.55 0.18 145);    /* Active green */
}
```

**Design notes**:
- More saturated colors acceptable
- Clear notification indicators
- Engagement-focused color for actions
- Avatar-centric layouts

#### Creative Apps
**Goal**: Imagination, inspiration, expression

```css
:root {
  --primary: oklch(0.55 0.18 300);    /* Creative purple */
  --accent: oklch(0.70 0.20 40);      /* Energetic orange */
  --secondary: oklch(0.60 0.15 200);  /* Complementary teal */
}
```

**Design notes**:
- Allow user customization
- Playful, expressive colors
- Dark mode preferred for visual work
- Minimal UI interference with canvas

### Accessibility Requirements

All color combinations must meet WCAG 2.1 AA standards:

| Text Size | Required Ratio | Example |
|-----------|---------------|---------|
| Normal text (<18px) | 4.5:1 | `oklch(0.40 ...)` on white |
| Large text (>=18px bold or 24px) | 3:1 | `oklch(0.50 ...)` on white |
| UI components | 3:1 | Button borders, icons |
| Focus indicators | 3:1 | Focus rings |

**Never rely on color alone**:
```typescript
// BAD: Color-only indication
<span className={isError ? "text-red-500" : "text-green-500"}>
  {status}
</span>

// GOOD: Color + icon + text
<span className={isError ? "text-destructive" : "text-success"}>
  {isError ? <XIcon /> : <CheckIcon />}
  {isError ? "Error: " + message : "Success: " + message}
</span>
```

---

## 5. Typography

### Font Stack

```css
:root {
  /* System font stack for performance and native feel */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  /* Monospace for code and numbers */
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
    "Liberation Mono", Menlo, monospace;
}
```

**Rationale**:
- System fonts load instantly (no FOUT)
- Native feel on each platform
- Excellent readability at all sizes
- Consistent rendering across devices

### Type Scale

Based on a 1.25 ratio (major third) for harmonious scaling:

| Name | Size | Line Height | Use Case |
|------|------|-------------|----------|
| `text-xs` | 12px | 1.5 (18px) | Captions, footnotes |
| `text-sm` | 14px | 1.5 (21px) | Secondary text, labels |
| `text-base` | 16px | 1.6 (26px) | Body text |
| `text-lg` | 18px | 1.6 (29px) | Lead paragraphs |
| `text-xl` | 20px | 1.5 (30px) | Card titles |
| `text-2xl` | 24px | 1.4 (34px) | Section headings |
| `text-3xl` | 30px | 1.3 (39px) | Page titles |
| `text-4xl` | 36px | 1.2 (43px) | Hero headings |
| `text-5xl` | 48px | 1.1 (53px) | Display text |

### Font Weights

| Weight | Value | Use Case |
|--------|-------|----------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons, emphasis |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings, strong emphasis |

### Line Height Guidelines

Optimal line height varies by context:

| Context | Line Height | Rationale |
|---------|-------------|-----------|
| Body text | 1.5-1.7 | Optimal for reading long passages |
| Headings | 1.2-1.3 | Tighter for impact |
| UI labels | 1.4-1.5 | Compact but readable |
| Buttons | 1 | Single line, vertically centered |
| Code | 1.5-1.6 | Needs space for readability |

### Paragraph Width

For optimal readability, limit line length:

- **Ideal**: 45-75 characters per line
- **Implementation**: Use `max-w-prose` (65ch) for body text

```typescript
<article className="prose max-w-prose">
  {/* Content automatically limited to ~65 characters */}
</article>
```

### Typography Hierarchy Example

```typescript
<article>
  <h1 className="text-3xl font-bold leading-tight mb-4">
    Page Title
  </h1>

  <p className="text-lg text-muted-foreground mb-8">
    Lead paragraph with larger text for introduction.
  </p>

  <section className="space-y-4">
    <h2 className="text-2xl font-semibold">Section Heading</h2>

    <p className="text-base leading-relaxed">
      Body text with comfortable line height for extended reading.
      Each paragraph should have adequate spacing.
    </p>

    <p className="text-sm text-muted-foreground">
      Secondary information in smaller, muted text.
    </p>
  </section>
</article>
```

---

## 6. Interaction Patterns

### Immediate Feedback Principle

Users should never wonder if their action was received. Every interaction needs feedback within 100ms.

#### Types of Feedback

| Action | Feedback Type | Timing |
|--------|--------------|--------|
| Button click | Visual state change | Immediate (<100ms) |
| Form submission | Loading state | Immediate |
| Async operation | Progress indicator | <300ms |
| Success | Toast/confirmation | On completion |
| Error | Inline error message | On completion |

```typescript
// Button with loading state
<Button
  onClick={handleSubmit}
  isLoading={isSubmitting}
  disabled={isSubmitting}
>
  {isSubmitting ? "Saving..." : "Save Changes"}
</Button>
```

### Loading States

#### Skeleton Loading
Use for content that will appear in a known layout:

```typescript
// Show skeleton while loading
{isLoading ? (
  <SkeletonCard />
) : (
  <Card data={data} />
)}
```

**Best practices**:
- Match the skeleton shape to actual content
- Use pulse or shimmer animation
- Avoid layout shift when content loads

#### Spinner Loading
Use for indeterminate operations:

```typescript
// Full-page loading
<LoadingPage message="Loading your dashboard..." />

// Inline loading
<Loading size="sm" message="Refreshing..." />
```

#### Progressive Loading
For large data sets, load in chunks:

```typescript
// Infinite scroll pattern
{items.map(item => <ItemCard key={item.id} item={item} />)}
{hasMore && <div ref={loadMoreRef}><Spinner /></div>}
```

### Error Handling

#### Error Display Hierarchy

1. **Inline errors**: Next to the problematic field
2. **Form errors**: Above the form
3. **Page errors**: Full error state with recovery action
4. **Global errors**: Toast notification

```typescript
// Inline field error
<FormField
  label="Email"
  error={errors.email?.message}
  aria-invalid={!!errors.email}
/>

// Form-level error
<Alert variant="destructive" className="mb-4">
  <AlertTitle>Submission Failed</AlertTitle>
  <AlertDescription>
    Please check the highlighted fields and try again.
  </AlertDescription>
</Alert>

// Toast for async errors
toast.error("Failed to save changes. Please try again.");
```

#### Error Recovery

Always provide a path forward:

```typescript
// Empty state with action
<EmptyState
  title="No documents found"
  description="You haven't created any documents yet."
  action={<Button onClick={createNew}>Create Document</Button>}
/>

// Error state with retry
<ErrorState
  title="Failed to load data"
  description="We couldn't connect to the server."
  action={<Button onClick={retry}>Try Again</Button>}
/>
```

### Micro-interactions

Small animations that provide feedback and delight:

#### Button States

```css
.button {
  transition: all 150ms ease;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button:active {
  transform: translateY(0);
}
```

#### Focus States

```css
.focusable {
  transition: box-shadow 150ms ease;
}

.focusable:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--background),
              0 0 0 4px var(--ring);
}
```

#### Transitions

| Element | Duration | Easing |
|---------|----------|--------|
| Color changes | 150ms | ease |
| Layout changes | 200ms | ease-out |
| Enter animations | 200ms | ease-out |
| Exit animations | 150ms | ease-in |
| Complex animations | 300ms | ease-in-out |

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Component Guidelines

### Button

**When to use**:
- Primary actions: Form submission, navigation to key flows
- Secondary actions: Cancel, back, alternative options
- Tertiary actions: Less important actions, links within text

**Variants**:

| Variant | Use Case |
|---------|----------|
| `default` | Primary actions (Submit, Save, Continue) |
| `secondary` | Secondary actions (Cancel, Back) |
| `outline` | Less prominent actions, toolbar buttons |
| `ghost` | Minimal actions, icon buttons |
| `destructive` | Dangerous actions (Delete, Remove) |
| `link` | Text links, inline actions |

**Dos**:
- Use action verbs: "Save Changes" not "Submit"
- One primary button per view
- Place primary button on the right (LTR cultures)
- Use loading state during async operations

**Don'ts**:
- Don't disable without explanation
- Don't use red for non-destructive actions
- Don't put multiple primary buttons together
- Don't use generic labels like "Click Here"

```typescript
// GOOD
<div className="flex justify-end gap-3">
  <Button variant="outline" onClick={onCancel}>Cancel</Button>
  <Button onClick={onSave} isLoading={isSaving}>Save Changes</Button>
</div>

// BAD
<div className="flex gap-3">
  <Button>Submit</Button>
  <Button>Save</Button>
  <Button>Continue</Button>
</div>
```

### Input

**When to use**:
- Single-line text entry
- Email, password, number input
- Search fields

**Dos**:
- Always use labels (not just placeholders)
- Show validation state clearly
- Provide helpful error messages
- Use appropriate input types (email, tel, number)

**Don'ts**:
- Don't use placeholder as the only label
- Don't validate on every keystroke (use onBlur)
- Don't truncate long error messages

```typescript
// GOOD
<FormField
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  description="We'll never share your email."
  required
/>

// BAD
<Input placeholder="Email" />
```

### Alert

**When to use**:
- Important messages that need attention
- Status updates (success, error, warning)
- Contextual information

**Variants**:

| Variant | Use Case |
|---------|----------|
| `info` | Neutral information |
| `success` | Positive confirmation |
| `warning` | Caution, not blocking |
| `destructive` | Errors, blocking issues |

**Dos**:
- Keep messages concise
- Provide actionable guidance
- Use appropriate variant for severity
- Make dismissible when not critical

**Don'ts**:
- Don't stack multiple alerts
- Don't use for non-essential information
- Don't use destructive for warnings

### Card

**When to use**:
- Grouping related content
- List items that need detail
- Interactive elements with multiple parts

**Dos**:
- Keep content focused (one topic per card)
- Use consistent sizing in lists
- Provide clear visual hierarchy within

**Don'ts**:
- Don't nest cards unnecessarily
- Don't make entire card clickable without indication
- Don't overflow content without truncation strategy

### Modal/Dialog

**When to use**:
- Confirmation of destructive actions
- Focused tasks that shouldn't leave context
- Important decisions that need attention

**Dos**:
- Keep content focused
- Always provide a close button
- Trap focus within the modal
- Close on Escape key
- Prevent background scrolling

**Don'ts**:
- Don't use for long forms (use a page instead)
- Don't nest modals
- Don't open automatically without user action
- Don't use for non-blocking information

### Toast

**When to use**:
- Brief, non-critical feedback
- Operation success/failure
- Background task completion

**Dos**:
- Keep messages short (max 2 lines)
- Auto-dismiss success messages (3-5 seconds)
- Persist error messages until dismissed
- Stack multiple toasts intelligently

**Don'ts**:
- Don't use for critical errors (use Alert)
- Don't use for actions that need response
- Don't show too many simultaneously

---

## 8. Intuitive Design Checklist

Use this checklist when designing or reviewing any interface.

### Visual Hierarchy

- [ ] Is the primary action immediately obvious?
- [ ] Can users identify the most important content within 3 seconds?
- [ ] Is there a clear visual flow (top-left to bottom-right for LTR)?
- [ ] Are headings sized and styled to show hierarchy?
- [ ] Is whitespace used to group related elements?

### Cognitive Load

- [ ] Are there fewer than 7 options visible at once?
- [ ] Is progressive disclosure used for complex features?
- [ ] Are defaults set to the most common choice?
- [ ] Is information chunked into digestible groups?
- [ ] Are long forms broken into logical steps?

### Interaction Design

- [ ] Is feedback immediate for every interaction?
- [ ] Are loading states shown for async operations?
- [ ] Are error messages specific and actionable?
- [ ] Is there always a clear path forward after errors?
- [ ] Do interactive elements look interactive? (hover states, cursors)

### Accessibility

- [ ] Does all text meet contrast requirements (4.5:1)?
- [ ] Can all actions be completed with keyboard only?
- [ ] Are focus states visible and clear?
- [ ] Do images have alt text?
- [ ] Are form fields properly labeled?
- [ ] Is reduced motion respected?

### Consistency

- [ ] Are similar actions styled the same way?
- [ ] Is spacing consistent throughout?
- [ ] Are components used appropriately (not repurposed)?
- [ ] Does the interface follow platform conventions?
- [ ] Is terminology consistent?

### Mobile Considerations

- [ ] Are touch targets at least 44x44px?
- [ ] Is content readable without zooming?
- [ ] Are inputs sized appropriately for mobile keyboards?
- [ ] Do forms use appropriate input types (email, tel, etc.)?
- [ ] Is the most important content visible without scrolling?

### Content

- [ ] Are labels clear and concise?
- [ ] Are action buttons labeled with verbs?
- [ ] Is error text helpful (not just "Invalid")?
- [ ] Are empty states informative and actionable?
- [ ] Is placeholder text genuinely helpful?

### Performance Perception

- [ ] Do skeleton loaders match actual content layout?
- [ ] Are optimistic updates used where appropriate?
- [ ] Is initial content visible quickly?
- [ ] Are long operations broken into visible progress?

### Final Sanity Check

- [ ] Would a first-time user understand this interface?
- [ ] Does the interface feel calm and professional?
- [ ] Is it clear what the user should do next?
- [ ] Would you enjoy using this interface daily?

---

## Quick Reference

### Spacing Quick Guide

```
4px   - Tight (icon+text)
8px   - Related (field groups)
16px  - Grouped (form sections)
24px  - Card padding
32px  - Section breaks
48px  - Page sections
```

### Color Quick Guide

```
--primary           - Main actions, links
--secondary         - Secondary actions
--muted             - Backgrounds, disabled
--muted-foreground  - Secondary text
--destructive       - Errors, dangerous actions
--accent            - Highlights, active states
```

### Typography Quick Guide

```
text-xs   (12px) - Captions
text-sm   (14px) - Labels, secondary
text-base (16px) - Body text
text-xl   (20px) - Card titles
text-2xl  (24px) - Section headings
text-3xl  (30px) - Page titles
```

### Animation Quick Guide

```
150ms ease      - Color, simple state
200ms ease-out  - Enter transitions
150ms ease-in   - Exit transitions
300ms ease      - Complex animations
```

---

*This design system is a living document. Update it as patterns evolve and new insights emerge.*
