# Web App Quality Cheatsheet

> Building Clean, Maintainable, Robust, Production-Grade & Performant Applications

---

## 1. Planning & Architecture

- [ ] Choose proven tech stack (community + ecosystem > hype)
- [ ] Prefer modular monolith → microservices only when needed
- [ ] Design API-first (REST / GraphQL) with versioning (`/api/v1/`)
- [ ] Define clear boundaries & interfaces between layers
- [ ] Think about scalability & deployment from day 1
- [ ] Document architecture decisions (ADRs)
- [ ] Plan database schema with future migrations in mind
- [ ] Define data retention & deletion policies early

---

## 2. Code Quality & Cleanliness

- [ ] Enforce style: ESLint + Prettier (or equivalent)
- [ ] Single responsibility – small functions (< 20–30 lines)
- [ ] Descriptive names – no abbreviations unless standard
- [ ] No magic numbers/strings → constants / enums
- [ ] Git hygiene: meaningful commits, small PRs, code reviews
- [ ] No commented-out code – use git history
- [ ] Consistent error handling patterns across codebase
- [ ] Type safety (TypeScript strict mode, Dart strong mode)
- [ ] Avoid premature abstraction – three strikes rule

---

## 3. Maintainability Essentials

- [ ] Environment variables for all config & secrets (`.env`)
- [ ] Dependency lock files (`package-lock.json`, `yarn.lock`, `pubspec.lock`)
- [ ] Consistent folder structure by feature / domain
- [ ] Inline documentation (JSDoc / type hints) + README
- [ ] Auto-generated API docs (Swagger / OpenAPI)
- [ ] Regularly update dependencies (Dependabot / Renovate)
- [ ] Database migration strategy (versioned, reversible)
- [ ] Changelog for significant changes

---

## 4. Robustness & Security (OWASP Top 10)

### Authentication & Authorization
- [ ] Secure authentication (JWT with refresh tokens, OAuth 2.0)
- [ ] Password hashing (bcrypt/argon2, never plain text)
- [ ] Session management with secure, httpOnly cookies
- [ ] Role-based access control (RBAC) or attribute-based (ABAC)
- [ ] Account lockout after failed attempts

### Input & Output
- [ ] Validate & sanitize ALL input (frontend + backend)
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Output encoding (prevent XSS)
- [ ] Content Security Policy (CSP) headers
- [ ] File upload validation (type, size, malware scanning)

### Infrastructure
- [ ] HTTPS everywhere (TLS 1.3)
- [ ] Secure cookies (Secure, HttpOnly, SameSite)
- [ ] CORS configured correctly (not `*` in production)
- [ ] Rate limiting + request size limits
- [ ] Security headers (X-Frame-Options, X-Content-Type-Options)

### Data Protection
- [ ] Encrypt sensitive data at rest
- [ ] Database transactions + constraints
- [ ] Regular automated backups (tested restores)
- [ ] Audit logging for sensitive operations

---

## 5. Testing Strategy

| Type | Coverage Target | Tools |
|------|-----------------|-------|
| Unit | 80%+ on business logic | Jest, Vitest, flutter_test |
| Integration | API + DB + services | Supertest, Testcontainers |
| E2E | Critical user flows | Cypress, Playwright |

- [ ] Test happy path + edge cases + failure scenarios
- [ ] Run tests in CI – never merge without passing
- [ ] Snapshot testing for UI components (with caution)
- [ ] Contract testing for API consumers
- [ ] Load testing before launch (k6, Artillery)

---

## 6. Accessibility (A11y) - Often Overlooked!

- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, not `<div>` for everything)
- [ ] ARIA labels where semantic HTML isn't sufficient
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Alt text for images
- [ ] Form labels properly associated
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] No content conveyed by color alone
- [ ] Responsive text (user can scale to 200%)

**Tools**: axe-core, Lighthouse, WAVE

---

## 7. SEO & Discoverability (Public-Facing Apps)

