# Development Cheatsheets

> Production-grade development guides for building clean, maintainable, robust & performant applications.

**Review these before every major release.**

---

## Quick Navigation

| Cheatsheet | Lines | When to Use |
|------------|-------|-------------|
| [Web App Quality](./WEB_APP_QUALITY_CHEATSHEET.md) | ~450 | Starting any project, pre-launch review |
| [Frontend UI](./FRONTEND_UI_CHEATSHEET.md) | ~450 | Building user interfaces |
| [Backend](./BACKEND_CHEATSHEET.md) | ~1000 | API development, server-side logic |
| [Database & ORM](./DATABASE_ORM_CHEATSHEET.md) | ~1200 | Schema design, queries, Prisma |
| [Deployment & Server](./DEPLOYMENT_SERVER_CHEATSHEET.md) | ~1570 | DevOps, CI/CD, infrastructure |
| [Mobile Flutter](./MOBILE_FLUTTER_CHEATSHEET.md) | ~2030 | Flutter app development |

---

## By Development Phase

### 1. Planning & Architecture
- [ ] [Web App Quality](./WEB_APP_QUALITY_CHEATSHEET.md) → Section 1: Planning & Architecture
- [ ] [Backend](./BACKEND_CHEATSHEET.md) → Section 1: Foundations & Architecture
- [ ] [Database](./DATABASE_ORM_CHEATSHEET.md) → Section 2: Schema Design
- [ ] [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md) → Section 1: Project Structure

### 2. Development
- [ ] [Frontend UI](./FRONTEND_UI_CHEATSHEET.md) → Components, State, Performance
- [ ] [Backend](./BACKEND_CHEATSHEET.md) → API Design, Error Handling, Security
- [ ] [Database](./DATABASE_ORM_CHEATSHEET.md) → Queries, Indexing, Prisma
- [ ] [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md) → State Management, Networking, UI

### 3. Testing
- [ ] [Web App Quality](./WEB_APP_QUALITY_CHEATSHEET.md) → Section 5: Testing Strategy
- [ ] [Frontend UI](./FRONTEND_UI_CHEATSHEET.md) → Section 14: Testing
- [ ] [Backend](./BACKEND_CHEATSHEET.md) → Section 16: Testing
- [ ] [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md) → Section 11: Testing

### 4. Pre-Launch
- [ ] [Web App Quality](./WEB_APP_QUALITY_CHEATSHEET.md) → Pre-Launch Checklist
- [ ] [Frontend UI](./FRONTEND_UI_CHEATSHEET.md) → Pre-Launch Checklist
- [ ] [Backend](./BACKEND_CHEATSHEET.md) → Pre-Launch Checklist
- [ ] [Database](./DATABASE_ORM_CHEATSHEET.md) → Pre-Launch Database Checklist
- [ ] [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md) → Pre-Launch Deployment Checklist
- [ ] [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md) → Pre-Launch Checklist

### 5. Deployment
- [ ] [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md) → Full guide

---

## By Topic

