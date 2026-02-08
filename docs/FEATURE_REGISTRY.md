# Feature Registry & Pricing Structure

> Complete reference of all features, tiers, and pricing.

---

## Tier Definitions

### Basic Tier - $0 (Free)

**Target:** Developers who want a starting point for simple apps.

**Includes:**
- Project setup (TypeScript, ESLint, Prettier)
- Basic CRUD operations
- Database setup (Prisma + PostgreSQL)
- Basic UI components (30+ atoms/molecules)
- Basic layouts (Container, Stack, Grid)
- Environment configuration
- Basic error handling

**Does NOT Include:**
- ❌ Authentication
- ❌ Security (CSRF, Rate Limiting)
- ❌ Admin Panel
- ❌ Payments
- ❌ Email
- ❌ File Uploads

---

### Starter Tier - $49

**Target:** Developers building apps that need user accounts.

**Includes everything in Basic, PLUS:**
- Email/Password authentication
- JWT session management
- Password reset flow
- Email verification
- Basic rate limiting
- CSRF protection
- Auth pages (Login, Register, Forgot Password, etc.)
- Protected routes

---

### Pro Tier - $149

**Target:** Developers building business applications.

**Includes everything in Starter, PLUS:**
- Admin dashboard layout
- User management (CRUD)
- Role-based access control (RBAC)
- Audit logging
- Basic analytics (charts, stats)
- Settings management
- File uploads (Avatar, Documents)
- Export functions (CSV)

---

### Business Tier - $299

**Target:** SaaS applications and commercial products.

**Includes everything in Pro, PLUS:**
- Payment integration (Stripe)
- Subscription management
- Billing portal
- Transactional email (Resend)
- Email templates
- Real-time features (WebSockets)
- Push notifications (web)
- Advanced analytics dashboard
- Report generation (PDF)
- Multi-tenant foundation

---

### Enterprise Tier - $499

**Target:** Large-scale applications with premium requirements.

**Includes everything in Business, PLUS:**
- Social authentication (Google, GitHub, Facebook)
- Two-factor authentication (TOTP)
- SSO integration (SAML/OIDC ready)
- White-labeling support
- Custom branding
- Flutter mobile app
- Priority support (30 days)
- Advanced security features

---

## Feature Categories

### 1. Core Features

| Feature ID | Name | Description | Price | Tier |
|------------|------|-------------|-------|------|
| `core.setup` | Project Setup | TypeScript, ESLint, Prettier | $0 | Basic |
| `core.crud` | CRUD Operations | Standard API patterns | $0 | Basic |
| `core.database` | Database Setup | Prisma + PostgreSQL | $0 | Basic |
| `core.env` | Environment Config | .env management | $0 | Basic |
| `core.errors` | Error Handling | Standardized error responses | $0 | Basic |
| `core.logging` | Logging | Request/response logging | $0 | Basic |

---

### 2. Authentication Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `auth.basic` | Basic Auth | Email/Password + JWT | $49 | Starter | core.* |
| `auth.emailVerify` | Email Verification | Verify user email | $0 | Starter | auth.basic |
| `auth.passwordReset` | Password Reset | Reset password flow | $0 | Starter | auth.basic |
| `auth.social` | Social Login | Google, GitHub, Facebook | $29 | Starter | auth.basic |
| `auth.mfa` | Two-Factor Auth | TOTP + backup codes | $39 | Pro | auth.basic |
| `auth.magicLink` | Magic Link | Passwordless login | $29 | Starter | auth.basic |
| `auth.sso` | SSO | SAML/OIDC ready | $99 | Enterprise | auth.basic |

---

### 3. Security Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `security.csrf` | CSRF Protection | Token-based CSRF | $0 | Starter | auth.basic |
| `security.rateLimit` | Rate Limiting | Basic rate limiting | $0 | Starter | core.* |
| `security.rateLimitAdv` | Advanced Rate Limit | Per-route, per-user limits | $29 | Pro | security.rateLimit |
| `security.audit` | Audit Logging | User action logging | $29 | Pro | auth.basic |
| `security.rbac` | Role-Based Access | Roles & permissions | $39 | Pro | auth.basic |
| `security.ipBlock` | IP Blocking | Block/allow IP ranges | $39 | Business | security.rateLimit |

---

### 4. Payment Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `payments.oneTime` | One-Time Payments | Stripe checkout | $49 | Starter | auth.basic |
| `payments.subscription` | Subscriptions | Recurring billing | $79 | Pro | payments.oneTime |
| `payments.usage` | Usage Billing | Metered billing | $49 | Business | payments.subscription |
| `payments.multiCurrency` | Multi-Currency | Multiple currencies | $29 | Business | payments.oneTime |
| `payments.invoices` | Invoices | Invoice generation | $29 | Pro | payments.oneTime |
| `payments.portal` | Billing Portal | Customer billing portal | $0 | Pro | payments.subscription |

---