- [ ] Semantic HTML structure (h1-h6 hierarchy)
- [ ] Meta tags (title, description, Open Graph, Twitter cards)
- [ ] Canonical URLs
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Structured data (JSON-LD) for rich snippets
- [ ] Server-side rendering (SSR) or static generation for content pages
- [ ] Fast loading (Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Mobile-friendly (responsive design)

---

## 8. Internationalization (i18n) - Plan Early

- [ ] Externalize all user-facing strings
- [ ] Support RTL languages if targeting global market
- [ ] Date, time, number, currency formatting (use Intl API)
- [ ] Pluralization support
- [ ] Don't concatenate translated strings
- [ ] Consider text expansion (German ~30% longer than English)
- [ ] Locale detection (Accept-Language, user preference)

---

## 9. Production Deployment

### CI/CD
- [ ] Automated pipeline (GitHub Actions, GitLab CI)
- [ ] Separate environments (dev / staging / prod)
- [ ] Staging ≈ production environment
- [ ] Zero-downtime deploys (blue-green / rolling)
- [ ] Rollback strategy tested

### Infrastructure
- [ ] Infrastructure as Code (Terraform / Pulumi) when scaling
- [ ] Health checks + readiness probes
- [ ] Graceful shutdown handling
- [ ] Secret management (Vault, AWS Secrets Manager, Doppler)
- [ ] Container security scanning

---

## 10. Monitoring & Observability

### Logging
- [ ] Structured logging (JSON format)
- [ ] Correlation IDs across requests
- [ ] Log levels used appropriately (error, warn, info, debug)
- [ ] No sensitive data in logs (PII, passwords, tokens)

### Monitoring
- [ ] Error tracking (Sentry, LogRocket)
- [ ] APM (New Relic, Datadog, Prometheus + Grafana)
- [ ] Uptime monitoring
- [ ] Real user monitoring (RUM)

### Alerting
- [ ] Alerts on: error rate spike, latency > threshold, 5xx errors
- [ ] On-call rotation defined
- [ ] Runbooks for common incidents

### Business Metrics
- [ ] Track key metrics (sign-ups, conversions, churn)
- [ ] Analytics (privacy-compliant: Plausible, PostHog, Mixpanel)

---

## 11. Performance Optimization

> **Golden Rule**: Measure → Identify Bottleneck → Optimize → Measure Again

### Frontend
- [ ] Code splitting + lazy loading routes
- [ ] Bundle analysis (webpack-bundle-analyzer)
- [ ] Tree shaking enabled
- [ ] Image optimization (WebP/AVIF, lazy loading, srcset)
- [ ] CDN for static assets
- [ ] Memoization (React.memo, useMemo, useCallback)
- [ ] Virtual scrolling for long lists
- [ ] Service worker for caching (PWA)

### Backend
- [ ] Database indexes on query columns
- [ ] Avoid N+1 queries (use eager loading)
- [ ] Connection pooling
- [ ] Caching strategy (Redis, CDN, HTTP cache headers)
- [ ] Async/non-blocking I/O
- [ ] Response compression (gzip/brotli)
- [ ] Pagination for list endpoints
- [ ] Stateless services (horizontal scaling ready)

### Database
- [ ] Query analysis & optimization (EXPLAIN)
- [ ] Proper indexing strategy
- [ ] Read replicas for read-heavy workloads
- [ ] Connection pooling (PgBouncer, ProxySQL)

---

## 12. Mobile-Specific (Flutter/React Native)

- [ ] Offline-first architecture where appropriate
- [ ] Optimistic UI updates
- [ ] Handle poor network conditions gracefully
- [ ] Deep linking configured
- [ ] Push notification handling (foreground/background)
- [ ] App store metadata prepared
- [ ] Crash reporting (Crashlytics, Sentry)
- [ ] Memory leak detection
- [ ] Battery usage optimization
- [ ] Biometric authentication support

---

## 13. Legal & Compliance

- [ ] Privacy policy (required for app stores)
- [ ] Terms of service
- [ ] Cookie consent banner (GDPR, ePrivacy)
- [ ] GDPR compliance if serving EU users:
  - [ ] Data export capability
  - [ ] Account deletion capability
  - [ ] Consent management
  - [ ] Data processing agreements with vendors
- [ ] CCPA compliance if serving California users
- [ ] Accessibility compliance (ADA, WCAG 2.1 AA)
- [ ] PCI DSS if handling payments directly

---

## 14. Developer Experience

- [ ] README with setup instructions (< 5 minutes to run locally)
- [ ] Consistent development environment (Docker, devcontainers)
- [ ] Pre-commit hooks (lint, format, type-check)
- [ ] Clear contribution guidelines
- [ ] Issue/PR templates
- [ ] Local development doesn't require production secrets
- [ ] Seed data for development/testing
- [ ] API mocking for frontend development

---

## 15. Disaster Recovery

- [ ] Automated backups verified (test restores!)
- [ ] Point-in-time recovery capability
- [ ] Multi-region/AZ deployment for critical apps
- [ ] Incident response plan documented
- [ ] Regular disaster recovery drills
- [ ] Data breach response plan

---

## Pre-Launch Checklist

### Security
- [ ] HTTPS enforced (HSTS enabled)
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation complete
- [ ] Secrets not in codebase
- [ ] Dependencies scanned for vulnerabilities

### Reliability
- [ ] Error tracking configured
- [ ] Logging working
- [ ] Monitoring & alerts set up
- [ ] Backup strategy tested
- [ ] Load test passed

### Deployment
- [ ] CI/CD pipeline running
- [ ] Staging ≈ production
- [ ] Rollback tested
- [ ] Health checks responding

### Compliance
- [ ] Privacy policy published
- [ ] Cookie consent (if applicable)
- [ ] Accessibility audit passed

### Performance
- [ ] Lighthouse score > 90 (Performance, A11y, Best Practices, SEO)
- [ ] Core Web Vitals passing
- [ ] Mobile performance tested

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Google Web Vitals](https://web.dev/vitals/)
- [12 Factor App](https://12factor.net/)
- [Security Headers](https://securityheaders.com/)

---

*Last updated: February 2026*
