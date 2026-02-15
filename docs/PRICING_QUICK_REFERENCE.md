# Pricing Quick Reference

> One-page pricing overview for Xitolaunch.

---

## Tier Pricing

| Tier           | Price | Target User   | Key Features                 |
| -------------- | ----- | ------------- | ---------------------------- |
| **Basic**      | $0    | Hobbyists     | CRUD only, no auth           |
| **Starter**    | $49   | Side projects | + Auth, Security             |
| **Pro**        | $149  | Business apps | + Admin, RBAC, Files         |
| **Business**   | $299  | SaaS products | + Payments, Email, Real-time |
| **Enterprise** | $499  | Large scale   | + SSO, MFA, Mobile, Support  |

---

## What's NOT in Basic ($0)

❌ Authentication (Login, Register)
❌ Security (CSRF, Rate Limiting)
❌ Admin Panel
❌ User Management
❌ Payments
❌ Email
❌ File Uploads
❌ Real-time
❌ Mobile App

**Basic = CRUD skeleton only**

---

## Add-on Pricing (À La Carte)

### Authentication

| Add-on          | Price | Min Tier   |
| --------------- | ----- | ---------- |
| Social Login    | $29   | Starter    |
| Two-Factor Auth | $39   | Pro        |
| Magic Link      | $29   | Starter    |
| SSO (SAML/OIDC) | $99   | Enterprise |

### Payments

| Add-on            | Price | Min Tier |
| ----------------- | ----- | -------- |
| One-Time Payments | $49   | Starter  |
| Subscriptions     | $79   | Pro      |
| Usage Billing     | $49   | Business |
| Multi-Currency    | $29   | Business |

### Storage

| Add-on           | Price | Min Tier |
| ---------------- | ----- | -------- |
| File Uploads     | $39   | Basic    |
| Image Processing | $29   | Basic    |
| PDF Generation   | $39   | Pro      |

### Communication

| Add-on                 | Price | Min Tier |
| ---------------------- | ----- | -------- |
| Transactional Email    | $29   | Basic    |
| Email Templates        | $19   | Basic    |
| Push Notifications     | $39   | Starter  |
| Real-time (WebSockets) | $49   | Pro      |
| SMS                    | $39   | Business |

### UI

| Add-on           | Price | Min Tier |
| ---------------- | ----- | -------- |
| Dashboard Layout | $29   | Starter  |
| Admin Panel      | $49   | Pro      |
| Landing Pages    | $39   | Basic    |

### Analytics

| Add-on              | Price | Min Tier |
| ------------------- | ----- | -------- |
| Basic Charts        | $29   | Starter  |
| Analytics Dashboard | $49   | Pro      |
| Data Export (CSV)   | $19   | Basic    |
| PDF Reports         | $39   | Pro      |

### Mobile

| Add-on          | Price | Min Tier |
| --------------- | ----- | -------- |
| Flutter App     | $99   | Starter  |
| Mobile Push     | $39   | Starter  |
| Offline Support | $49   | Pro      |

---

## Template Pricing

| Template      | Price | Equivalent  | Savings |
| ------------- | ----- | ----------- | ------- |
| **LMS**       | $299  | ~$426 value | 30%     |
| **Booking**   | $249  | ~$347 value | 28%     |
| **Events**    | $199  | ~$277 value | 28%     |
| **Invoicing** | $179  | ~$246 value | 27%     |
| **Tasks**     | $199  | ~$281 value | 29%     |
| **Helpdesk**  | $249  | ~$343 value | 27%     |
| **CRM**       | $349  | ~$491 value | 29%     |

---

## Quick Examples

### Example 1: Simple Auth App

```
Starter Tier                    $49
+ Dashboard Layout              $29
+ Basic Charts                  $29
                              ─────
                        TOTAL: $107
```

### Example 2: SaaS with Payments

```
Pro Tier                       $149
+ Subscriptions                 $79
+ Transactional Email           $29
+ Real-time                     $49
                              ─────
                        TOTAL: $306

💡 Or upgrade to Business ($299) and SAVE $7!
   Business includes Payments + Email
```

### Example 3: Full LMS

```
LMS Template                   $299
+ Flutter Mobile App            $99
+ Discussion Forums             $49
                              ─────
                        TOTAL: $447
```

### Example 4: Basic API Only

```
Basic Tier                       $0
+ File Uploads                  $39
+ Transactional Email           $29
                              ─────
                        TOTAL:  $68

⚠️ No authentication included!
```

---

## Bundle Discounts

| Bundle              | Includes                  | Price | Savings |
| ------------------- | ------------------------- | ----- | ------- |
| **Auth Bundle**     | Social + MFA + Magic Link | $79   | $18     |
| **Comms Bundle**    | Email + Push + Real-time  | $99   | $18     |
| **Security Bundle** | Rate Limit + Audit + RBAC | $79   | $18     |

---

## Volume Discounts

| Quantity       | Discount |
| -------------- | -------- |
| 2 templates    | 10% off  |
| 3+ templates   | 15% off  |
| Team (5+ devs) | 25% off  |

---

## Revenue Examples

### Customer Profile A: Indie Dev

- Starter + Dashboard + Email = **$107**

### Customer Profile B: Startup

- Pro + Payments + Email = **$257** or Business Tier = **$299**

### Customer Profile C: Agency (builds for clients)

- 3 templates (LMS + Booking + Events) = $747 - 15% = **$635**

### Customer Profile D: Enterprise

- Enterprise Tier + Custom = **$499+**

---

## Company Admin Features (Free for Us)

| Feature             | Description                 |
| ------------------- | --------------------------- |
| Sales Dashboard     | Revenue, orders, conversion |
| Order Management    | View, refund, regenerate    |
| Template Management | CRUD templates              |
| User Management     | Customer accounts           |
| Coupon System       | Discounts, promotions       |
| Analytics           | Feature popularity, funnels |
| Reports             | Revenue, exports            |

---

## Customer Admin (Paid Add-on)

Included in: **Pro, Business, Enterprise** tiers

Or add to Starter for **$49**

Features:

- User management
- Role-based access
- Audit logs
- Settings
- Analytics dashboard

---

_Last Updated: 2026-02-08_