### 5. Storage Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `storage.upload` | File Uploads | S3/R2 integration | $39 | Basic | core.* |
| `storage.images` | Image Processing | Resize, optimize | $29 | Basic | storage.upload |
| `storage.avatar` | Avatar Upload | User avatar upload | $0 | Pro | storage.upload |
| `storage.documents` | Document Upload | Multi-file upload | $0 | Pro | storage.upload |
| `storage.pdf` | PDF Generation | Generate PDF documents | $39 | Pro | core.* |

---

### 6. Communication Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `comms.email` | Transactional Email | Resend/SendGrid | $29 | Basic | core.* |
| `comms.emailTemplates` | Email Templates | HTML email templates | $19 | Basic | comms.email |
| `comms.push` | Push Notifications | Web push notifications | $39 | Starter | auth.basic |
| `comms.realtime` | Real-time | WebSocket support | $49 | Pro | auth.basic |
| `comms.sms` | SMS | SMS notifications | $39 | Business | core.* |

---

### 7. UI Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `ui.components` | UI Components | 50+ components | $0 | Basic | core.* |
| `ui.layouts` | Basic Layouts | Container, Stack, Grid | $0 | Basic | ui.components |
| `ui.authPages` | Auth Pages | Login, Register, etc. | $0 | Starter | auth.basic, ui.components |
| `ui.dashboard` | Dashboard Layout | Sidebar, header, nav | $29 | Starter | ui.components |
| `ui.admin` | Admin Panel | Full admin interface | $49 | Pro | ui.dashboard, auth.basic |
| `ui.landing` | Landing Pages | Marketing pages | $39 | Basic | ui.components |
| `ui.emailHtml` | HTML Emails | Email templates | $29 | Basic | comms.email |

---

### 8. Analytics Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `analytics.basic` | Basic Analytics | Charts, stats widgets | $29 | Starter | ui.components |
| `analytics.dashboard` | Analytics Dashboard | Full analytics page | $49 | Pro | analytics.basic, ui.admin |
| `analytics.export` | Data Export | CSV/Excel export | $19 | Basic | core.* |
| `analytics.reports` | Report Generation | PDF reports | $39 | Pro | analytics.dashboard |

---

### 9. Mobile Features

| Feature ID | Name | Description | Price | Tier | Requires |
|------------|------|-------------|-------|------|----------|
| `mobile.flutter` | Flutter App | Complete mobile app | $99 | Starter | auth.basic |
| `mobile.push` | Mobile Push | Push notifications | $39 | Starter | mobile.flutter |
| `mobile.offline` | Offline Support | Offline-first | $49 | Pro | mobile.flutter |
| `mobile.biometric` | Biometric Auth | Fingerprint/Face ID | $29 | Pro | mobile.flutter, auth.basic |

---

## Template Presets

### LMS (Learning Management System) - $299

**Saves:** $127 vs individual features

**Includes:**
- Starter Tier base
- Social Login (Google)
- File Uploads
- Dashboard Layout
- Admin Panel
- Basic Analytics
- Stripe Subscriptions
- Transactional Email
- LMS Modules:
  - Course Management
  - Lesson Builder (Video/Text/PDF)
  - Student Enrollment
  - Progress Tracking
  - Quiz & Assessments
  - Certificates (QR verification)
  - Instructor Dashboard
  - Course Reviews
  - Categories & Tags

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- Live Classes / Video Conferencing (+$79)
- Discussion Forums (+$49)
- Gamification (Badges, Points) (+$59)

---

### Booking (Appointment System) - $249

**Saves:** $98 vs individual features

**Includes:**
- Starter Tier base
- Dashboard Layout
- Admin Panel
- Basic Analytics
- Stripe Payments
- Transactional Email
- Booking Modules:
  - Service Management
  - Staff/Resource Management
  - Availability Calendar
  - Booking Flow
  - Customer Management
  - Appointment Reminders
  - Cancellation/Rescheduling
  - QR Check-in

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- Recurring Bookings (+$39)
- Multi-location (+$49)
- Stripe Subscriptions (+$49)

---

### Events (Event Management) - $199

**Saves:** $78 vs individual features

**Includes:**
- Starter Tier base
- Dashboard Layout
- File Uploads
- Stripe Payments
- Transactional Email
- Event Modules:
  - Event Creation & Management
  - Ticket Types & Pricing
  - Registration Flow
  - Attendee Management
  - QR Code Tickets
  - Check-in System
  - Event Analytics
  - Email Notifications

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- Recurring Events (+$29)
- Seating Charts (+$59)
- Virtual Events Integration (+$79)

---

### Invoicing (Invoice & Client Management) - $179

**Saves:** $67 vs individual features

**Includes:**
- Starter Tier base
- Dashboard Layout
- File Uploads
- Stripe Payments
- PDF Generation
- Transactional Email
- Invoicing Modules:
  - Client Management
  - Invoice Creation
  - Invoice Templates
  - Payment Tracking
  - Expense Tracking
  - Tax Calculations
  - Payment Reminders
  - Reports (Revenue, Outstanding)

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- Multi-currency (+$29)
- Time Tracking (+$39)
- Proposals/Estimates (+$39)