### Security
| Topic | Location |
|-------|----------|
| OWASP Top 10 | [Web App Quality](./WEB_APP_QUALITY_CHEATSHEET.md#4-robustness--security-owasp-top-10) |
| Authentication & JWT | [Backend](./BACKEND_CHEATSHEET.md#4-authentication--authorization) |
| Input Validation | [Backend](./BACKEND_CHEATSHEET.md#6-input-validation--sanitization) |
| Rate Limiting | [Backend](./BACKEND_CHEATSHEET.md#11-rate-limiting) |
| Security Headers | [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md#7-reverse-proxy--load-balancing) |
| Mobile Security | [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md#13-security) |

### Performance
| Topic | Location |
|-------|----------|
| Core Web Vitals | [Frontend UI](./FRONTEND_UI_CHEATSHEET.md#6-performance-core-web-vitals) |
| Backend Optimization | [Backend](./BACKEND_CHEATSHEET.md#9-caching) |
| Database Queries | [Database](./DATABASE_ORM_CHEATSHEET.md#5-query-optimization) |
| Flutter Performance | [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md#8-performance-optimization) |

### State Management
| Topic | Location |
|-------|----------|
| React (Zustand, React Query) | [Frontend UI](./FRONTEND_UI_CHEATSHEET.md#8-state-management) |
| Flutter (Provider, Riverpod, BLoC) | [Mobile](./MOBILE_FLUTTER_CHEATSHEET.md#2-state-management) |

### Database
| Topic | Location |
|-------|----------|
| Schema Design | [Database](./DATABASE_ORM_CHEATSHEET.md#2-schema-design-principles) |
| Indexing | [Database](./DATABASE_ORM_CHEATSHEET.md#4-indexing-strategy) |
| Query Optimization | [Database](./DATABASE_ORM_CHEATSHEET.md#5-query-optimization) |
| PostgreSQL Features | [Database](./DATABASE_ORM_CHEATSHEET.md#6-postgresql-advanced-features) |
| Prisma ORM | [Database](./DATABASE_ORM_CHEATSHEET.md#7-prisma-orm) |
| Migrations | [Database](./DATABASE_ORM_CHEATSHEET.md#8-migrations) |

### DevOps & Deployment
| Topic | Location |
|-------|----------|
| Docker | [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md#2-containerization-docker) |
| CI/CD | [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md#3-cicd-pipeline) |
| Kubernetes | [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md#5-kubernetes-basics) |
| SSL/HTTPS | [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md#8-ssltls--https) |
| Monitoring | [Deployment](./DEPLOYMENT_SERVER_CHEATSHEET.md#10-monitoring--observability) |

---

## Key Principles

### Start Simple, Scale When Needed
```
Solo/Small Team  →  Managed platforms (Vercel, Render, Railway)
Growing Team     →  Containers (ECS, Cloud Run)
Large Team       →  Kubernetes + full IaC
```

### Architecture Layers
```
┌─────────────────────────────────────────┐
│           Presentation (UI)             │
├─────────────────────────────────────────┤
│           Application (Services)        │
├─────────────────────────────────────────┤
│           Domain (Business Logic)       │
├─────────────────────────────────────────┤
│           Infrastructure (Data/APIs)    │
└─────────────────────────────────────────┘
```

### The Testing Pyramid
```
         ╱╲
        ╱  ╲      E2E (few)
       ╱────╲
      ╱      ╲    Integration
     ╱────────╲
    ╱          ╲  Unit (many)
   ╱────────────╲
```

---

## Cheatsheet Summaries

### [Web App Quality](./WEB_APP_QUALITY_CHEATSHEET.md)
The master checklist covering all aspects of building production-grade applications:
- Planning & Architecture
- Code Quality
- Security (OWASP Top 10)
- Testing Strategy
- Accessibility
- SEO
- Internationalization
- Deployment
- Monitoring
- Compliance

### [Frontend UI](./FRONTEND_UI_CHEATSHEET.md)
Everything for building modern, performant user interfaces:
- Semantic HTML & Structure
- Design Systems & Theming
- Component Patterns
- Forms & Validation
- Loading/Error/Empty States
- Performance (Core Web Vitals)
- Accessibility
- State Management
- Animations
- Testing

### [Backend](./BACKEND_CHEATSHEET.md)
Server-side development best practices:
- API Design (REST)
- Authentication & Authorization
- Database Access
- Input Validation
- Error Handling
- Logging
- Caching
- Background Jobs
- Rate Limiting
- Security
- Testing

### [Database & ORM](./DATABASE_ORM_CHEATSHEET.md)
Deep dive into PostgreSQL and Prisma:
- Database Selection
- Schema Design
- Relationships & Constraints
- Indexing Strategy
- Query Optimization
- PostgreSQL Features (JSONB, CTEs, Window Functions)
- Prisma Patterns
- Migrations
- Connection Pooling
- Backup & Recovery

### [Deployment & Server](./DEPLOYMENT_SERVER_CHEATSHEET.md)
DevOps and infrastructure guide:
- Deployment Strategies
- Docker Best Practices
- CI/CD Pipelines
- Kubernetes Essentials
- Configuration & Secrets
- Reverse Proxy (Nginx)
- SSL/TLS
- CDN & Caching
- Monitoring & Alerting
- Scaling
- Security Hardening
- Disaster Recovery

### [Mobile Flutter](./MOBILE_FLUTTER_CHEATSHEET.md)
Complete Flutter development guide:
- Clean Architecture
- State Management (Provider, Riverpod, BLoC)
- Error Handling (Either Pattern)
- Networking (Dio, Interceptors)
- Local Storage
- Navigation (go_router)
- UI Components & Theming
- Performance
- Accessibility
- Internationalization
- Testing
- App Store Deployment
- Security

---

## Usage Tips

1. **Bookmark the Pre-Launch Checklists** - Use them before every release
2. **Use Ctrl+F** - Each cheatsheet is comprehensive; search for specific topics
3. **Copy Code Examples** - They're production-ready patterns
4. **Check the Resources** - Each cheatsheet ends with curated links
5. **Keep Updated** - These reflect 2025-2026 best practices

---

## Contributing

Found something missing or outdated? These cheatsheets are living documents. Update them as best practices evolve.

---

*Total: ~6,700 lines of actionable documentation*

*Last updated: February 2026*
