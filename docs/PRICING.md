# Client Pricing Guide

> A comprehensive pricing framework for freelancers and agencies using the Fullstack Starter template.

---

## Table of Contents

- [Tier Packages](#tier-packages)
- [Individual Module Pricing](#individual-module-pricing)
- [Add-on Services](#add-on-services)
- [Pricing Calculator](#pricing-calculator)
- [Negotiation Tips](#negotiation-tips)
- [Contract Templates](#contract-templates)
- [FAQ](#faq)

---

## Tier Packages

Pre-configured packages that combine commonly requested features. These provide clear value propositions and simplify client conversations.

| Tier | Base Price | Includes | Best For | Timeline |
|------|------------|----------|----------|----------|
| **Basic** | $1,500 - $3,000 | Auth, CRUD, Basic UI | MVPs, proof of concepts, simple apps | 1-2 weeks |
| **Standard** | $3,000 - $7,000 | Basic + Email, File Upload, Basic Admin | Small businesses, startups | 2-4 weeks |
| **Premium** | $7,000 - $15,000 | Standard + Payments, Analytics, Full Admin Dashboard | Growing businesses, SaaS products | 4-8 weeks |
| **Enterprise** | $15,000 - $30,000+ | All modules + Custom features, Priority support | Large organizations, complex requirements | 8-16 weeks |

### Tier Details

#### Basic Tier ($1,500 - $3,000)

**Included Features:**
- User authentication (email/password)
- JWT token-based sessions
- Basic CRUD operations (1-3 entities)
- Responsive web interface
- Mobile app (iOS/Android) with core screens
- Basic role management (User/Admin)
- PostgreSQL database setup

**Deliverables:**
- Production-ready backend API
- Web application (Next.js)
- Mobile application (Flutter)
- Basic deployment documentation

**Best For:**
- Startups validating an idea
- Internal tools with limited users
- Simple directory or listing apps
- Portfolio projects with authentication

---

#### Standard Tier ($3,000 - $7,000)

**Included Features:**
- Everything in Basic, plus:
- Email notifications (transactional emails)
- Password reset flow
- Email verification
- File upload and storage (images, documents)
- Extended CRUD operations (4-8 entities)
- Basic admin panel
- User profile management
- Search and filtering

**Deliverables:**
- Everything in Basic, plus:
- Email integration documentation
- File storage configuration
- Admin panel access
- API documentation

**Best For:**
- Small business applications
- Content management systems
- Document sharing platforms
- Membership sites

---

#### Premium Tier ($7,000 - $15,000)

**Included Features:**
- Everything in Standard, plus:
- Payment integration (Stripe/Razorpay)
- Subscription management
- Analytics dashboard
- Full admin dashboard with metrics
- Advanced user management
- Notification system (push, in-app)
- Report generation
- Data export (CSV, PDF)
- Extended CRUD (8-15 entities)

**Deliverables:**
- Everything in Standard, plus:
- Payment gateway documentation
- Analytics implementation guide
- Admin training session (1 hour)
- Staging environment setup

**Best For:**
- SaaS applications
- E-commerce platforms
- Subscription-based services
- Multi-tenant applications

---

#### Enterprise Tier ($15,000 - $30,000+)

**Included Features:**
- Everything in Premium, plus:
- Custom integrations (third-party APIs)
- Advanced analytics and reporting
- Multi-tenancy support
- Advanced security features
- Custom workflows
- API rate limiting and quotas
- Audit logging
- White-labeling options
- Performance optimization
- Load testing

**Deliverables:**
- Everything in Premium, plus:
- Architecture documentation
- Security audit report
- Performance benchmarks
- Training sessions (up to 4 hours)
- 30-day post-launch support
- SLA agreement

**Best For:**
- Enterprise software
- Multi-organization platforms
- Compliance-heavy industries
- High-traffic applications

---

## Individual Module Pricing

For clients who need specific features added to an existing project or want to customize their package.

### Core Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **Authentication** | Medium | $800 - $1,500 | 3-5 days | JWT auth, login, register, password reset, email verification |
| **User Management** | Low-Medium | $500 - $1,000 | 2-4 days | Profile management, account settings, role management |
| **CRUD Framework** | Low | $300 - $600 per entity | 1-2 days each | Basic create, read, update, delete operations |
| **Search & Filtering** | Medium | $600 - $1,200 | 2-4 days | Full-text search, advanced filters, pagination |

### Communication Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **Email Integration** | Medium | $800 - $1,500 | 3-5 days | Transactional emails, templates, queue system |
| **Push Notifications** | Medium-High | $1,000 - $2,000 | 4-7 days | FCM/APNS integration, notification management |
| **In-App Notifications** | Medium | $700 - $1,200 | 3-5 days | Real-time notifications, read/unread states |
| **SMS Integration** | Medium | $600 - $1,000 | 2-4 days | OTP verification, SMS notifications |

### Storage & Media Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **File Upload** | Medium | $800 - $1,500 | 3-5 days | Image/document upload, S3/local storage, validation |
| **Media Processing** | High | $1,500 - $3,000 | 5-10 days | Image resizing, video transcoding, thumbnails |
| **Document Generation** | Medium-High | $1,000 - $2,000 | 4-7 days | PDF generation, reports, invoices |

### Payment Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **One-time Payments** | Medium | $1,000 - $2,000 | 4-7 days | Stripe/Razorpay checkout, payment processing |
| **Subscriptions** | High | $2,000 - $4,000 | 7-14 days | Recurring billing, plan management, upgrades/downgrades |
| **Invoice System** | Medium-High | $1,200 - $2,500 | 5-10 days | Invoice generation, payment tracking, reminders |
| **Multi-currency** | Medium | $800 - $1,500 | 3-5 days | Currency conversion, localized pricing |

### Analytics & Reporting Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **Basic Analytics** | Medium | $800 - $1,500 | 3-5 days | User metrics, basic charts, activity logs |
| **Advanced Analytics** | High | $2,000 - $4,000 | 7-14 days | Custom dashboards, data visualization, trends |
| **Report Generation** | Medium | $1,000 - $2,000 | 4-7 days | Scheduled reports, export to PDF/CSV/Excel |
| **Audit Logging** | Medium | $700 - $1,200 | 3-5 days | Action tracking, compliance logs, admin audit trail |

### Admin & Management Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **Basic Admin Panel** | Medium | $1,000 - $2,000 | 4-7 days | User management, content moderation, settings |
| **Full Admin Dashboard** | High | $3,000 - $6,000 | 10-20 days | Complete admin suite, analytics, all CRUD operations |
| **Multi-tenant Admin** | High | $4,000 - $8,000 | 15-30 days | Organization management, tenant isolation |
| **Role & Permissions** | Medium-High | $1,200 - $2,500 | 5-10 days | Custom roles, fine-grained permissions |

### Integration Modules

| Module | Complexity | Price Range | Dev Time | Description |
|--------|------------|-------------|----------|-------------|
| **OAuth/Social Login** | Medium | $600 - $1,200 | 2-4 days | Google, Facebook, Apple sign-in |
| **Third-party API** | Variable | $500 - $2,000+ | 2-10 days | Custom integrations (varies by API complexity) |
| **Webhook System** | Medium | $800 - $1,500 | 3-5 days | Outgoing webhooks, retry logic, logging |
| **Calendar Integration** | Medium | $800 - $1,500 | 3-5 days | Google Calendar, Outlook sync |

---

## Add-on Services

Services that complement the core development work.

### Deployment & DevOps

| Service | Price Range | Description |
|---------|-------------|-------------|
| **Basic Deployment** | $500 - $1,000 | Single environment setup (production) on VPS/cloud |
| **Full Deployment** | $1,000 - $2,000 | Staging + production environments, SSL, domain setup |
| **CI/CD Pipeline** | $300 - $500 | GitHub Actions/GitLab CI for automated testing and deployment |
| **Docker Setup** | $400 - $800 | Containerization with docker-compose |
| **Kubernetes Setup** | $1,500 - $3,000 | K8s deployment configuration, scaling setup |
| **Monitoring Setup** | $500 - $1,000 | Error tracking, uptime monitoring, alerting |

### Documentation & Training

| Service | Price Range | Description |
|---------|-------------|-------------|
| **API Documentation** | $500 - $1,000 | OpenAPI/Swagger documentation, Postman collection |
| **User Documentation** | $500 - $1,500 | User guides, help articles, FAQ |
| **Technical Documentation** | $800 - $2,000 | Architecture docs, deployment guides, developer onboarding |
| **Training Sessions** | $100 - $200/hour | Live training for client's team |
| **Video Tutorials** | $500 - $1,500 | Recorded training videos |

### Maintenance & Support

| Service | Price Range | Description |
|---------|-------------|-------------|
| **Basic Maintenance** | $200 - $300/month | Security updates, minor bug fixes, 48hr response |
| **Standard Maintenance** | $300 - $500/month | Basic + performance monitoring, 24hr response |
| **Premium Maintenance** | $500 - $1,000/month | Standard + feature updates, priority support, 4hr response |
| **Enterprise Support** | $1,000 - $2,500/month | Dedicated support, SLA, on-call availability |

### Consultation

| Service | Price Range | Description |
|---------|-------------|-------------|
| **Technical Consultation** | $100 - $200/hour | Architecture review, technology recommendations |
| **Code Review** | $500 - $1,500 | One-time comprehensive code review |
| **Performance Audit** | $800 - $2,000 | Performance analysis and optimization recommendations |
| **Security Audit** | $1,000 - $3,000 | Security assessment and vulnerability report |

---

## Pricing Calculator

Use these example calculations to estimate project costs for different scenarios.

### Example 1: Simple MVP

**Client Need:** A mobile app for a local business to manage appointments

| Item | Price |
|------|-------|
| Basic Tier (Auth + CRUD + UI) | $2,000 |
| Push Notifications | $1,200 |
| Basic Deployment | $500 |
| **Total** | **$3,700** |
| Timeline: 2-3 weeks | |

---

### Example 2: Content Platform

**Client Need:** An e-learning platform with course management and payments

| Item | Price |
|------|-------|
| Standard Tier | $5,000 |
| Payment Integration (one-time) | $1,500 |
| Basic Analytics | $1,000 |
| Video Upload Module | $2,000 |
| Full Deployment | $1,500 |
| API Documentation | $800 |
| **Total** | **$11,800** |
| Timeline: 6-8 weeks | |

---

### Example 3: SaaS Application

**Client Need:** Multi-tenant project management tool with subscriptions

| Item | Price |
|------|-------|
| Premium Tier | $12,000 |
| Multi-tenant Admin | $5,000 |
| Subscription System | $3,000 |
| Webhook System | $1,200 |
| Full Deployment + CI/CD | $2,000 |
| Technical Documentation | $1,500 |
| Standard Maintenance (3 months) | $1,200 |
| **Total** | **$25,900** |
| Timeline: 10-14 weeks | |

---

### Example 4: Enterprise Platform

**Client Need:** Healthcare management system with compliance requirements

| Item | Price |
|------|-------|
| Enterprise Tier | $25,000 |
| HIPAA Compliance Modules | $5,000 |
| Audit Logging (Enhanced) | $2,000 |
| Custom Integrations | $8,000 |
| Security Audit | $2,500 |
| Kubernetes Setup | $2,500 |
| Premium Maintenance (6 months) | $5,000 |
| Training Sessions (10 hours) | $1,500 |
| **Total** | **$51,500** |
| Timeline: 16-24 weeks | |

---

## Negotiation Tips

### Justifying Your Pricing

1. **Emphasize Time-to-Market**
   - "Using our production-ready starter, we can deliver in 4 weeks instead of 12 weeks"
   - "This gives you a 2-month head start on your competition"

2. **Highlight Quality**
   - "Our codebase follows industry best practices and is battle-tested"
   - "You're getting clean architecture that your future developers will thank you for"

3. **Show Total Cost of Ownership**
   - "While a cheaper option might save $5K upfront, it could cost $20K in rewrites later"
   - "Our maintainable code reduces long-term maintenance costs by 40-60%"

4. **Reference the Tech Stack Value**
   - "Next.js 15 + Flutter gives you web and mobile from one codebase philosophy"
   - "TypeScript ensures fewer bugs in production"

### What to Include in Proposals

**Always Include:**
- Detailed scope breakdown
- Timeline with milestones
- Deliverables list
- Technology stack justification
- Team composition
- Communication plan
- Revision policy
- Warranty period

**Optional Upsells:**
- Extended warranty
- Priority support
- Training package
- Maintenance contract
- Future feature roadmap

### Scope Management

**Red Flags to Address Early:**
- "Can you just add this small feature?" - Have a change request process
- "We need it faster" - Show quality trade-offs
- "Our budget is limited" - Offer phased delivery

**Scope Protection Strategies:**
1. Use detailed acceptance criteria
2. Document all assumptions
3. Include a "Changes and Additions" clause
4. Bill hourly for out-of-scope work at premium rate ($150-250/hr)
5. Require sign-off at each milestone

### Discounting Guidelines

| Scenario | Acceptable Discount |
|----------|---------------------|
| Early payment (upfront) | 5-10% |
| Long-term contract (6+ months) | 10-15% |
| Referral from existing client | 5-10% |
| Case study permission | 5-10% |
| Repeat client | 10-15% |
| Startup/non-profit | Up to 20% (discretionary) |

**Never Discount:**
- For "future work promises"
- More than 20% without removing scope
- Quality assurance time
- Communication and project management time

---

## Contract Templates

### Statement of Work (SOW) Structure

```
1. PROJECT OVERVIEW
   - Client information
   - Project description
   - Business objectives

2. SCOPE OF WORK
   - Features included (detailed list)
   - Features explicitly excluded
   - Technical requirements
   - Platforms (web, iOS, Android)

3. DELIVERABLES
   - Source code (GitHub/GitLab repository)
   - Deployed applications
   - Documentation
   - Design assets (if applicable)

4. TIMELINE
   - Project start date
   - Milestone dates
   - Final delivery date
   - Buffer for revisions

5. PAYMENT TERMS
   - Total project cost
   - Payment schedule
   - Accepted payment methods
   - Late payment penalties

6. REVISIONS AND CHANGES
   - Included revision rounds
   - Change request process
   - Out-of-scope billing rate

7. ACCEPTANCE CRITERIA
   - Testing requirements
   - Sign-off process
   - Warranty period

8. INTELLECTUAL PROPERTY
   - Code ownership transfer
   - Third-party libraries
   - Pre-existing materials

9. CONFIDENTIALITY
   - NDA terms
   - Data handling

10. TERMINATION
    - Termination conditions
    - Kill fee structure
    - Deliverables on termination
```

### Payment Milestones

**Standard Structure:**

| Milestone | Payment | Description |
|-----------|---------|-------------|
| Project Kickoff | 25% | After SOW signing |
| Design/Architecture Approval | 25% | After design phase |
| Development Complete | 25% | After staging deployment |
| Final Delivery | 25% | After production deployment and sign-off |

**Alternative Structure (Lower Risk for Client):**

| Milestone | Payment | Description |
|-----------|---------|-------------|
| Project Kickoff | 20% | After SOW signing |
| Backend Complete | 20% | API ready and documented |
| Web App Complete | 20% | Web app deployed to staging |
| Mobile App Complete | 20% | Mobile apps submitted/deployed |
| Final Sign-off | 20% | After 2-week acceptance period |

**Retainer/Monthly Structure:**

For ongoing projects:
- 50% of monthly estimate upfront
- 50% at month end based on actual hours
- Or fixed monthly retainer with hour caps

---

## FAQ

### How do I handle clients who want a fixed price?

Provide a fixed price with a detailed scope. Include a change request clause that bills additional features at your hourly rate. Build in a 15-20% buffer for unknowns.

### Should I charge differently for web vs mobile?

The starter template covers both, so charge based on features, not platforms. However, if a client only needs web, you can offer a 10-15% discount.

### How do I price features not in this guide?

Use this formula:
```
Price = (Estimated Hours x Hourly Rate) x Complexity Multiplier

Complexity Multipliers:
- Simple: 1.0
- Medium: 1.25
- Complex: 1.5
- Highly Complex: 2.0
```

### When should I use hourly vs fixed pricing?

| Use Fixed Pricing | Use Hourly Pricing |
|-------------------|-------------------|
| Well-defined scope | Discovery phases |
| Standard features | Custom integrations |
| New clients | Maintenance work |
| Projects under $10K | Ongoing relationships |

### How do I handle scope creep?

1. Document the original scope clearly
2. Track all change requests in writing
3. Provide cost estimates before implementing changes
4. Invoice for approved changes monthly
5. Include "scope freeze" dates in your contract

---

## Quick Reference Card

**Minimum Viable Prices:**
- Simple app with auth: $1,500
- App with payments: $3,000
- Full SaaS: $7,000
- Enterprise: $15,000

**Hourly Rates:**
- Junior work: $50-75/hr
- Standard work: $100-150/hr
- Senior/specialized: $150-250/hr
- Rush work: +50% premium

**Timeline Multipliers:**
- Normal: 1.0x
- Fast (50% faster): 1.3x
- Rush (urgent): 1.5x-2.0x

---

*This pricing guide is a starting point. Adjust based on your market, experience level, and cost of living. Review and update pricing annually.*