---

### Tasks (Project & Task Management) - $199

**Saves:** $82 vs individual features

**Includes:**
- Starter Tier base
- Dashboard Layout
- Admin Panel
- Real-time (WebSockets)
- File Uploads
- Task Modules:
  - Workspace Management
  - Project Creation
  - Task Lists & Kanban
  - Task Assignment
  - Comments & Discussions
  - File Attachments
  - Due Dates & Reminders
  - Activity Feed

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- Time Tracking (+$39)
- Gantt Charts (+$49)
- Recurring Tasks (+$29)

---

### Helpdesk (Customer Support) - $249

**Saves:** $94 vs individual features

**Includes:**
- Business Tier base (with subscriptions)
- Helpdesk Modules:
  - Ticket System
  - Ticket Categories & Priority
  - Agent Assignment
  - Internal Notes
  - Customer Portal
  - Knowledge Base
  - Canned Responses
  - SLA Tracking
  - Real-time Chat Widget
  - Analytics & Reports

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- AI Responses (+$79)
- Multi-brand Support (+$49)
- Phone Integration (+$79)

---

### CRM (Customer Relationship Management) - $349

**Saves:** $142 vs individual features

**Includes:**
- Business Tier base
- CRM Modules:
  - Contact Management
  - Company/Account Management
  - Deal Pipeline
  - Activity Tracking
  - Email Integration
  - Task Management
  - Notes & Documents
  - Reports & Dashboards
  - Import/Export
  - Custom Fields

**Optional Add-ons:**
- Flutter Mobile App (+$99)
- Email Campaigns (+$59)
- Lead Scoring (+$49)
- Automation Workflows (+$79)

---

## Pricing Matrix

| Tier/Template | Base | +Social | +MFA | +Payments | +Admin | +Mobile |
|---------------|------|---------|------|-----------|--------|---------|
| Basic | $0 | N/A | N/A | N/A | N/A | N/A |
| Starter | $49 | +$29 | N/A | +$49 | +$49 | +$99 |
| Pro | $149 | +$29 | +$39 | +$79 | incl. | +$99 |
| Business | $299 | +$29 | +$39 | incl. | incl. | +$99 |
| Enterprise | $499 | incl. | incl. | incl. | incl. | incl. |
| LMS | $299 | incl. | +$39 | incl. | incl. | +$99 |
| Booking | $249 | +$29 | +$39 | incl. | incl. | +$99 |
| Events | $199 | +$29 | +$39 | incl. | +$49 | +$99 |
| Invoicing | $179 | +$29 | +$39 | incl. | +$49 | +$99 |
| Tasks | $199 | +$29 | +$39 | +$79 | incl. | +$99 |
| Helpdesk | $249 | +$29 | +$39 | incl. | incl. | +$99 |
| CRM | $349 | +$29 | +$39 | incl. | incl. | +$99 |

---

## Bundle Discount Rules

1. **Tier Discount:** Features included in a tier are cheaper than buying individually
   - Starter saves ~$20 vs Basic + Auth + Security individually
   - Pro saves ~$50 vs Starter + Admin features individually
   - Business saves ~$100 vs Pro + Payments + Email individually

2. **Template Discount:** Templates include features at 20-30% discount
   - Example: LMS features individually = $426, Template = $299 (30% off)

3. **Add-on Bundles:**
   - Auth Bundle (Social + MFA + Magic Link) = $79 (save $18)
   - Communication Bundle (Email + Push + Real-time) = $99 (save $18)
   - Security Bundle (Advanced Rate Limit + Audit + RBAC) = $79 (save $18)

4. **Volume Discounts:**
   - 2 templates: 10% off total
   - 3+ templates: 15% off total
   - Team license (5+ seats): 25% off

---

## Feature Dependencies

```
auth.social       → requires → auth.basic
auth.mfa          → requires → auth.basic
auth.magicLink    → requires → auth.basic
auth.sso          → requires → auth.basic

security.csrf     → requires → auth.basic
security.audit    → requires → auth.basic
security.rbac     → requires → auth.basic
security.rateLimitAdv → requires → security.rateLimit

payments.subscription → requires → payments.oneTime
payments.usage    → requires → payments.subscription
payments.portal   → requires → payments.subscription
payments.invoices → requires → payments.oneTime

storage.images    → requires → storage.upload
storage.avatar    → requires → storage.upload
storage.documents → requires → storage.upload

comms.emailTemplates → requires → comms.email
comms.push        → requires → auth.basic
comms.realtime    → requires → auth.basic

ui.authPages      → requires → auth.basic, ui.components
ui.dashboard      → requires → ui.components
ui.admin          → requires → ui.dashboard, auth.basic

analytics.dashboard → requires → analytics.basic, ui.admin
analytics.reports → requires → analytics.dashboard

mobile.push       → requires → mobile.flutter
mobile.offline    → requires → mobile.flutter
mobile.biometric  → requires → mobile.flutter, auth.basic
```

---

*Last Updated: 2026-02-08*
